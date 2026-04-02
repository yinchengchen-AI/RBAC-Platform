from sqlalchemy import Column, ForeignKey, Table

from models.base import Base

user_role = Table(
    "sys_user_role",
    Base.metadata,
    Column("user_id", ForeignKey("sys_user.id"), primary_key=True),
    Column("role_id", ForeignKey("sys_role.id"), primary_key=True),
)

role_permission = Table(
    "sys_role_permission",
    Base.metadata,
    Column("role_id", ForeignKey("sys_role.id"), primary_key=True),
    Column("permission_id", ForeignKey("sys_permission.id"), primary_key=True),
)
