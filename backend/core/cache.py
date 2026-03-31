from collections.abc import Generator

from redis import Redis

from core.config import settings


redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


def get_redis() -> Generator[Redis, None, None]:
    yield redis_client


def build_refresh_key(user_id: str) -> str:
    return f"{settings.redis_refresh_prefix}:{user_id}"


def build_dict_cache_key(dict_code: str) -> str:
    return f"cache:dict:{dict_code}"


def build_config_cache_key(config_key: str | None = None) -> str:
    if config_key:
        return f"cache:config:{config_key}"
    return "cache:config:all"
