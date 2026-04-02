from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.base import Base
from db.init_db import PERMISSION_DEFINITIONS, seed_system_data
from models.permission import Permission
from models.role import Role
from models.user import User


def test_seed_system_data_backfills_all_defined_permissions(monkeypatch) -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    defined_codes = {item["code"] for item in PERMISSION_DEFINITIONS}
    backfill_codes = {
        "system:user:delete",
        "system:role:delete",
        "system:permission:delete",
        "business:company:view",
        "business:contract:create",
        "business:service:view",
        "business:document:view",
        "business:invoice:create",
        "business:payment:view",
    }

    with SessionLocal() as db:
        admin_role = Role(code="super_admin", name="超级管理员", status=1)
        admin = User(
            username="admin",
            nickname="系统管理员",
            password_hash="hash",
            status=1,
            is_superuser=True,
        )
        admin.roles = [admin_role]
        db.add_all(
            [
                Permission(code="system:user:view", name="查看用户", module="users"),
                Permission(code="system:role:view", name="查看角色", module="roles"),
                Permission(
                    code="system:permission:view", name="查看权限", module="permissions"
                ),
                admin_role,
                admin,
            ]
        )
        db.commit()

    monkeypatch.setattr("db.init_db.SessionLocal", SessionLocal)
    seed_system_data()

    with SessionLocal() as db:
        permissions = db.scalars(
            select(Permission).where(Permission.code.in_(defined_codes))
        ).all()
        codes = {item.code for item in permissions}
        assert defined_codes.issubset(codes)

        admin_role = db.scalar(select(Role).where(Role.code == "super_admin"))
        assert admin_role is not None
        role_codes = {item.code for item in admin_role.permissions}
        assert backfill_codes.issubset(role_codes)
