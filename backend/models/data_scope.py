from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class DataScopeRule(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_data_scope_rule"

    role_id: Mapped[str] = mapped_column(String(36), index=True)
    scope_type: Mapped[str] = mapped_column(String(30), default="all")
    department_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
