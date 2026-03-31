from pydantic import BaseModel, ConfigDict


class MenuBase(BaseModel):
    parent_id: str | None = None
    name: str
    type: str = "menu"
    route_path: str | None = None
    component: str | None = None
    icon: str | None = None
    sort: int = 0
    permission_code: str | None = None
    visible: bool = True


class MenuCreate(MenuBase):
    pass


class MenuUpdate(MenuBase):
    pass


class MenuOut(MenuBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
