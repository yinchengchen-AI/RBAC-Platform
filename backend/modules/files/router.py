from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from core.deps import bind_current_user, permission_required
from core.responses import success
from core.storage import upload_public_file
from db.session import get_db
from models.file import SysFile
from models.user import User

router = APIRouter()


@router.get("")
def list_files(
    _: User = Depends(bind_current_user),
    __: User = Depends(permission_required("system:file:view")),
    db: Session = Depends(get_db),
):
    files = db.scalars(
        select(SysFile)
        .where(SysFile.is_deleted.is_(False))
        .order_by(SysFile.create_time.desc())
    ).all()
    return success(
        [
            {
                "id": item.id,
                "filename": item.filename,
                "object_name": item.object_name,
                "bucket_name": item.bucket_name,
                "url": item.url,
                "content_type": item.content_type,
                "size": item.size,
            }
            for item in files
        ]
    )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:file:upload")),
    db: Session = Depends(get_db),
):
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="文件内容不能为空"
        )
    object_name, url = upload_public_file(
        file.filename, content, file.content_type or "application/octet-stream"
    )
    entity = SysFile(
        filename=file.filename,
        object_name=object_name,
        bucket_name=settings.minio_public_bucket,
        url=url,
        content_type=file.content_type,
        size=len(content),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return success(
        {"id": entity.id, "filename": entity.filename, "url": entity.url},
        message="上传成功",
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("system:file:upload")),
    db: Session = Depends(get_db),
):
    item = db.get(SysFile, file_id)
    if not item or item.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文件不存在")
    item.is_deleted = True
    item.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")
