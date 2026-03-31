from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    code: str
    name: str
    module: str | None = None
    description: str | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    name: str
    module: str | None = None
    description: str | None = None


class PermissionOut(PermissionBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
