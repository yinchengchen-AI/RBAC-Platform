from __future__ import annotations

from collections.abc import Generator
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.cache import get_redis
from core.deps import bind_current_user, get_current_user
from db.base import Base
from db.session import get_db
from main import create_app
from models.audit import LoginLog, OperationLog
from models.company import Company
from models.config import SystemConfig
from models.contract import Contract, ContractAttachment
from models.department import Department
from models.dict import DictItem, DictType
from models.file import SysFile
from models.finance import Invoice, Payment
from models.permission import Permission
from models.role import Role
from models.user import User


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    def get(self, key: str):
        return self.store.get(key)

    def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.store[key] = value

    def setex(self, key: str, _seconds: int, value: str) -> None:
        self.store[key] = value

    def delete(self, key: str) -> None:
        self.store.pop(key, None)


def build_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(bind=engine)
    return session_local()


def seed_permission(db: Session, code: str) -> Permission:
    item = Permission(id=f"perm-{code}", code=code, name=code, module="test")
    db.add(item)
    return item


def seed_role(db: Session, role_id: str, permission_codes: list[str]) -> Role:
    role = Role(id=role_id, code=role_id, name=role_id, status=1)
    role.permissions = [seed_permission(db, code) for code in permission_codes]
    db.add(role)
    return role


def seed_user(
    db: Session,
    user_id: str,
    username: str,
    *,
    is_superuser: bool = False,
    permission_codes: list[str] | None = None,
) -> User:
    user = User(
        id=user_id,
        username=username,
        nickname=username,
        password_hash="hash",
        status=1,
        is_superuser=is_superuser,
    )
    if permission_codes:
        role = seed_role(db, f"role-{user_id}", permission_codes)
        user.roles = [role]
    else:
        user.roles = []
    db.add(user)
    return user


def build_client(db: Session, current_user: User) -> TestClient:
    app = create_app()
    fake_redis = FakeRedis()

    def override_db() -> Generator[Session, None, None]:
        yield db

    def override_current_user() -> User:
        return current_user

    def override_redis() -> FakeRedis:
        return fake_redis

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[bind_current_user] = override_current_user
    app.dependency_overrides[get_redis] = override_redis
    return TestClient(app)


def seed_reference_data(db: Session) -> None:
    department = Department(id="dept-1", name="总部", code="head", sort=1, status=1)
    user = User(
        id="target-user",
        username="target",
        nickname="目标用户",
        password_hash="hash",
        status=1,
        is_superuser=False,
    )
    config = SystemConfig(
        id="config-1",
        name="配置项",
        key="feature.flag",
        value="on",
        value_type="string",
        status=1,
    )
    dict_type = DictType(id="dict-type-1", name="状态", code="status", status=1)
    dict_item = DictItem(
        id="dict-item-1",
        dict_code="status",
        label="启用",
        value="enabled",
        sort=1,
        status=1,
    )
    file_item = SysFile(
        id="file-1",
        filename="test.txt",
        object_name="test.txt",
        bucket_name="public",
        url="http://example.com/test.txt",
        size=10,
    )
    company = Company(
        id="company-1",
        name="测试客户",
        code="COMP-001",
        status="active",
    )
    contract = Contract(
        id="contract-1",
        code="CON-001",
        name="测试合同",
        type="other",
        amount=Decimal("1000"),
        company_id="company-1",
        status="draft",
    )
    attachment = ContractAttachment(
        id="attachment-1",
        contract_id="contract-1",
        file_name="a.txt",
        file_path="http://example.com/a.txt",
        file_size=1,
    )
    invoice = Invoice(
        id="invoice-1",
        invoice_no="INV-001",
        contract_id="contract-1",
        type="normal",
        amount=Decimal("100"),
        issue_date=date(2026, 1, 1),
        buyer_name="买方",
        seller_name="卖方",
    )
    payment = Payment(
        id="payment-1",
        code="PAY-001",
        contract_id="contract-1",
        amount=Decimal("100"),
        payment_date=date(2026, 1, 2),
        method="bank_transfer",
    )
    login_log = LoginLog(id="login-log-1", username="tester", status="success")
    operation_log = OperationLog(
        id="op-log-1", username="tester", action="create", result="success"
    )
    db.add_all(
        [
            department,
            user,
            config,
            dict_type,
            dict_item,
            file_item,
            company,
            contract,
            attachment,
            invoice,
            payment,
            login_log,
            operation_log,
        ]
    )
    contract.invoiced_amount = Decimal("100")
    contract.paid_amount = Decimal("100")
    db.commit()


@dataclass
class EndpointCase:
    method: str
    path: str
    permission_code: str
    expected_success_status: int
    json: dict | None = None
    allow_business_error: bool = False


def call_endpoint(client: TestClient, case: EndpointCase):
    headers = {"Authorization": "Bearer fake"}
    method = getattr(client, case.method)
    if case.json is not None:
        return method(case.path, json=case.json, headers=headers)
    return method(case.path, headers=headers)


CASES = [
    EndpointCase("get", "/api/v1/users", "system:user:view", 200),
    EndpointCase(
        "post",
        "/api/v1/users",
        "system:user:create",
        201,
        json={
            "username": "new-user",
            "nickname": "新用户",
            "password": "Admin@123456",
            "status": 1,
            "role_ids": [],
        },
    ),
    EndpointCase(
        "put",
        "/api/v1/users/target-user",
        "system:user:update",
        200,
        json={"nickname": "已更新", "status": 1, "role_ids": []},
    ),
    EndpointCase(
        "patch",
        "/api/v1/users/target-user/reset-password",
        "system:user:update",
        200,
        json={"password": "Admin@123456"},
    ),
    EndpointCase("delete", "/api/v1/users/target-user", "system:user:delete", 200),
    EndpointCase("get", "/api/v1/roles", "system:role:view", 200),
    EndpointCase(
        "post",
        "/api/v1/roles",
        "system:role:create",
        201,
        json={
            "code": "new-role",
            "name": "新角色",
            "status": 1,
            "permission_ids": [],
            "data_scope_type": "all",
            "data_scope_department_ids": [],
        },
    ),
    EndpointCase(
        "put",
        "/api/v1/roles/role-existing",
        "system:role:update",
        200,
        json={
            "name": "已更新角色",
            "status": 1,
            "permission_ids": [],
            "data_scope_type": "all",
            "data_scope_department_ids": [],
        },
    ),
    EndpointCase("delete", "/api/v1/roles/role-existing", "system:role:delete", 200),
    EndpointCase("get", "/api/v1/permissions", "system:permission:view", 200),
    EndpointCase(
        "post",
        "/api/v1/permissions",
        "system:permission:create",
        201,
        json={"code": "system:test:create", "name": "测试创建", "module": "test"},
    ),
    EndpointCase(
        "put",
        "/api/v1/permissions/permission-existing",
        "system:permission:update",
        200,
        json={"name": "已更新权限", "module": "test"},
    ),
    EndpointCase(
        "delete",
        "/api/v1/permissions/permission-existing",
        "system:permission:delete",
        200,
    ),
    EndpointCase("get", "/api/v1/departments", "system:department:view", 200),
    EndpointCase(
        "post",
        "/api/v1/departments",
        "system:department:create",
        201,
        json={"name": "市场部", "code": "market", "sort": 1, "status": 1},
    ),
    EndpointCase(
        "put",
        "/api/v1/departments/dept-1",
        "system:department:update",
        200,
        json={"name": "总部更新", "sort": 1, "status": 1},
    ),
    EndpointCase(
        "delete", "/api/v1/departments/dept-1", "system:department:update", 200
    ),
    EndpointCase("get", "/api/v1/configs", "system:config:view", 200),
    EndpointCase(
        "post",
        "/api/v1/configs",
        "system:config:create",
        201,
        json={
            "name": "新参数",
            "key": "new.key",
            "value": "value",
            "value_type": "string",
            "status": 1,
        },
    ),
    EndpointCase(
        "put",
        "/api/v1/configs/config-1",
        "system:config:update",
        200,
        json={"name": "配置项", "value": "off", "value_type": "string", "status": 1},
    ),
    EndpointCase("delete", "/api/v1/configs/config-1", "system:config:update", 200),
    EndpointCase("get", "/api/v1/configs/export", "system:config:view", 200),
    EndpointCase("get", "/api/v1/dicts/types", "system:dict:view", 200),
    EndpointCase(
        "post",
        "/api/v1/dicts/types",
        "system:dict:create",
        201,
        json={"name": "优先级", "code": "priority", "status": 1},
    ),
    EndpointCase(
        "put",
        "/api/v1/dicts/types/dict-type-1",
        "system:dict:update",
        200,
        json={"name": "状态", "status": 1},
    ),
    EndpointCase(
        "delete", "/api/v1/dicts/types/dict-type-1", "system:dict:update", 200
    ),
    EndpointCase(
        "get", "/api/v1/dicts/items?dict_code=status", "system:dict:view", 200
    ),
    EndpointCase(
        "post",
        "/api/v1/dicts/items",
        "system:dict:create",
        201,
        json={
            "dict_code": "status",
            "label": "禁用",
            "value": "disabled",
            "sort": 2,
            "status": 1,
        },
    ),
    EndpointCase(
        "put",
        "/api/v1/dicts/items/dict-item-1",
        "system:dict:update",
        200,
        json={"label": "启用中", "value": "enabled", "sort": 1, "status": 1},
    ),
    EndpointCase(
        "delete", "/api/v1/dicts/items/dict-item-1", "system:dict:update", 200
    ),
    EndpointCase(
        "get", "/api/v1/dicts/items/export?dict_code=status", "system:dict:view", 200
    ),
    EndpointCase("get", "/api/v1/files", "system:file:view", 200),
    EndpointCase("delete", "/api/v1/files/file-1", "system:file:upload", 200),
    EndpointCase("get", "/api/v1/logs/login", "system:log:view", 200),
    EndpointCase("get", "/api/v1/logs/operation", "system:log:view", 200),
    EndpointCase("get", "/api/v1/companies", "business:company:view", 200),
    EndpointCase(
        "post",
        "/api/v1/companies",
        "business:company:create",
        201,
        json={"name": "新客户", "code": "COMP-NEW", "status": "potential"},
    ),
    EndpointCase("get", "/api/v1/companies/company-1", "business:company:view", 200),
    EndpointCase(
        "put",
        "/api/v1/companies/company-1",
        "business:company:update",
        200,
        json={"name": "客户已更新"},
    ),
    EndpointCase(
        "delete", "/api/v1/companies/company-1", "business:company:delete", 200
    ),
    EndpointCase("get", "/api/v1/contracts", "business:contract:view", 200),
    EndpointCase("get", "/api/v1/contracts/contract-1", "business:contract:view", 200),
    EndpointCase(
        "post",
        "/api/v1/contracts",
        "business:contract:create",
        201,
        json={
            "code": "CON-NEW",
            "name": "新合同",
            "type": "other",
            "amount": "1000",
            "company_id": "company-1",
        },
    ),
    EndpointCase(
        "put",
        "/api/v1/contracts/contract-1",
        "business:contract:update",
        200,
        json={"name": "合同已更新"},
    ),
    EndpointCase(
        "put",
        "/api/v1/contracts/contract-1/status",
        "business:contract:update",
        200,
        json={"status": "pending"},
    ),
    EndpointCase(
        "delete",
        "/api/v1/contracts/contract-1",
        "business:contract:delete",
        200,
        allow_business_error=True,
    ),
    EndpointCase(
        "get",
        "/api/v1/contracts/contract-1/attachments",
        "business:contract:view",
        200,
    ),
    EndpointCase(
        "delete",
        "/api/v1/contracts/contract-1/attachments/attachment-1",
        "business:contract:update",
        200,
    ),
    EndpointCase("get", "/api/v1/services", "business:service:view", 200),
    EndpointCase("get", "/api/v1/finance/invoices", "business:invoice:view", 200),
    EndpointCase(
        "post",
        "/api/v1/finance/invoices",
        "business:invoice:create",
        201,
        json={
            "invoice_no": "INV-NEW",
            "contract_id": "contract-1",
            "type": "normal",
            "amount": "50",
            "issue_date": "2026-01-01",
            "buyer_name": "买方",
            "seller_name": "卖方",
        },
    ),
    EndpointCase("get", "/api/v1/finance/payments", "business:payment:view", 200),
    EndpointCase(
        "post",
        "/api/v1/finance/payments",
        "business:payment:create",
        201,
        json={
            "code": "PAY-NEW",
            "contract_id": "contract-1",
            "invoice_id": "invoice-1",
            "amount": "30",
            "payment_date": "2026-01-02",
            "method": "bank_transfer",
        },
        allow_business_error=True,
    ),
]


@pytest.mark.parametrize("case", CASES, ids=lambda case: f"{case.method}-{case.path}")
def test_protected_endpoints_require_expected_permissions(case: EndpointCase) -> None:
    db = build_session()
    seed_reference_data(db)

    # 角色、权限相关接口需要预置可编辑实体
    existing_role = Role(
        id="role-existing", code="role-existing", name="已有角色", status=1
    )
    existing_permission = Permission(
        id="permission-existing",
        code="system:existing:view",
        name="已有权限",
        module="test",
    )
    existing_role.permissions = []
    db.add_all([existing_role, existing_permission])
    db.commit()

    unauthorized_user = seed_user(db, "user-no-perm", "no-perm")
    db.commit()
    client = build_client(db, unauthorized_user)

    forbidden_response = call_endpoint(client, case)
    assert forbidden_response.status_code == 403

    db = build_session()
    seed_reference_data(db)
    existing_role = Role(
        id="role-existing", code="role-existing", name="已有角色", status=1
    )
    existing_permission = Permission(
        id="permission-existing",
        code="system:existing:view",
        name="已有权限",
        module="test",
    )
    existing_role.permissions = []
    db.add_all([existing_role, existing_permission])
    allowed_user = seed_user(
        db, "user-with-perm", "with-perm", permission_codes=[case.permission_code]
    )
    db.commit()
    client = build_client(db, allowed_user)

    success_response = call_endpoint(client, case)
    if case.allow_business_error:
        assert success_response.status_code != 403
        return
    assert success_response.status_code == case.expected_success_status
