from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from redis import Redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.cache import build_refresh_key, get_redis
from core.deps import bind_current_user, get_current_user
from core.responses import success
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from db.session import get_db
from models.audit import LoginLog
from models.base import SHANGHAI_TZ
from models.user import User
from schemas.auth import LoginRequest, LogoutRequest, RefreshTokenRequest

router = APIRouter()


def _serialize_user(user: User) -> dict:
    permissions = sorted(
        {permission.code for role in user.roles for permission in role.permissions}
    )
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "email": user.email,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "is_superuser": user.is_superuser,
        "permissions": permissions,
        "roles": [
            {"id": role.id, "name": role.name, "code": role.code} for role in user.roles
        ],
    }


@router.post("/login")
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    user = db.scalar(
        select(User).where(
            User.username == payload.username, User.is_deleted.is_(False)
        )
    )
    if not user or not verify_password(payload.password, user.password_hash):
        db.add(
            LoginLog(
                username=payload.username,
                ip=request.client.host if request.client else None,
                status="failed",
                message="用户名或密码错误",
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误"
        )
    if user.status != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已禁用")

    user.last_login_at = datetime.now(SHANGHAI_TZ)
    db.add(
        LoginLog(
            username=user.username,
            ip=request.client.host if request.client else None,
            status="success",
            message="登录成功",
        )
    )
    db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    redis.setex(
        build_refresh_key(user.id),
        60 * 60 * 24 * 7,
        refresh_token,
    )

    return success(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": _serialize_user(user),
        }
    )


@router.post("/refresh")
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    try:
        token_data = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc

    if token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌类型错误"
        )

    user = db.get(User, token_data.get("sub"))
    if not user or user.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    redis_key = build_refresh_key(user.id)
    stored_refresh_token = redis.get(redis_key)
    if not stored_refresh_token or stored_refresh_token != payload.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌已失效"
        )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    redis.setex(redis_key, 60 * 60 * 24 * 7, new_refresh_token)

    return success(
        {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    )


@router.post("/logout")
def logout(
    payload: LogoutRequest,
    current_user: User = Depends(bind_current_user),
    redis: Redis = Depends(get_redis),
):
    redis_key = build_refresh_key(current_user.id)
    if payload.refresh_token:
        stored_refresh_token = redis.get(redis_key)
        if stored_refresh_token == payload.refresh_token:
            redis.delete(redis_key)
    else:
        redis.delete(redis_key)
    return success(message="已退出登录")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return success(_serialize_user(current_user))
