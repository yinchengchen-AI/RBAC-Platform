from io import BytesIO
from types import SimpleNamespace

from fastapi.testclient import TestClient
from openpyxl import Workbook

from core.cache import get_redis
from core.deps import bind_current_user, get_current_user
from db.session import get_db
from main import create_app
from models.config import SystemConfig
from models.department import Department
from models.dict import DictItem, DictType


class FakeScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


class FakePlatformDB:
    def __init__(self):
        self.added_entities = []
        self.department = Department(
            id="dept-1", name="技术部", code="tech", sort=1, status=1
        )
        self.dict_type = DictType(
            id="dict-type-1", name="状态", code="status", status=1
        )
        self.dict_item = DictItem(
            id="dict-item-1",
            dict_code="status",
            label="启用",
            value="1",
            sort=1,
            status=1,
        )
        self.config = SystemConfig(
            id="config-1",
            name="站点名称",
            key="site.name",
            value="RBAC Platform",
            value_type="string",
            status=1,
        )

    def scalar(self, *_args, **_kwargs):
        return None

    def scalars(self, statement, *_args, **_kwargs):
        text = str(statement)
        if "sys_department" in text:
            return FakeScalarResult([self.department])
        if "sys_dict_type" in text:
            return FakeScalarResult([self.dict_type])
        if "sys_dict_item" in text:
            return FakeScalarResult([self.dict_item])
        if "sys_config" in text:
            return FakeScalarResult([self.config])
        return FakeScalarResult([])

    def get(self, model, object_id):
        mapping = {
            Department: self.department,
            DictType: self.dict_type,
            DictItem: self.dict_item,
            SystemConfig: self.config,
        }
        entity = mapping.get(model)
        if entity and getattr(entity, "id", None) == object_id:
            return entity
        return None

    def add(self, entity, *_args, **_kwargs):
        self.added_entities.append(entity)
        return entity

    def commit(self):
        return None

    def refresh(self, *_args, **_kwargs):
        return None


class FakeRedis:
    def __init__(self):
        self.store: dict[str, str] = {}

    def get(self, key: str):
        return self.store.get(key)

    def set(self, key: str, value: str, ex: int | None = None):
        self.store[key] = value

    def delete(self, key: str):
        self.store.pop(key, None)


def build_client() -> TestClient:
    app = create_app()
    fake_db = FakePlatformDB()
    fake_redis = FakeRedis()
    current_user = SimpleNamespace(
        id="admin-1", username="admin", is_superuser=True, roles=[]
    )

    def override_db():
        yield fake_db

    def override_current_user():
        return current_user

    def override_redis():
        return fake_redis

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_redis] = override_redis
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[bind_current_user] = override_current_user
    return TestClient(app)


def build_excel_file(headers: list[str], rows: list[list[object]]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(headers)
    for row in rows:
        sheet.append(row)
    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def test_list_departments_success() -> None:
    client = build_client()
    response = client.get(
        "/api/v1/departments", headers={"Authorization": "Bearer fake"}
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["name"] == "技术部"


def test_list_dict_types_success() -> None:
    client = build_client()
    response = client.get(
        "/api/v1/dicts/types", headers={"Authorization": "Bearer fake"}
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["code"] == "status"


def test_create_config_success() -> None:
    client = build_client()
    response = client.post(
        "/api/v1/configs",
        headers={"Authorization": "Bearer fake"},
        json={
            "name": "站点标题",
            "key": "site.title",
            "value": "权限平台",
            "value_type": "string",
            "status": 1,
            "description": "站点标题",
        },
    )
    assert response.status_code == 201
    assert response.json()["data"]["key"] == "site.title"


def test_export_configs_success() -> None:
    client = build_client()
    response = client.get(
        "/api/v1/configs/export", headers={"Authorization": "Bearer fake"}
    )
    assert response.status_code == 200
    assert (
        response.headers["content-disposition"] == 'attachment; filename="configs.xlsx"'
    )


def test_export_dict_items_success() -> None:
    client = build_client()
    response = client.get(
        "/api/v1/dicts/items/export?dict_code=status",
        headers={"Authorization": "Bearer fake"},
    )
    assert response.status_code == 200
    assert (
        response.headers["content-disposition"]
        == 'attachment; filename="dict-status.xlsx"'
    )


def test_import_configs_success() -> None:
    client = build_client()
    content = build_excel_file(
        ["name", "key", "value", "value_type", "status", "description"],
        [["站点标题", "site.title", "权限平台", "string", 1, "站点标题"]],
    )
    response = client.post(
        "/api/v1/configs/import",
        headers={"Authorization": "Bearer fake"},
        files={
            "file": (
                "configs.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 200
    assert response.json()["message"] == "导入成功"
