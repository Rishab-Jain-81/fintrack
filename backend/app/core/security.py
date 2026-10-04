import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

from app.core.config import settings

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(
    subject: str | Any, role: str, expires_delta: timedelta | None = None
) -> str:

    expire = (
        (datetime.now(timezone.utc) + expires_delta)
        if expires_delta
        else (
            datetime.now(timezone.utc)
            + timedelta(minutes=settings.access_token_expire_minutes)
        )
    )

    payload = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def generate_refresh_token() -> str:
    return hash_token(secrets.token_urlsafe(32))


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
