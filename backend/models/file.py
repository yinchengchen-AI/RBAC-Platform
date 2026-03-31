from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class SysFile(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_file"

    filename: Mapped[str] = mapped_column(String(255))
    object_name: Mapped[str] = mapped_column(String(255), unique=True)
    bucket_name: Mapped[str] = mapped_column(String(100))
    url: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size: Mapped[int] = mapped_column(Integer)
