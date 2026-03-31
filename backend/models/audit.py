from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, IdMixin, TimestampMixin


class LoginLog(Base, IdMixin, TimestampMixin):
    __tablename__ = "sys_login_log"

    username: Mapped[str] = mapped_column(String(50))
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success")
    message: Mapped[str | None] = mapped_column(String(255), nullable=True)


class OperationLog(Base, IdMixin, TimestampMixin):
    __tablename__ = "sys_operation_log"

    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    username: Mapped[str | None] = mapped_column(String(50), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    target: Mapped[str | None] = mapped_column(String(100), nullable=True)
    detail: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    result: Mapped[str] = mapped_column(String(20), default="success")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
