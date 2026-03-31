from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class Department(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_department"

    parent_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(50))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    leader: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[int] = mapped_column(Integer, default=1)
