from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.data_scope import get_accessible_department_ids
from core.deps import bind_current_user, permission_required
from core.responses import success
from db.session import get_db
from models.department import Department
from models.user import User
from schemas.department import DepartmentCreate, DepartmentUpdate

router = APIRouter()


def _build_payload(item: Department) -> dict:
    return {
        "id": item.id,
        "parent_id": item.parent_id,
        "name": item.name,
        "code": item.code,
        "leader": item.leader,
        "phone": item.phone,
        "sort": item.sort,
        "status": item.status,
    }


@router.get("")
def list_departments(
    current_user: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:department:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Department).where(Department.is_deleted.is_(False))
    accessible_department_ids = get_accessible_department_ids(db, current_user)
    if accessible_department_ids is not None:
        stmt = stmt.where(Department.id.in_(accessible_department_ids))
    items = db.scalars(
        stmt.order_by(Department.sort.asc(), Department.create_time.asc())
    ).all()
    return success([_build_payload(item) for item in items])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:department:create")),
    db: Session = Depends(get_db),
):
    exists = db.scalar(
        select(Department).where(
            Department.code == payload.code, Department.is_deleted.is_(False)
        )
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="部门编码已存在"
        )
    item = Department(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return success(_build_payload(item), message="创建成功")


@router.put("/{department_id}")
def update_department(
    department_id: str,
    payload: DepartmentUpdate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:department:update")),
    db: Session = Depends(get_db),
):
    item = db.get(Department, department_id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="部门不存在")
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    return success(_build_payload(item), message="更新成功")


@router.delete("/{department_id}")
def delete_department(
    department_id: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:department:update")),
    db: Session = Depends(get_db),
):
    item = db.get(Department, department_id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="部门不存在")
    item.is_deleted = True
    db.commit()
    return success(message="删除成功")
