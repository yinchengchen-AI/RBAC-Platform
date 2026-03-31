from pydantic import BaseModel, ConfigDict


class DictTypeBase(BaseModel):
    name: str
    code: str
    status: int = 1
    description: str | None = None


class DictTypeCreate(DictTypeBase):
    pass


class DictTypeUpdate(BaseModel):
    name: str
    status: int = 1
    description: str | None = None


class DictTypeOut(DictTypeBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


class DictItemBase(BaseModel):
    dict_code: str
    label: str
    value: str
    sort: int = 0
    status: int = 1


class DictItemCreate(DictItemBase):
    pass


class DictItemUpdate(BaseModel):
    label: str
    value: str
    sort: int = 0
    status: int = 1


class DictItemOut(DictItemBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
