from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin
from models.relations import role_permission, user_role


class Role(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_role"

    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[int] = mapped_column(Integer, default=1)

    users = relationship("User", secondary=user_role, back_populates="roles")
    permissions = relationship(
        "Permission", secondary=role_permission, back_populates="roles", lazy="joined"
    )
