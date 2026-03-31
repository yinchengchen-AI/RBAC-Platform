from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
