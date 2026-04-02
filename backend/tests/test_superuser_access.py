from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.user import User
from tests.test_permission_matrix import (
    build_client,
    build_session,
    seed_reference_data,
    seed_user,
)


def _assert_superuser_access(
    db: Session, path: str, method: str = "get", json: dict | None = None
) -> None:
    superuser = db.get(User, "superuser-1")
    if superuser is None:
        superuser = seed_user(db, "superuser-1", "superuser", is_superuser=True)
        db.commit()
    client: TestClient = build_client(db, superuser)
    request = getattr(client, method)
    headers = {"Authorization": "Bearer fake"}
    response = (
        request(path, json=json, headers=headers)
        if json is not None
        else request(path, headers=headers)
    )
    assert response.status_code < 400


def test_superuser_can_access_system_management_endpoints() -> None:
    db = build_session()
    seed_reference_data(db)

    _assert_superuser_access(db, "/api/v1/users")
    _assert_superuser_access(db, "/api/v1/roles")
    _assert_superuser_access(db, "/api/v1/permissions")
    _assert_superuser_access(db, "/api/v1/departments")
    _assert_superuser_access(db, "/api/v1/configs")
    _assert_superuser_access(db, "/api/v1/dicts/types")
    _assert_superuser_access(db, "/api/v1/logs/login")
    _assert_superuser_access(db, "/api/v1/files")


def test_superuser_can_access_business_management_endpoints() -> None:
    db = build_session()
    seed_reference_data(db)

    _assert_superuser_access(db, "/api/v1/companies")
    _assert_superuser_access(db, "/api/v1/contracts")
    _assert_superuser_access(db, "/api/v1/services")
    _assert_superuser_access(db, "/api/v1/finance/invoices")
    _assert_superuser_access(db, "/api/v1/finance/payments")
