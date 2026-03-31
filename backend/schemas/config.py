from pydantic import BaseModel, ConfigDict


class SystemConfigBase(BaseModel):
    name: str
    key: str
    value: str
    value_type: str = "string"
    status: int = 1
    description: str | None = None


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    name: str
    value: str
    value_type: str = "string"
    status: int = 1
    description: str | None = None


class SystemConfigOut(SystemConfigBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
