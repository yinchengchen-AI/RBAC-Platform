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


class FakeDB:
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
        self.role.permissions = [self.permission]
        self.role.menus = [self.menu]
        self.user = User(
            id="user-1",
            username="tester",
            nickname="测试用户",
            password_hash="hash",
            status=1,
            is_superuser=False,
        )
        self.user.roles = [self.role]

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
        if "sys_user" in text:
            return FakeScalarResult([self.user])
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

    def add(self, *_args, **_kwargs):
        return None

    def commit(self):
        return None

    def refresh(self, *_args, **_kwargs):
        return None


def build_client() -> TestClient:
    app = create_app()
    fake_db = FakeDB()
    current_user = SimpleNamespace(
        id="admin-1", username="admin", is_superuser=True, roles=[]
    )

    def override_db():
        yield fake_db

    def override_bind_current_user():
        return current_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[bind_current_user] = override_bind_current_user
    app.dependency_overrides[get_current_user] = override_bind_current_user
    return TestClient(app)


def test_list_roles_success() -> None:
    client = build_client()
    response = client.get("/api/v1/roles", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 200
    assert response.json()["data"][0]["code"] == "role_test"


def test_list_permissions_success() -> None:
    client = build_client()
    response = client.get(
        "/api/v1/permissions", headers={"Authorization": "Bearer fake"}
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["code"] == "system:test:view"


def test_list_menus_success() -> None:
    client = build_client()
    response = client.get("/api/v1/menus", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 200
    assert response.json()["data"][0]["name"] == "测试菜单"
