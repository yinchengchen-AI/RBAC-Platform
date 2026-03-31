from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin
from models.relations import role_permission


class Permission(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_permission"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    module: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    roles = relationship(
        "Role", secondary=role_permission, back_populates="permissions"
    )
