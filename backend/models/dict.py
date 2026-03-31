from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class DictType(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_dict_type"

    name: Mapped[str] = mapped_column(String(50))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    status: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class DictItem(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_dict_item"

    dict_code: Mapped[str] = mapped_column(String(50), index=True)
    label: Mapped[str] = mapped_column(String(50))
    value: Mapped[str] = mapped_column(String(50))
    sort: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[int] = mapped_column(Integer, default=1)
