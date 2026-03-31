from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class SystemConfig(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_config"

    name: Mapped[str] = mapped_column(String(50))
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[str] = mapped_column(Text)
    value_type: Mapped[str] = mapped_column(String(20), default="string")
    status: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
