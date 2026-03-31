from fastapi.testclient import TestClient

from main import create_app


client = TestClient(create_app())


def test_list_users_requires_auth() -> None:
    response = client.get("/api/v1/users")
    assert response.status_code == 401
