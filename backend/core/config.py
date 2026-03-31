from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    project_name: str = Field(default="RBAC Platform", alias="PROJECT_NAME")
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/rbac_platform",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    minio_endpoint: str = Field(default="localhost:9000", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="minioadmin", alias="MINIO_ROOT_USER")
    minio_secret_key: str = Field(default="minioadmin", alias="MINIO_ROOT_PASSWORD")
    minio_secure: bool = Field(default=False, alias="MINIO_SECURE")
    minio_public_bucket: str = Field(default="public", alias="MINIO_PUBLIC_BUCKET")
    minio_private_bucket: str = Field(default="private", alias="MINIO_PRIVATE_BUCKET")
    jwt_secret_key: str = Field(
        default="change-me-in-production", alias="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )
    redis_refresh_prefix: str = Field(
        default="auth:refresh", alias="REDIS_REFRESH_PREFIX"
    )
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")
    backend_cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        alias="BACKEND_CORS_ORIGINS",
    )
    default_admin_username: str = Field(default="admin", alias="DEFAULT_ADMIN_USERNAME")
    default_admin_password: str = Field(
        default="Admin@123456", alias="DEFAULT_ADMIN_PASSWORD"
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if isinstance(settings.backend_cors_origins, str):
        settings.backend_cors_origins = [
            item.strip()
            for item in settings.backend_cors_origins.split(",")
            if item.strip()
        ]
    return settings


settings = get_settings()
