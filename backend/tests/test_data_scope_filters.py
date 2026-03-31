from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.deps import bind_current_user, get_current_user
from db.base import Base
from db.session import get_db
from main import create_app
from models.data_scope import DataScopeRule
from models.department import Department
from models.permission import Permission
from models.role import Role
from models.user import User


def build_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(bind=engine)
    return session_local()


def build_client(db: Session, current_user: User) -> TestClient:
    app = create_app()

    def override_db() -> Generator[Session, None, None]:
        yield db

    def override_current_user() -> User:
        return current_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[bind_current_user] = override_current_user
    return TestClient(app)


def test_list_users_applies_department_and_children_scope() -> None:
    db = build_session()
    parent = Department(id="dept-parent", name="总部", code="head", sort=1, status=1)
    child = Department(
        id="dept-child",
        parent_id="dept-parent",
        name="研发部",
        code="rd",
        sort=2,
        status=1,
    )
    other = Department(id="dept-other", name="财务部", code="finance", sort=3, status=1)
    role = Role(id="role-1", code="manager", name="经理", status=1)
    permission = Permission(
        id="perm-user-view",
        code="system:user:view",
        name="查看用户",
        module="system",
    )
    role.permissions = [permission]
    current_user = User(
        id="user-current",
        username="leader",
        nickname="负责人",
        department_id="dept-parent",
        password_hash="hash",
        status=1,
        is_superuser=False,
    )
    current_user.roles = [role]
    visible_user = User(
        id="user-visible",
        username="dev",
        nickname="研发成员",
        department_id="dept-child",
        password_hash="hash",
        status=1,
        is_superuser=False,
    )
    hidden_user = User(
        id="user-hidden",
        username="finance",
        nickname="财务成员",
        department_id="dept-other",
        password_hash="hash",
        status=1,
        is_superuser=False,
    )
    db.add_all(
        [
            parent,
            child,
            other,
            permission,
            role,
            current_user,
            visible_user,
            hidden_user,
        ]
    )
    db.add(DataScopeRule(role_id="role-1", scope_type="department_and_children"))
    db.commit()

    client = build_client(db, current_user)
    response = client.get("/api/v1/users", headers={"Authorization": "Bearer fake"})

    assert response.status_code == 200
    usernames = {item["username"] for item in response.json()["data"]["items"]}
    assert usernames == {"leader", "dev"}


def test_list_departments_applies_custom_department_scope() -> None:
    db = build_session()
    dept_a = Department(id="dept-a", name="A部门", code="dept_a", sort=1, status=1)
    dept_b = Department(id="dept-b", name="B部门", code="dept_b", sort=2, status=1)
    dept_c = Department(id="dept-c", name="C部门", code="dept_c", sort=3, status=1)
    role = Role(id="role-2", code="auditor", name="审计", status=1)
    permission = Permission(
        id="perm-dept-view",
        code="system:department:view",
        name="查看部门",
        module="system",
    )
    role.permissions = [permission]
    current_user = User(
        id="user-auditor",
        username="auditor",
        nickname="审计员",
        department_id="dept-a",
        password_hash="hash",
        status=1,
        is_superuser=False,
    )
    current_user.roles = [role]
    db.add_all([dept_a, dept_b, dept_c, permission, role, current_user])
    db.add(
        DataScopeRule(
            role_id="role-2", scope_type="custom_departments", department_ids="dept-b"
        )
    )
    db.commit()

    client = build_client(db, current_user)
    response = client.get(
        "/api/v1/departments", headers={"Authorization": "Bearer fake"}
    )

    assert response.status_code == 200
    department_ids = [item["id"] for item in response.json()["data"]]
    assert department_ids == ["dept-b"]
