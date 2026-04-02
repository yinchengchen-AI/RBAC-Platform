from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError

from core.config import settings
from core.logging import logging
from core.security import get_password_hash
from db.session import SessionLocal
from models.permission import Permission
from models.role import Role
from models.user import User


def _ensure_permissions(db, items: list[Permission]) -> list[Permission]:
    existing_codes = {
        code
        for code in db.scalars(
            select(Permission.code).where(Permission.is_deleted.is_(False))
        ).all()
    }
    created_items: list[Permission] = []
    for item in items:
        if item.code in existing_codes:
            continue
        db.add(item)
        created_items.append(item)
        existing_codes.add(item.code)
    return created_items


def seed_system_data() -> None:
    with SessionLocal() as db:
        try:
            admin = db.scalar(
                select(User).where(
                    User.username == settings.default_admin_username,
                    User.is_deleted.is_(False),
                )
            )
        except ProgrammingError:
            logging.getLogger(__name__).warning("数据库表尚未迁移完成，跳过种子初始化")
            db.rollback()
            return

        if admin:
            created_permissions = _ensure_permissions(
                db,
                [
                    Permission(
                        code="system:user:delete", name="删除用户", module="users"
                    ),
                    Permission(
                        code="system:role:delete", name="删除角色", module="roles"
                    ),
                    Permission(
                        code="system:permission:delete",
                        name="删除权限",
                        module="permissions",
                    ),
                ],
            )
            if created_permissions:
                admin_role = db.scalar(
                    select(Role).where(
                        Role.code == "super_admin", Role.is_deleted.is_(False)
                    )
                )
                if admin_role:
                    admin_role.permissions.extend(created_permissions)
                db.commit()
            return

        permissions = [
            Permission(code="system:user:view", name="查看用户", module="users"),
            Permission(code="system:user:create", name="创建用户", module="users"),
            Permission(code="system:user:update", name="编辑用户", module="users"),
            Permission(code="system:user:delete", name="删除用户", module="users"),
            Permission(code="system:role:view", name="查看角色", module="roles"),
            Permission(code="system:role:create", name="创建角色", module="roles"),
            Permission(code="system:role:update", name="编辑角色", module="roles"),
            Permission(code="system:role:delete", name="删除角色", module="roles"),
            Permission(
                code="system:permission:view", name="查看权限", module="permissions"
            ),
            Permission(
                code="system:permission:create", name="创建权限", module="permissions"
            ),
            Permission(
                code="system:permission:update", name="编辑权限", module="permissions"
            ),
            Permission(
                code="system:permission:delete", name="删除权限", module="permissions"
            ),
            Permission(code="system:file:view", name="查看文件", module="files"),
            Permission(code="system:file:upload", name="上传文件", module="files"),
            Permission(code="system:log:view", name="查看日志", module="audit"),
            Permission(
                code="system:department:view", name="查看部门", module="departments"
            ),
            Permission(
                code="system:department:create", name="创建部门", module="departments"
            ),
            Permission(
                code="system:department:update", name="编辑部门", module="departments"
            ),
            Permission(code="system:dict:view", name="查看字典", module="dicts"),
            Permission(code="system:dict:create", name="创建字典", module="dicts"),
            Permission(code="system:dict:update", name="编辑字典", module="dicts"),
            Permission(code="system:config:view", name="查看参数", module="configs"),
            Permission(code="system:config:create", name="创建参数", module="configs"),
            Permission(code="system:config:update", name="编辑参数", module="configs"),
        ]

        admin_role = Role(
            code="super_admin",
            name="超级管理员",
            description="系统默认管理员",
            status=1,
        )
        admin_role.permissions = permissions

        _ensure_permissions(db, permissions)
        db.add(admin_role)
        db.flush()

        admin = User(
            username=settings.default_admin_username,
            nickname="系统管理员",
            password_hash=get_password_hash(settings.default_admin_password),
            email="admin@example.com",
            status=1,
            is_superuser=True,
        )
        admin.roles = [admin_role]

        db.add(admin)
        db.commit()
        logging.getLogger(__name__).info("默认管理员和基础 RBAC 数据已初始化")


def init_db() -> None:
    seed_system_data()
