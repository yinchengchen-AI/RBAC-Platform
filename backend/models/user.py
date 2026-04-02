from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin, SHANGHAI_TZ
from models.relations import user_role


class User(Base, IdMixin, TimestampMixin, AuditMixin):
    __tablename__ = "sys_user"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(50))
    department_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[int] = mapped_column(Integer, default=1)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    def update_last_login(self) -> None:
        """更新最后登录时间为上海时区"""
        self.last_login_at = datetime.now(SHANGHAI_TZ)

    roles = relationship(
        "Role", secondary=user_role, back_populates="users", lazy="joined"
    )
