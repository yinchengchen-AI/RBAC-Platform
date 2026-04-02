from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.deps import bind_current_user, permission_required
from core.responses import success
from db.session import get_db
from models.data_scope import DataScopeRule
from models.permission import Permission
from models.role import Role
from models.user import User
from schemas.role import RoleCreate, RoleUpdate

router = APIRouter()


def _build_role_payload(role: Role) -> dict:
    data_scope_rule = getattr(role, "data_scope_rule", None)
    return {
        "id": role.id,
        "code": role.code,
        "name": role.name,
        "description": role.description,
        "status": role.status,
        "permissions": [
            {"id": item.id, "code": item.code, "name": item.name}
            for item in role.permissions
        ],
        "data_scope_type": data_scope_rule.scope_type if data_scope_rule else "all",
        "data_scope_department_ids": data_scope_rule.department_ids.split(",")
        if data_scope_rule and data_scope_rule.department_ids
        else [],
    }


def _attach_data_scope_rules(db: Session, roles: list[Role]) -> None:
    role_ids = [role.id for role in roles]
    if not role_ids:
        return
    rules = db.scalars(
        select(DataScopeRule).where(
            DataScopeRule.role_id.in_(role_ids), DataScopeRule.is_deleted.is_(False)
        )
    ).all()
    rule_map = {rule.role_id: rule for rule in rules}
    for role in roles:
        setattr(role, "data_scope_rule", rule_map.get(role.id))


@router.get("")
def list_roles(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:role:view")),
    db: Session = Depends(get_db),
):
    roles = (
        db.scalars(
            select(Role)
            .where(Role.is_deleted.is_(False))
            .order_by(Role.create_time.desc())
        )
        .unique()
        .all()
    )
    _attach_data_scope_rules(db, roles)
    return success([_build_role_payload(role) for role in roles])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:role:create")),
    db: Session = Depends(get_db),
):
    exists = db.scalar(
        select(Role).where(Role.code == payload.code, Role.is_deleted.is_(False))
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="角色编码已存在"
        )
    role = Role(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    if payload.permission_ids:
        role.permissions = db.scalars(
            select(Permission).where(
                Permission.id.in_(payload.permission_ids),
                Permission.is_deleted.is_(False),
            )
        ).all()

    db.add(role)
    db.flush()
    db.add(
        DataScopeRule(
            role_id=role.id,
            scope_type=payload.data_scope_type,
            department_ids=",".join(payload.data_scope_department_ids)
            if payload.data_scope_department_ids
            else None,
        )
    )
    db.commit()
    db.refresh(role)
    _attach_data_scope_rules(db, [role])
    return success(_build_role_payload(role), message="创建成功")


@router.put("/{role_id}")
def update_role(
    role_id: str,
    payload: RoleUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:role:update")),
    db: Session = Depends(get_db),
):
    role = db.get(Role, role_id)
    if not role or role.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="角色不存在")
    role.name = payload.name
    role.description = payload.description
    role.status = payload.status
    role.updated_by = current_user.id
    role.permissions = (
        db.scalars(
            select(Permission).where(
                Permission.id.in_(payload.permission_ids),
                Permission.is_deleted.is_(False),
            )
        ).all()
        if payload.permission_ids
        else []
    )

    rule = db.scalar(
        select(DataScopeRule).where(
            DataScopeRule.role_id == role.id, DataScopeRule.is_deleted.is_(False)
        )
    )
    if rule:
        rule.scope_type = payload.data_scope_type
        rule.department_ids = (
            ",".join(payload.data_scope_department_ids)
            if payload.data_scope_department_ids
            else None
        )
    else:
        db.add(
            DataScopeRule(
                role_id=role.id,
                scope_type=payload.data_scope_type,
                department_ids=",".join(payload.data_scope_department_ids)
                if payload.data_scope_department_ids
                else None,
            )
        )
    db.commit()
    db.refresh(role)
    _attach_data_scope_rules(db, [role])
    return success(_build_role_payload(role), message="更新成功")


@router.delete("/{role_id}")
def delete_role(
    role_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:role:delete")),
    db: Session = Depends(get_db),
):
    role = db.get(Role, role_id)
    if not role or role.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="角色不存在")
    role.is_deleted = True
    role.updated_by = current_user.id
    rule = db.scalar(
        select(DataScopeRule).where(
            DataScopeRule.role_id == role.id, DataScopeRule.is_deleted.is_(False)
        )
    )
    if rule:
        rule.is_deleted = True
    db.commit()
    return success(message="删除成功")
