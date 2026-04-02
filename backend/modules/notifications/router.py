from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import get_current_user
from core.responses import success
from db.session import get_db
from models.notification import Notification
from models.user import User
from schemas.notification import (
    NotificationCountResponse,
    NotificationListResponse,
    NotificationPageParams,
    NotificationResponse,
    NotificationUpdate,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    params: NotificationPageParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取通知列表"""
    stmt = select(Notification).where(Notification.user_id == current_user.id)
    count_stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id
    )

    # 筛选条件
    if params.is_read is not None:
        stmt = stmt.where(Notification.is_read == params.is_read)
        count_stmt = count_stmt.where(Notification.is_read == params.is_read)
    if params.category:
        stmt = stmt.where(Notification.category == params.category)
        count_stmt = count_stmt.where(Notification.category == params.category)

    # 排序和分页
    stmt = stmt.order_by(Notification.create_time.desc())
    stmt = stmt.offset((params.page - 1) * params.page_size).limit(params.page_size)

    items = db.execute(stmt).scalars().all()
    total = db.execute(count_stmt).scalar()

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
    )


@router.get("/unread", response_model=list[NotificationResponse])
def get_unread_notifications(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取未读通知"""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .order_by(Notification.create_time.desc())
        .limit(limit)
    )
    items = db.execute(stmt).scalars().all()
    return [NotificationResponse.model_validate(item) for item in items]


@router.get("/count", response_model=NotificationCountResponse)
def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取未读通知数量统计"""
    # 总未读数
    total_stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    )
    total = db.execute(total_stmt).scalar()

    # 按类型统计
    by_type_stmt = (
        select(Notification.type, func.count())
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .group_by(Notification.type)
    )
    by_type_results = db.execute(by_type_stmt).all()
    by_type = {row[0]: row[1] for row in by_type_results}

    return NotificationCountResponse(total=total, by_type=by_type)


@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """标记通知为已读"""
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        return success(message="通知不存在")

    notification.mark_as_read()
    db.commit()
    return success(message="已标记为已读")


@router.post("/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """标记所有通知为已读"""
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    )
    notifications = db.execute(stmt).scalars().all()

    for notification in notifications:
        notification.mark_as_read()

    db.commit()
    return success(message=f"已标记 {len(notifications)} 条通知为已读")


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除通知"""
    notification = db.get(Notification, notification_id)
    if notification and notification.user_id == current_user.id:
        db.delete(notification)
        db.commit()
    return success(message="删除成功")
