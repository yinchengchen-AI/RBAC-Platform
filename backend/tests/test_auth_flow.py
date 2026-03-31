from types import SimpleNamespace

from fastapi.testclient import TestClient

from core.cache import get_redis
from db.session import get_db
from main import create_app
from models.user import User


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    def setex(self, key: str, _: int, value: str) -> None:
        self.store[key] = value

    def get(self, key: str):
        return self.store.get(key)

    def delete(self, key: str) -> None:
        self.store.pop(key, None)


class FakeDB:
    def __init__(self, user: User) -> None:
        self.user = user

    def scalar(self, *_args, **_kwargs):
        return self.user

    def get(self, _model, _id):
        return self.user

    def add(self, *_args, **_kwargs):
        return None

    def commit(self):
        return None

    def refresh(self, *_args, **_kwargs):
        return None


def build_test_client() -> TestClient:
    app = create_app()
    fake_user = User(
        id="user-1",
        username="admin",
        nickname="管理员",
        password_hash="$2b$12$2L2wR0M3M2o1Sib4k6.vrO7O7J6T3U8Q4V9xk9hC4Y/Abcdefghij",
        status=1,
        is_superuser=True,
    )
    fake_user.roles = []
    fake_redis = FakeRedis()
    fake_db = FakeDB(fake_user)

    def override_redis():
        return fake_redis

    def override_db():
        yield fake_db

    app.dependency_overrides[get_redis] = override_redis
    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_login_returns_tokens(monkeypatch) -> None:
    from modules.auth import router as auth_router_module

    monkeypatch.setattr(
        auth_router_module,
        "verify_password",
        lambda plain, hashed: plain == "Admin@123456",
    )
    client = build_test_client()
    response = client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "Admin@123456"}
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["access_token"]
    assert payload["refresh_token"]
    assert payload["user"]["username"] == "admin"


def test_refresh_returns_new_tokens(monkeypatch) -> None:
    from modules.auth import router as auth_router_module

    monkeypatch.setattr(
        auth_router_module,
        "verify_password",
        lambda plain, hashed: plain == "Admin@123456",
    )
    client = build_test_client()
    login_response = client.post(
        "/api/v1/auth/login", json={"username": "admin", "password": "Admin@123456"}
    )
    refresh_token = login_response.json()["data"]["refresh_token"]

    refresh_response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    assert refresh_response.json()["data"]["access_token"]
    assert refresh_response.json()["data"]["refresh_token"]
