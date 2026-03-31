from types import SimpleNamespace

from fastapi.testclient import TestClient

from core.deps import bind_current_user, get_current_user
from db.session import get_db
from main import create_app
from models.menu import Menu
from models.permission import Permission
from models.role import Role
from models.user import User


class FakeScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items

    def unique(self):
        return self


class FakeWriteDB:
    def __init__(self):
        self.permission = Permission(
            id="perm-1", code="system:test:view", name="测试权限", module="test"
        )
        self.menu = Menu(
            id="menu-1",
            name="测试菜单",
            type="menu",
            route_path="/test",
            sort=1,
            visible=True,
        )
        self.role = Role(id="role-1", code="role_test", name="测试角色", status=1)
        self.user = User(
            id="user-1",
            username="tester",
            nickname="测试用户",
            password_hash="hash",
            status=1,
            is_superuser=False,
        )

    def scalar(self, *_args, **_kwargs):
        return None

    def scalars(self, statement, *_args, **_kwargs):
        text = str(statement)
        if "sys_role" in text:
            return FakeScalarResult([self.role])
        if "sys_permission" in text:
            return FakeScalarResult([self.permission])
        if "sys_menu" in text:
            return FakeScalarResult([self.menu])
        return FakeScalarResult([])

    def get(self, model, object_id):
        mapping = {
            User: self.user,
            Role: self.role,
            Permission: self.permission,
            Menu: self.menu,
        }
        entity = mapping.get(model)
        if entity and getattr(entity, "id", None) == object_id:
            return entity
        return None

    def add(self, entity, *_args, **_kwargs):
        if isinstance(entity, User):
            self.user = entity
            if not getattr(entity, "id", None):
                entity.id = "user-2"
        if isinstance(entity, Role):
            self.role = entity
            if not getattr(entity, "id", None):
                entity.id = "role-2"
        if isinstance(entity, Permission):
            self.permission = entity
            if not getattr(entity, "id", None):
                entity.id = "perm-2"
        if isinstance(entity, Menu):
            self.menu = entity
            if not getattr(entity, "id", None):
                entity.id = "menu-2"

    def commit(self):
        return None

    def refresh(self, *_args, **_kwargs):
        return None


def build_client() -> TestClient:
    app = create_app()
    fake_db = FakeWriteDB()
    current_user = SimpleNamespace(
        id="admin-1", username="admin", is_superuser=True, roles=[]
    )

    def override_db():
        yield fake_db

    def override_current_user():
        return current_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[bind_current_user] = override_current_user
    return TestClient(app)


def test_create_permission_success() -> None:
    client = build_client()
    response = client.post(
        "/api/v1/permissions",
        json={"code": "system:new:create", "name": "新建权限", "module": "test"},
    )
    assert response.status_code == 201
    assert response.json()["data"]["code"] == "system:new:create"


def test_update_menu_success() -> None:
    client = build_client()
    response = client.put(
        "/api/v1/menus/menu-1",
        json={
            "name": "更新菜单",
            "type": "menu",
            "route_path": "/test",
            "component": "pages/test",
            "icon": "MenuOutlined",
            "sort": 1,
            "permission_code": "system:test:view",
            "visible": True,
            "parent_id": None,
        },
    )
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "更新菜单"


def test_delete_role_success() -> None:
    client = build_client()
    response = client.delete("/api/v1/roles/role-1")
    assert response.status_code == 200
    assert response.json()["message"] == "删除成功"
