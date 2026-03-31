from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from core.security import decode_token
from db.session import get_db
from models.user import User


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")

    token = authorization.replace("Bearer ", "", 1)
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="访问令牌类型错误"
        )

    user = db.get(User, payload.get("sub"))
    if not user or user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在"
        )
    if user.status != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已禁用")
    return user


def bind_current_user(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> User:
    request.state.current_user = current_user
    return current_user


def optional_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "", 1)
    try:
        payload = decode_token(token)
    except ValueError:
        return None

    if payload.get("type") != "access":
        return None

    user = db.get(User, payload.get("sub"))
    if not user or user.is_deleted or user.status != 1:
        return None
    return user


def permission_required(*permission_codes: str) -> Callable[[User], User]:
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        user_codes = {
            permission.code
            for role in current_user.roles
            for permission in role.permissions
        }
        if not all(code in user_codes for code in permission_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="没有权限执行该操作"
            )
        return current_user

    return checker
