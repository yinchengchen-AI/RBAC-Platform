import os
from collections.abc import Awaitable, Callable

from fastapi import Request
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError

from core.security import decode_token
from db.session import SessionLocal
from models.audit import OperationLog
from models.user import User


async def operation_log_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable],
):
    response: Response | None = None
    error_message = None

    request.state.current_user = None
    try:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "", 1)
            payload = decode_token(token)
            if payload.get("type") == "access":
                with SessionLocal() as db:
                    user = db.get(User, payload.get("sub"))
                    if user and not user.is_deleted and user.status == 1:
                        request.state.current_user = user
    except Exception:
        request.state.current_user = None

    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        error_message = str(exc)
        raise
    finally:
        should_skip_logging = (
            request.url.path.endswith("/health")
            or request.url.path.endswith("/docs")
            or request.url.path.endswith("/openapi.json")
        ) or request.method in {"GET", "OPTIONS", "HEAD"}

        if not should_skip_logging:
            if os.getenv("SKIP_DB_INIT") != "1":
                user = getattr(request.state, "current_user", None)
                target = (
                    request.path_params.get("user_id")
                    or request.path_params.get("role_id")
                    or request.path_params.get("permission_id")
                    or request.path_params.get("menu_id")
                    or request.path_params.get("file_id")
                )
                try:
                    with SessionLocal() as db:
                        db.add(
                            OperationLog(
                                user_id=getattr(user, "id", None),
                                username=getattr(user, "username", None),
                                action=f"request.{request.method.lower()}",
                                target=target,
                                detail={
                                    "path": request.url.path,
                                    "query": str(request.url.query),
                                },
                                result="failed"
                                if error_message
                                or (response and response.status_code >= 400)
                                else "success",
                                error_message=error_message,
                            )
                        )
                        db.commit()
                except SQLAlchemyError:
                    pass
