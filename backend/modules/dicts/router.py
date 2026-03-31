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

from core.cache import build_dict_cache_key, get_redis
from core.deps import bind_current_user, permission_required
from core.excel import build_excel_file, read_excel_rows
from core.responses import success
from db.session import get_db
from models.dict import DictItem, DictType
from models.user import User
from schemas.dict import DictItemCreate, DictItemUpdate, DictTypeCreate, DictTypeUpdate

router = APIRouter()

DICT_ITEM_EXPORT_HEADERS = ["dict_code", "label", "value", "sort", "status"]


@router.get("/types")
def list_dict_types(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:view")),
    db: Session = Depends(get_db),
):
    items = db.scalars(
        select(DictType)
        .where(DictType.is_deleted.is_(False))
        .order_by(DictType.create_time.desc())
    ).all()
    return success(
        [
            {
                "id": item.id,
                "name": item.name,
                "code": item.code,
                "status": item.status,
                "description": item.description,
            }
            for item in items
        ]
    )


@router.post("/types", status_code=status.HTTP_201_CREATED)
def create_dict_type(
    payload: DictTypeCreate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:create")),
    db: Session = Depends(get_db),
):
    exists = db.scalar(
        select(DictType).where(
            DictType.code == payload.code, DictType.is_deleted.is_(False)
        )
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="字典类型编码已存在"
        )
    item = DictType(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return success(
        {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "status": item.status,
            "description": item.description,
        },
        message="创建成功",
    )


@router.put("/types/{dict_type_id}")
def update_dict_type(
    dict_type_id: str,
    payload: DictTypeUpdate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:update")),
    db: Session = Depends(get_db),
):
    item = db.get(DictType, dict_type_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典类型不存在"
        )
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    return success(
        {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "status": item.status,
            "description": item.description,
        },
        message="更新成功",
    )


@router.delete("/types/{dict_type_id}")
def delete_dict_type(
    dict_type_id: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:update")),
    db: Session = Depends(get_db),
):
    item = db.get(DictType, dict_type_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典类型不存在"
        )
    item.is_deleted = True
    db.commit()
    return success(message="删除成功")


@router.get("/items")
def list_dict_items(
    dict_code: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:view")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    cached = redis.get(build_dict_cache_key(dict_code))
    if cached:
        return success(json.loads(cached))
    items = db.scalars(
        select(DictItem)
        .where(DictItem.dict_code == dict_code, DictItem.is_deleted.is_(False))
        .order_by(DictItem.sort.asc(), DictItem.create_time.asc())
    ).all()
    payload = [
        {
            "id": item.id,
            "dict_code": item.dict_code,
            "label": item.label,
            "value": item.value,
            "sort": item.sort,
            "status": item.status,
        }
        for item in items
    ]
    redis.set(
        build_dict_cache_key(dict_code),
        json.dumps(payload, ensure_ascii=False),
        ex=3600,
    )
    return success(payload)


@router.post("/items", status_code=status.HTTP_201_CREATED)
def create_dict_item(
    payload: DictItemCreate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:create")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    item = DictItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    redis.delete(build_dict_cache_key(item.dict_code))
    return success(
        {
            "id": item.id,
            "dict_code": item.dict_code,
            "label": item.label,
            "value": item.value,
            "sort": item.sort,
            "status": item.status,
        },
        message="创建成功",
    )


@router.put("/items/{dict_item_id}")
def update_dict_item(
    dict_item_id: str,
    payload: DictItemUpdate,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:update")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    item = db.get(DictItem, dict_item_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典项不存在"
        )
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    redis.delete(build_dict_cache_key(item.dict_code))
    return success(
        {
            "id": item.id,
            "dict_code": item.dict_code,
            "label": item.label,
            "value": item.value,
            "sort": item.sort,
            "status": item.status,
        },
        message="更新成功",
    )


@router.delete("/items/{dict_item_id}")
def delete_dict_item(
    dict_item_id: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:update")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    item = db.get(DictItem, dict_item_id)
    if not item or item.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="字典项不存在"
        )
    item.is_deleted = True
    db.commit()
    redis.delete(build_dict_cache_key(item.dict_code))
    return success(message="删除成功")


@router.get("/items/export")
def export_dict_items(
    dict_code: str,
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:view")),
    db: Session = Depends(get_db),
):
    items = db.scalars(
        select(DictItem)
        .where(DictItem.dict_code == dict_code, DictItem.is_deleted.is_(False))
        .order_by(DictItem.sort.asc())
    ).all()
    content, headers = build_excel_file(
        filename=f"dict-{dict_code}.xlsx",
        headers=DICT_ITEM_EXPORT_HEADERS,
        rows=[
            [item.dict_code, item.label, item.value, item.sort, item.status]
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


def _coerce_text(value: object | None, field_name: str) -> str:
    text = str(value).strip() if value is not None else ""
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"字段 {field_name} 不能为空",
        )
    return text


@router.post("/items/import")
async def import_dict_items(
    dict_code: str,
    file: UploadFile = File(...),
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:dict:create")),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    rows = await read_excel_rows(file, DICT_ITEM_EXPORT_HEADERS)
    for item in rows:
        row_dict_code = _coerce_text(item.get("dict_code"), "dict_code")
        if row_dict_code != dict_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="导入文件中的 dict_code 与当前字典编码不一致",
            )
        db.add(
            DictItem(
                dict_code=dict_code,
                label=_coerce_text(item.get("label"), "label"),
                value=_coerce_text(item.get("value"), "value"),
                sort=_coerce_int(item.get("sort"), "sort", 0),
                status=_coerce_int(item.get("status"), "status", 1),
            )
        )
    db.commit()
    redis.delete(build_dict_cache_key(dict_code))
    return success(message="导入成功")
