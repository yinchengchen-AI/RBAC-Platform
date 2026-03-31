from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra: dict[str, Any] | None = None,
) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": uuid4().hex,
        "exp": datetime.now(UTC) + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def create_access_token(subject: str) -> str:
    return create_token(
        subject, "access", timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )


def create_refresh_token(subject: str) -> str:
    return create_token(
        subject, "refresh", timedelta(days=settings.jwt_refresh_token_expire_days)
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise ValueError("token 无效或已过期") from exc
