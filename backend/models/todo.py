from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin, SHANGHAI_TZ


class Todo(Base, IdMixin, TimestampMixin, AuditMixin):
    """待办事项表 - 存储用户创建的个人待办"""

    __tablename__ = "sys_todo"

    user_id: Mapped[str] = mapped_column(
        String(36), index=True, comment="创建用户ID"
    )
    title: Mapped[str] = mapped_column(String(100), comment="待办标题")
    description: Mapped[str | None] = mapped_column(Text, comment="待办描述")
    priority: Mapped[int] = mapped_column(
        Integer, default=0, comment="优先级: 0-低 1-中 2-高"
    )
    status: Mapped[int] = mapped_column(
        Integer, default=0, comment="状态: 0-待办 1-已完成"
    )
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="截止日期"
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="完成时间"
    )
    category: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="分类标签"
    )

    # 复合索引：用户ID + 状态，用于快速查询用户的待办/已完成
    __table_args__ = (
        Index("idx_todo_user_status", "user_id", "status"),
        Index("idx_todo_user_priority", "user_id", "priority"),
    )

    def mark_as_completed(self) -> None:
        """标记待办为已完成"""
        if self.status == 0:
            self.status = 1
            self.completed_at = datetime.now(SHANGHAI_TZ)

    def mark_as_pending(self) -> None:
        """标记待办为待办状态（撤销完成）"""
        if self.status == 1:
            self.status = 0
            self.completed_at = None

    def toggle_status(self) -> None:
        """切换待办状态"""
        if self.status == 0:
            self.mark_as_completed()
        else:
            self.mark_as_pending()
