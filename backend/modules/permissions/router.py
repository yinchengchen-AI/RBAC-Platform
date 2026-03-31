from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.deps import bind_current_user, permission_required
from core.responses import success
from db.session import get_db
from models.permission import Permission
from models.user import User
from schemas.permission import PermissionCreate, PermissionUpdate

router = APIRouter()


def _build_permission_payload(permission: Permission) -> dict:
    return {
        "id": permission.id,
        "code": permission.code,
        "name": permission.name,
        "module": permission.module,
        "description": permission.description,
    }


@router.get("")
def list_permissions(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:permission:view")),
    db: Session = Depends(get_db),
):
    items = db.scalars(
        select(Permission)
        .where(Permission.is_deleted.is_(False))
        .order_by(Permission.code.asc())
    ).all()
    return success([_build_permission_payload(item) for item in items])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_permission(
    payload: PermissionCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:permission:create")),
    db: Session = Depends(get_db),
):
    exists = db.scalar(
        select(Permission).where(
            Permission.code == payload.code, Permission.is_deleted.is_(False)
        )
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="权限编码已存在"
        )
    item = Permission(
        code=payload.code,
        name=payload.name,
        module=payload.module,
        description=payload.description,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return success(_build_permission_payload(item), message="创建成功")


@router.put("/{permission_id}")
def update_permission(
    permission_id: str,
    payload: PermissionUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:permission:update")),
    db: Session = Depends(get_db),
):
    item = db.get(Permission, permission_id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="权限不存在")
    item.name = payload.name
    item.module = payload.module
    item.description = payload.description
    item.updated_by = current_user.id
    db.commit()
    return success(_build_permission_payload(item), message="更新成功")


@router.delete("/{permission_id}")
def delete_permission(
    permission_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:permission:update")),
    db: Session = Depends(get_db),
):
    item = db.get(Permission, permission_id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="权限不存在")
    item.is_deleted = True
    item.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")
