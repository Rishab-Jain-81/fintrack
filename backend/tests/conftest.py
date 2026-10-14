import os

os.environ["SQLALCHEMY_WARN_20"] = "1"
os.environ["AIOPS_NO_CYTHON"] = "1"
os.environ["SQLALCHEMY_DISABLE_CYTHON"] = "1"
os.environ["PROJECT_NAME"] = "FinTrack Test"
os.environ["DEBUG"] = "true"
os.environ["API_V1_STR"] = "/api/v1"
os.environ["DATABASE_NAME"] = "fintrack_test"
os.environ["POSTGRE_HOST"] = "localhost"
os.environ["POSTGRE_PORT"] = "5432"
os.environ["POSTGRE_USER"] = "postgres"
os.environ["POSTGRE_PASSWORD"] = "postgres"
os.environ["JWT_SECRET_KEY"] = "super-secret-test-key-32-chars-long-minimum!"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["ALLOWED_ORIGINS"] = '["http://localhost:3000"]'


import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest_asyncio
from app.core.database import get_db
from app.main import app
from app.models import Base
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    execution_options={
        "compiled_cache": None
    },  # 👈 Disables compiled cache at the engine level!
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()
    asyncio.set_event_loop(None)


@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    # Set override
    app.dependency_overrides[get_db] = lambda: db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://testserver") as ac:
        yield ac

    # Clean up cleanly
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def test_user_token(client: AsyncClient) -> str:

    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    user_payload = {
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Authenticated User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201

    login_data = {
        "username": user_payload["email"],
        "password": user_payload["password"],
    }
    login_res = await client.post("api/v1/auth/login", data=login_data)

    assert login_res.status_code == 200

    token = login_res.json()["access_token"]
    return token


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, test_user_token: str) -> AsyncClient:
    client.headers.update({"Authorization": f"Bearer {test_user_token}"})
    return client
