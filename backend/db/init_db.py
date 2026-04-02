from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError

from core.config import settings
from core.logging import logging
from core.security import get_password_hash
from db.session import SessionLocal
from models.permission import Permission
from models.role import Role
from models.user import User


PERMISSION_DEFINITIONS = [
    {"code": "system:user:view", "name": "查看用户", "module": "users"},
    {"code": "system:user:create", "name": "创建用户", "module": "users"},
    {"code": "system:user:update", "name": "编辑用户", "module": "users"},
    {"code": "system:user:delete", "name": "删除用户", "module": "users"},
    {"code": "system:role:view", "name": "查看角色", "module": "roles"},
    {"code": "system:role:create", "name": "创建角色", "module": "roles"},
    {"code": "system:role:update", "name": "编辑角色", "module": "roles"},
    {"code": "system:role:delete", "name": "删除角色", "module": "roles"},
    {
        "code": "system:permission:view",
        "name": "查看权限",
        "module": "permissions",
    },
    {
        "code": "system:permission:create",
        "name": "创建权限",
        "module": "permissions",
    },
    {
        "code": "system:permission:update",
        "name": "编辑权限",
        "module": "permissions",
    },
    {
        "code": "system:permission:delete",
        "name": "删除权限",
        "module": "permissions",
    },
    {"code": "system:file:view", "name": "查看文件", "module": "files"},
    {"code": "system:file:upload", "name": "上传文件", "module": "files"},
    {"code": "system:log:view", "name": "查看日志", "module": "audit"},
    {
        "code": "system:department:view",
        "name": "查看部门",
        "module": "departments",
    },
    {
        "code": "system:department:create",
        "name": "创建部门",
        "module": "departments",
    },
    {
        "code": "system:department:update",
        "name": "编辑部门",
        "module": "departments",
    },
    {"code": "system:dict:view", "name": "查看字典", "module": "dicts"},
    {"code": "system:dict:create", "name": "创建字典", "module": "dicts"},
    {"code": "system:dict:update", "name": "编辑字典", "module": "dicts"},
    {"code": "system:config:view", "name": "查看参数", "module": "configs"},
    {"code": "system:config:create", "name": "创建参数", "module": "configs"},
    {"code": "system:config:update", "name": "编辑参数", "module": "configs"},
    {"code": "business:company:view", "name": "查看客户", "module": "companies"},
    {
        "code": "business:company:create",
        "name": "创建客户",
        "module": "companies",
    },
    {
        "code": "business:company:update",
        "name": "编辑客户",
        "module": "companies",
    },
    {
        "code": "business:company:delete",
        "name": "删除客户",
        "module": "companies",
    },
    {"code": "business:contract:view", "name": "查看合同", "module": "contracts"},
    {
        "code": "business:contract:create",
        "name": "创建合同",
        "module": "contracts",
    },
    {
        "code": "business:contract:update",
        "name": "编辑合同",
        "module": "contracts",
    },
    {
        "code": "business:contract:delete",
        "name": "删除合同",
        "module": "contracts",
    },
    {"code": "business:service:view", "name": "查看服务", "module": "services"},
    {
        "code": "business:document:view",
        "name": "查看文档",
        "module": "documents",
    },
    {"code": "business:invoice:view", "name": "查看发票", "module": "finance"},
    {"code": "business:invoice:create", "name": "创建发票", "module": "finance"},
    {"code": "business:payment:view", "name": "查看回款", "module": "finance"},
    {"code": "business:payment:create", "name": "创建回款", "module": "finance"},
]


def _build_permissions() -> list[Permission]:
    return [Permission(**item) for item in PERMISSION_DEFINITIONS]


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


def _grant_permissions_to_role(role: Role, permissions: list[Permission]) -> None:
    existing_codes = {item.code for item in role.permissions}
    for permission in permissions:
        if permission.code in existing_codes:
            continue
        role.permissions.append(permission)
        existing_codes.add(permission.code)


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

        permissions = _build_permissions()
        created_permissions = _ensure_permissions(db, permissions)

        stored_permissions = db.scalars(
            select(Permission).where(
                Permission.code.in_([item["code"] for item in PERMISSION_DEFINITIONS]),
                Permission.is_deleted.is_(False),
            )
        ).all()

        if admin:
            admin_role = db.scalar(
                select(Role).where(
                    Role.code == "super_admin", Role.is_deleted.is_(False)
                )
            )
            if admin_role:
                _grant_permissions_to_role(admin_role, stored_permissions)
            if created_permissions or admin_role:
                db.commit()
            return

        admin_role = Role(
            code="super_admin",
            name="超级管理员",
            description="系统默认管理员",
            status=1,
        )
        admin_role.permissions = stored_permissions
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
