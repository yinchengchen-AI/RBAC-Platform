from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import permission_required
from core.responses import success
from db.session import get_db
from models.document import Document
from models.user import User

router = APIRouter()


@router.get("")
def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(permission_required("business:document:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Document).where(Document.is_deleted.is_(False))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Document.create_time.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return success(data={"items": items, "total": total})
