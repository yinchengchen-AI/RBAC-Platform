from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin
from models.relations import role_menu


class Menu(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_menu"

    parent_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(20), default="menu")
    route_path: Mapped[str | None] = mapped_column(String(100), nullable=True)
    component: Mapped[str | None] = mapped_column(String(100), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sort: Mapped[int] = mapped_column(Integer, default=0)
    permission_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)

    roles = relationship("Role", secondary=role_menu, back_populates="menus")
