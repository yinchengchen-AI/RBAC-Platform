from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.deps import bind_current_user, permission_required
from core.responses import success
from db.session import get_db
from models.menu import Menu
from models.user import User
from schemas.menu import MenuCreate, MenuUpdate

router = APIRouter()


def _build_menu_payload(menu: Menu) -> dict:
    return {
        "id": menu.id,
        "parent_id": menu.parent_id,
        "name": menu.name,
        "type": menu.type,
        "route_path": menu.route_path,
        "component": menu.component,
        "icon": menu.icon,
        "sort": menu.sort,
        "permission_code": menu.permission_code,
        "visible": menu.visible,
    }


@router.get("")
def list_menus(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:menu:view")),
    db: Session = Depends(get_db),
):
    items = db.scalars(
        select(Menu)
        .where(Menu.is_deleted.is_(False))
        .order_by(Menu.sort.asc(), Menu.create_time.asc())
    ).all()
    return success([_build_menu_payload(item) for item in items])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_menu(
    payload: MenuCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:menu:create")),
    db: Session = Depends(get_db),
):
    menu = Menu(
        **payload.model_dump(), created_by=current_user.id, updated_by=current_user.id
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return success(_build_menu_payload(menu), message="创建成功")


@router.put("/{menu_id}")
def update_menu(
    menu_id: str,
    payload: MenuUpdate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:menu:update")),
    db: Session = Depends(get_db),
):
    menu = db.get(Menu, menu_id)
    if not menu or menu.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="菜单不存在")
    for field, value in payload.model_dump().items():
        setattr(menu, field, value)
    menu.updated_by = current_user.id
    db.commit()
    return success(_build_menu_payload(menu), message="更新成功")


@router.delete("/{menu_id}")
def delete_menu(
    menu_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:menu:update")),
    db: Session = Depends(get_db),
):
    menu = db.get(Menu, menu_id)
    if not menu or menu.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="菜单不存在")
    menu.is_deleted = True
    menu.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")
