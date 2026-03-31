from fastapi.testclient import TestClient

from main import create_app


client = TestClient(create_app())


def test_me_requires_auth() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_logout_requires_auth() -> None:
    response = client.post("/api/v1/auth/logout", json={})
    assert response.status_code == 401
