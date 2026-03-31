from pydantic import BaseModel, ConfigDict, EmailStr

from schemas.role import RoleOut


class UserBase(BaseModel):
    username: str
    nickname: str
    department_id: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: int = 1


class UserCreate(UserBase):
    password: str
    role_ids: list[str] = []


class UserUpdate(BaseModel):
    nickname: str
    email: EmailStr | None = None
    phone: str | None = None
    avatar_url: str | None = None
    status: int = 1
    role_ids: list[str] = []


class ResetPasswordRequest(BaseModel):
    password: str


class UserOut(UserBase):
    id: str
    is_superuser: bool
    department_name: str | None = None
    roles: list[RoleOut] = []
    model_config = ConfigDict(from_attributes=True)
