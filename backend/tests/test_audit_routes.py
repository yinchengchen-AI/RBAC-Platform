from types import SimpleNamespace

from fastapi.testclient import TestClient

from core.deps import get_current_user
from db.session import get_db
from main import create_app
from models.audit import LoginLog, OperationLog


class FakeScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


class FakeAuditDB:
    def __init__(self):
        self.login_log = LoginLog(
            id="log-1", username="admin", status="success", message="ok"
        )
        self.operation_log = OperationLog(
            id="op-1", username="admin", action="request.post", result="success"
        )

    def scalars(self, statement, *_args, **_kwargs):
        text = str(statement)
        if "sys_login_log" in text:
            return FakeScalarResult([self.login_log])
        if "sys_operation_log" in text:
            return FakeScalarResult([self.operation_log])
        return FakeScalarResult([])

    def scalar(self, *_args, **_kwargs):
        return 1


def build_client() -> TestClient:
    app = create_app()
    fake_db = FakeAuditDB()
    current_user = SimpleNamespace(
        id="admin-1", username="admin", is_superuser=True, roles=[]
    )

    def override_db():
        yield fake_db

    def override_current_user():
        return current_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user
    return TestClient(app)


def test_list_login_logs_with_pagination() -> None:
    client = build_client()
    response = client.get("/api/v1/logs/login?page=1&page_size=10&username=admin")
    assert response.status_code == 200
    assert response.json()["data"]["items"][0]["username"] == "admin"
    assert response.json()["data"]["total"] == 1


def test_list_operation_logs_with_pagination() -> None:
    client = build_client()
    response = client.get("/api/v1/logs/operation?page=1&page_size=10&result=success")
    assert response.status_code == 200
    assert response.json()["data"]["items"][0]["action"] == "request.post"
    assert response.json()["data"]["total"] == 1
