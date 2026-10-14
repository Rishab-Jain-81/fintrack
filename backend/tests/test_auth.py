import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    payload = {
        "email": "test@example.com",
        "password": "StrongPassword123",
        "full_name": "Test Runner",
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test Runner"
    assert data["role"] == "user"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPassword123!",
        "full_name": "First User",
    }

    first_resp = await client.post("/api/v1/auth/register", json=payload)
    assert first_resp.status_code == 201

    second_resp = await client.post("/api/v1/auth/register", json=payload)
    assert second_resp.status_code == 400
    assert "already exists" in second_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    # Register
    user_payload = {
        "email": "wrongpass@example.com",
        "password": "CorrectPassword123!",
        "full_name": "Test User",
    }
    reg = await client.post("/api/v1/auth/register", json=user_payload)
    assert reg.status_code == 201

    # Login with wrong password
    login_data = {
        "username": "wrongpass@example.com",
        "password": "WrongPassword999!",
    }
    res = await client.post("/api/v1/auth/login", data=login_data)
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(auth_client: AsyncClient):
    # Tests GET /auth/me using valid token
    res = await auth_client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_invalid_jwt_token_rejected(client: AsyncClient):
    # Tests the error branches in deps.py
    headers = {"Authorization": "Bearer completely-invalid-jwt-token"}
    res = await client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_cycle(client: AsyncClient):
    # 1. Register a fresh user
    email = f"refresh_user_{uuid.uuid4().hex[:6]}@example.com"
    password = "StrongPassword123!"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Refresh Tester"},
    )
    assert reg_res.status_code == 201

    # 2. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Verify HTTP-only cookie was set
    assert "refresh_token" in login_res.cookies

    print("COOKIES ON LOGIN_RES:", login_res.cookies)
    print("COOKIES IN CLIENT JAR:", client.cookies)

    # 3. Call /auth/refresh
    # client automatically forwards the 'refresh_token' cookie stored from the previous login!
    refresh_res = await client.post("/api/v1/auth/refresh")
    print("401 DETAIL:", refresh_res.json())
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data

    # 4. Confirm new access token works against /auth/me
    auth_headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email


@pytest.mark.asyncio
async def test_refresh_without_cookie_fails(client: AsyncClient):
    # Ensure a fresh client with no cookies gets rejected
    res = await client.post("/api/v1/auth/refresh")
    assert res.status_code in (400, 401)


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient):
    # 1. Register & Login
    email = f"logout_user_{uuid.uuid4().hex[:6]}@example.com"
    password = "StrongPassword123!"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Logout Tester"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]
    assert "refresh_token" in login_res.cookies

    # 2. Logout (authenticated via Bearer header or cookie)
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    logout_res = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_res.status_code in (200, 204)

    # 3. Verify cookie was deleted/expired, or immediate refresh fails
    refresh_after_logout = await client.post("/api/v1/auth/refresh")
    assert refresh_after_logout.status_code in (400, 401)
