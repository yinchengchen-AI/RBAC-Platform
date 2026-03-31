from pydantic import BaseModel, ConfigDict

from schemas.menu import MenuOut
from schemas.permission import PermissionOut


class RoleBase(BaseModel):
    code: str
    name: str
    description: str | None = None
    status: int = 1


class RoleCreate(RoleBase):
    permission_ids: list[str] = []
    menu_ids: list[str] = []
    data_scope_type: str = "all"
    data_scope_department_ids: list[str] = []


class RoleUpdate(BaseModel):
    name: str
    description: str | None = None
    status: int = 1
    permission_ids: list[str] = []
    menu_ids: list[str] = []
    data_scope_type: str = "all"
    data_scope_department_ids: list[str] = []


class RoleOut(RoleBase):
    id: str
    permissions: list[PermissionOut] = []
    menus: list[MenuOut] = []
    data_scope_type: str = "all"
    data_scope_department_ids: list[str] = []
    model_config = ConfigDict(from_attributes=True)
