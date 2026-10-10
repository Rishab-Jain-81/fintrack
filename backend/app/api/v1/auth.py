import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import Update, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import RefreshToken, User
from app.schemas.user import TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    email = user_in.email.lower()
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    new_user = User(
        email=email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="user",
        is_active=True,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and aquire access and refresh tokens",
)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> TokenResponse:
    query = select(User).where(User.email == form_data.username.lower())
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if (
        not user
        or not verify_password(form_data.password, user.hashed_password)
        or not user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id, role=user.role)

    raw_refresh = generate_refresh_token()
    hash_refresh_token = hash_token(raw_refresh)
    family_id = uuid.uuid4()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token,
        family_id=family_id,
        expires_at=expires_at,
    )

    db.add(refresh_token)
    await db.commit()

    response.set_cookie(
        key="refresh_token",
        value=raw_refresh,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        path=f"{settings.api_v1_str}/auth",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and acquire new access token",
)
async def refresh_access_token(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> TokenResponse:

    raw_refresh = request.cookies.get("refresh_token")

    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not logged in. Please log in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_hash = hash_token(raw_refresh)

    query = (
        select(RefreshToken, User)
        .join(User, RefreshToken.user_id == User.id)
        .where(RefreshToken.token_hash == token_hash)
    )
    result = await db.execute(query)
    record = result.first()

    if not record:
        response.delete_cookie(
            key="refresh_token",
            path=f"{settings.api_v1_str}/auth",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_token, user = record

    if db_token.is_revoked:
        await db.execute(
            Update(RefreshToken)
            .where(RefreshToken.family_id == db_token.family_id)
            .values(is_revoked=True)
        )
        await db.commit()

        response.delete_cookie(key="refresh_token", path=f"{settings.api_v1_str}/auth")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Compromised token reuse detected. All active sessions invalidated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or db_token.expires_at < datetime.now(timezone.utc):
        response.delete_cookie(
            key="refresh_token",
            path=f"{settings.api_v1_str}/auth",
        )
        raise HTTPException(
            status_code="401_UNAUTHORIZED",
            detail="Refresh token expired or user inactive.",
        )

    db_token.is_revoked = True

    new_raw_refresh = generate_refresh_token()
    new_hash_refresh_token = hash_token(new_raw_refresh)
    new_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    new_token = RefreshToken(
        user_id=user.id,
        token_hash=new_hash_refresh_token,
        family_id=db_token.family_id,
        expires_at=new_expires_at,
    )
    db.add(new_token)
    await db.commit()

    new_access_token = create_access_token(subject=user.id, role=user.role)

    response.set_cookie(
        key="refresh_token",
        value=new_raw_refresh,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        path=f"{settings.api_v1_str}/auth",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
    )

    return TokenResponse(access_token=new_access_token, token_type="bearer")


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out and revoke refresh token session",
)
async def logout(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> None:
    raw_refresh = request.cookies.get("refresh_token")
    if raw_refresh:
        token_hash = hash_token(raw_refresh)

        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(query)
        token = result.scalar_one_or_none()
        if token:
            token.is_revoked = True
            await db.commit()

    response.delete_cookie(key="refresh_token", path=f"{settings.api_v1_str}/auth")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="",
)
async def read_current_user(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> User:
    return current_user
