from sqlalchemy import select
from sqlalchemy.exc import ProgrammingError

from core.config import settings
from core.logging import logging
from core.security import get_password_hash
from db.session import SessionLocal
from models.menu import Menu
from models.permission import Permission
from models.role import Role
from models.user import User


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
            return

        permissions = [
            Permission(code="system:user:view", name="查看用户", module="users"),
            Permission(code="system:user:create", name="创建用户", module="users"),
            Permission(code="system:user:update", name="编辑用户", module="users"),
            Permission(code="system:role:view", name="查看角色", module="roles"),
            Permission(code="system:role:create", name="创建角色", module="roles"),
            Permission(code="system:role:update", name="编辑角色", module="roles"),
            Permission(
                code="system:permission:view", name="查看权限", module="permissions"
            ),
            Permission(
                code="system:permission:create", name="创建权限", module="permissions"
            ),
            Permission(
                code="system:permission:update", name="编辑权限", module="permissions"
            ),
            Permission(code="system:menu:view", name="查看菜单", module="menus"),
            Permission(code="system:menu:create", name="创建菜单", module="menus"),
            Permission(code="system:menu:update", name="编辑菜单", module="menus"),
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

        menus = [
            Menu(
                name="工作台",
                type="menu",
                route_path="/dashboard",
                icon="DashboardOutlined",
                sort=1,
            ),
            Menu(
                name="用户管理",
                type="menu",
                route_path="/users",
                icon="UserOutlined",
                permission_code="system:user:view",
                sort=10,
            ),
            Menu(
                name="角色管理",
                type="menu",
                route_path="/roles",
                icon="TeamOutlined",
                permission_code="system:role:view",
                sort=20,
            ),
            Menu(
                name="权限管理",
                type="menu",
                route_path="/permissions",
                icon="SafetyCertificateOutlined",
                permission_code="system:permission:view",
                sort=30,
            ),
            Menu(
                name="菜单管理",
                type="menu",
                route_path="/menus",
                icon="MenuOutlined",
                permission_code="system:menu:view",
                sort=40,
            ),
            Menu(
                name="文件管理",
                type="menu",
                route_path="/files",
                icon="FolderOpenOutlined",
                permission_code="system:file:view",
                sort=50,
            ),
            Menu(
                name="日志中心",
                type="menu",
                route_path="/logs",
                icon="FileSearchOutlined",
                permission_code="system:log:view",
                sort=60,
            ),
            Menu(
                name="部门管理",
                type="menu",
                route_path="/departments",
                icon="ApartmentOutlined",
                permission_code="system:department:view",
                sort=70,
            ),
            Menu(
                name="字典管理",
                type="menu",
                route_path="/dicts",
                icon="BookOutlined",
                permission_code="system:dict:view",
                sort=80,
            ),
            Menu(
                name="系统参数",
                type="menu",
                route_path="/configs",
                icon="SettingOutlined",
                permission_code="system:config:view",
                sort=90,
            ),
            Menu(
                name="个人中心",
                type="menu",
                route_path="/profile",
                icon="IdcardOutlined",
                sort=100,
            ),
        ]

        admin_role = Role(
            code="super_admin",
            name="超级管理员",
            description="系统默认管理员",
            status=1,
        )
        admin_role.permissions = permissions
        admin_role.menus = menus

        admin = User(
            username=settings.default_admin_username,
            nickname="系统管理员",
            password_hash=get_password_hash(settings.default_admin_password),
            email="admin@example.com",
            status=1,
            is_superuser=True,
        )
        admin.roles = [admin_role]

        db.add_all(permissions)
        db.add_all(menus)
        db.add(admin_role)
        db.add(admin)
        db.commit()
        logging.getLogger(__name__).info("默认管理员和基础 RBAC 数据已初始化")


def init_db() -> None:
    seed_system_data()
