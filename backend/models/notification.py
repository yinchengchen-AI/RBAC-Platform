from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, IdMixin, TimestampMixin, SHANGHAI_TZ


class Notification(Base, IdMixin, TimestampMixin):
    """系统通知表 - 存储系统向用户推送的各类通知"""

    __tablename__ = "sys_notification"

    user_id: Mapped[str] = mapped_column(
        String(36), index=True, comment="接收用户ID"
    )
    title: Mapped[str] = mapped_column(String(100), comment="通知标题")
    content: Mapped[str] = mapped_column(Text, comment="通知内容")
    type: Mapped[str] = mapped_column(
        String(20), default="info", comment="通知类型: info/warning/success/system"
    )
    category: Mapped[str] = mapped_column(
        String(50), default="system", comment="业务分类: contract/service/finance/system"
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="是否已读"
    )
    read_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="阅读时间"
    )
    source_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, comment="关联业务ID"
    )
    source_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="关联业务类型"
    )

    # 复合索引：用户ID + 是否已读，用于快速查询用户的未读通知
    __table_args__ = (
        Index("idx_notification_user_read", "user_id", "is_read"),
    )

    def mark_as_read(self) -> None:
        """标记通知为已读"""
        if not self.is_read:
            self.is_read = True
            self.read_time = datetime.now(SHANGHAI_TZ)
