import json

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from redis import Redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.cache import build_config_cache_key, get_redis
from core.deps import bind_current_user, permission_required
from core.excel import build_excel_file, read_excel_rows
from core.responses import success
from db.session import get_db
from models.config import SystemConfig
from models.user import User
from schemas.config import SystemConfigCreate, SystemConfigUpdate

router = APIRouter()

CONFIG_EXPORT_HEADERS = ["name", "key", "value", "value_type", "status", "description"]


def _coerce_text(value: object | None, field_name: str) -> str:
    text = str(value).strip() if value is not None else ""
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"字段 {field_name} 不能为空",
        )
    return text


def _coerce_optional_text(value: object | None) -> str | None:
    if value in (None, ""):
        return None
    return str(value).strip()


def _coerce_int(value: object | None, field_name: str, default: int) -> int:
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"字段 {field_name} 必须为整数",
        ) from exc


def _build_payload(item: SystemConfig) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "key": item.key,
        "value": item.value,
        "value_type": item.value_type,
        "status": item.status,
        "description": item.description,
    }


@router.get("")
def list_configs(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:view")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    cached = redis.get(build_config_cache_key())
    if cached:
        return success(json.loads(cached))
    items = db.scalars(
        select(SystemConfig)
        .where(SystemConfig.is_deleted.is_(False))
        .order_by(SystemConfig.create_time.desc())
    ).all()
    payload = [_build_payload(item) for item in items]
    redis.set(
        build_config_cache_key(), json.dumps(payload, ensure_ascii=False), ex=3600
    )
    return success(payload)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_config(
    payload: SystemConfigCreate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:create")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    exists = db.scalar(
        select(SystemConfig).where(
            SystemConfig.key == payload.key, SystemConfig.is_deleted.is_(False)
        )
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="参数键已存在"
        )
    item = SystemConfig(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    redis.delete(build_config_cache_key())
    return success(_build_payload(item), message="创建成功")


@router.put("/{config_id}")
def update_config(
    config_id: str,
    payload: SystemConfigUpdate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:update")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    item = db.get(SystemConfig, config_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="系统参数不存在"
        )
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    redis.delete(build_config_cache_key())
    return success(_build_payload(item), message="更新成功")


@router.delete("/{config_id}")
def delete_config(
    config_id: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:update")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    item = db.get(SystemConfig, config_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="系统参数不存在"
        )
    item.is_deleted = True
    db.commit()
    redis.delete(build_config_cache_key())
    return success(message="删除成功")


@router.get("/export")
def export_configs(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:view")),
    db: Session = Depends(get_db),
):
    items = db.scalars(
        select(SystemConfig)
        .where(SystemConfig.is_deleted.is_(False))
        .order_by(SystemConfig.create_time.desc())
    ).all()
    content, headers = build_excel_file(
        filename="configs.xlsx",
        headers=CONFIG_EXPORT_HEADERS,
        rows=[
            [
                item.name,
                item.key,
                item.value,
                item.value_type,
                item.status,
                item.description,
            ]
            for item in items
        ],
    )
    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers=headers,
    )


@router.post("/import")
async def import_configs(
    file: UploadFile = File(...),
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:config:create")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    rows = await read_excel_rows(file, CONFIG_EXPORT_HEADERS)
    for item in rows:
        db.add(
            SystemConfig(
                name=_coerce_text(item.get("name"), "name"),
                key=_coerce_text(item.get("key"), "key"),
                value=_coerce_text(item.get("value"), "value"),
                value_type=_coerce_text(item.get("value_type"), "value_type"),
                status=_coerce_int(item.get("status"), "status", 1),
                description=_coerce_optional_text(item.get("description")),
            )
        )
    db.commit()
    redis.delete(build_config_cache_key())
    return success(message="导入成功")
