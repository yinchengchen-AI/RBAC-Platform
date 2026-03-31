from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import permission_required
from core.responses import success
from db.session import get_db
from models.audit import LoginLog, OperationLog
from models.user import User

router = APIRouter()


@router.get("/login")
def list_login_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    username: str | None = None,
    status: str | None = None,
    _: User = Depends(permission_required("system:log:view")),
    db: Session = Depends(get_db),
):
    stmt = select(LoginLog).order_by(LoginLog.create_time.desc())
    count_stmt = select(func.count()).select_from(LoginLog)

    if username:
        stmt = stmt.where(LoginLog.username.ilike(f"%{username}%"))
        count_stmt = count_stmt.where(LoginLog.username.ilike(f"%{username}%"))
    if status:
        stmt = stmt.where(LoginLog.status == status)
        count_stmt = count_stmt.where(LoginLog.status == status)

    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    total = db.scalar(count_stmt) or 0
    return success(
        {
            "items": [
                {
                    "id": item.id,
                    "username": item.username,
                    "ip": item.ip,
                    "status": item.status,
                    "message": item.message,
                    "create_time": item.create_time,
                }
                for item in items
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )


@router.get("/operation")
def list_operation_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    username: str | None = None,
    result: str | None = None,
    action: str | None = None,
    _: User = Depends(permission_required("system:log:view")),
    db: Session = Depends(get_db),
):
    stmt = select(OperationLog).order_by(OperationLog.create_time.desc())
    count_stmt = select(func.count()).select_from(OperationLog)

    if username:
        stmt = stmt.where(OperationLog.username.ilike(f"%{username}%"))
        count_stmt = count_stmt.where(OperationLog.username.ilike(f"%{username}%"))
    if result:
        stmt = stmt.where(OperationLog.result == result)
        count_stmt = count_stmt.where(OperationLog.result == result)
    if action:
        stmt = stmt.where(OperationLog.action.ilike(f"%{action}%"))
        count_stmt = count_stmt.where(OperationLog.action.ilike(f"%{action}%"))

    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    total = db.scalar(count_stmt) or 0
    return success(
        {
            "items": [
                {
                    "id": item.id,
                    "user_id": item.user_id,
                    "username": item.username,
                    "action": item.action,
                    "target": item.target,
                    "detail": item.detail,
                    "result": item.result,
                    "error_message": item.error_message,
                    "create_time": item.create_time,
                }
                for item in items
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )
