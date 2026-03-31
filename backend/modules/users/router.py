from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from core.data_scope import get_accessible_department_ids
from core.deps import bind_current_user, get_current_user, permission_required
from core.responses import success
from core.security import get_password_hash
from db.session import get_db
from models.department import Department
from models.role import Role
from models.user import User
from schemas.user import ResetPasswordRequest, UserCreate, UserUpdate

router = APIRouter()


def _build_user_payload(user: User) -> dict:
    department_name = None
    if user.department_id:
        department_name = getattr(user, "department_name", None)
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "department_id": user.department_id,
        "department_name": department_name,
        "email": user.email,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "status": user.status,
        "is_superuser": user.is_superuser,
        "roles": [
            {"id": role.id, "name": role.name, "code": role.code} for role in user.roles
        ],
    }


@router.get("")
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    current_user: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:user:view")),
    db: Session = Depends(get_db),
):
    accessible_department_ids = get_accessible_department_ids(db, current_user)
    stmt = (
        select(User).where(User.is_deleted.is_(False)).order_by(User.create_time.desc())
    )
    count_stmt = (
        select(func.count()).select_from(User).where(User.is_deleted.is_(False))
    )
    if accessible_department_ids is not None:
        stmt = stmt.where(User.department_id.in_(accessible_department_ids))
        count_stmt = count_stmt.where(User.department_id.in_(accessible_department_ids))
    if keyword:
        condition = or_(
            User.username.ilike(f"%{keyword}%"), User.nickname.ilike(f"%{keyword}%")
        )
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)
    users = (
        db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).unique().all()
    )
    department_map = {}
    department_ids = [user.department_id for user in users if user.department_id]
    if department_ids:
        departments = db.scalars(
            select(Department).where(
                Department.id.in_(department_ids), Department.is_deleted.is_(False)
            )
        ).all()
        department_map = {item.id: item.name for item in departments}
        for user in users:
            if user.department_id:
                setattr(user, "department_name", department_map.get(user.department_id))
    total = db.scalar(count_stmt) or 0
    return success(
        {
            "items": [_build_user_payload(user) for user in users],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:user:create")),
    db: Session = Depends(get_db),
):
    exists = db.scalar(
        select(User).where(
            User.username == payload.username, User.is_deleted.is_(False)
        )
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
        )

    role_map = {}
    if payload.role_ids:
        roles = db.scalars(
            select(Role).where(
                Role.id.in_(payload.role_ids), Role.is_deleted.is_(False)
            )
        ).all()
        role_map = {role.id: role for role in roles}

    user = User(
        username=payload.username,
        nickname=payload.nickname,
        department_id=payload.department_id,
        email=payload.email,
        phone=payload.phone,
        avatar_url=payload.avatar_url,
        password_hash=get_password_hash(payload.password),
        status=payload.status,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    user.roles = [
        role_map[role_id] for role_id in payload.role_ids if role_id in role_map
    ]

    db.add(user)
    db.commit()
    db.refresh(user)
    return success(_build_user_payload(user), message="创建成功")


@router.put("/{user_id}")
def update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:user:update")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user or user.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    role_map = {}
    if payload.role_ids:
        roles = db.scalars(
            select(Role).where(
                Role.id.in_(payload.role_ids), Role.is_deleted.is_(False)
            )
        ).all()
        role_map = {role.id: role for role in roles}

    user.nickname = payload.nickname
    user.department_id = payload.department_id
    user.email = payload.email
    user.phone = payload.phone
    user.avatar_url = payload.avatar_url
    user.status = payload.status
    user.updated_by = current_user.id
    user.roles = [
        role_map[role_id] for role_id in payload.role_ids if role_id in role_map
    ]

    db.commit()
    db.refresh(user)
    return success(_build_user_payload(user), message="更新成功")


@router.patch("/{user_id}/reset-password")
def reset_password(
    user_id: str,
    payload: ResetPasswordRequest,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:user:update")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user or user.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user.password_hash = get_password_hash(payload.password)
    user.updated_by = current_user.id
    db.commit()
    return success(message="密码重置成功")


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:user:update")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user or user.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user.is_deleted = True
    user.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")


@router.get("/me/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.department_id:
        department = db.get(Department, current_user.department_id)
        if department and not department.is_deleted:
            setattr(current_user, "department_name", department.name)
    return success(_build_user_payload(current_user))
