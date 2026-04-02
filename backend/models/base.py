from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# 上海时区 (UTC+8)
SHANGHAI_TZ = datetime.now().astimezone().tzinfo


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    create_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(SHANGHAI_TZ)
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(SHANGHAI_TZ),
        onupdate=lambda: datetime.now(SHANGHAI_TZ),
    )


class AuditMixin:
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class IdMixin:
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
