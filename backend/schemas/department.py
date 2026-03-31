from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    parent_id: str | None = None
    name: str
    code: str
    leader: str | None = None
    phone: str | None = None
    sort: int = 0
    status: int = 1


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    parent_id: str | None = None
    name: str
    leader: str | None = None
    phone: str | None = None
    sort: int = 0
    status: int = 1


class DepartmentOut(DepartmentBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
