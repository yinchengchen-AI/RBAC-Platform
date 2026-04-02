from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from core.deps import bind_current_user, permission_required
from core.responses import success
from db.session import get_db
from models.company import Company, CompanyContact
from models.user import User

router = APIRouter()


@router.get("")
def list_companies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    keyword: str | None = None,
    status: str | None = None,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:company:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Company).where(Company.is_deleted.is_(False))

    if keyword:
        stmt = stmt.where(
            or_(
                Company.name.ilike(f"%{keyword}%"),
                Company.code.ilike(f"%{keyword}%"),
            )
        )
    if status:
        stmt = stmt.where(Company.status == status)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(
        stmt.order_by(Company.create_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return success(data={"items": items, "total": total, "page": page, "page_size": page_size})


@router.post("", status_code=status.HTTP_201_CREATED)
def create_company(
    payload: dict,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:company:create")),
    db: Session = Depends(get_db),
):
    company = Company(**payload, created_by=current_user.id)
    db.add(company)
    db.commit()
    db.refresh(company)
    return success(data=company)


@router.get("/{company_id}")
def get_company(
    company_id: str,
    _: User = Depends(permission_required("business:company:view")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company or company.is_deleted:
        return success(code=404, message="客户不存在")
    return success(data=company)


@router.put("/{company_id}")
def update_company(
    company_id: str,
    payload: dict,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:company:update")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company or company.is_deleted:
        return success(code=404, message="客户不存在")

    for key, value in payload.items():
        setattr(company, key, value)
    company.updated_by = current_user.id
    db.commit()
    return success(data=company)


@router.delete("/{company_id}")
def delete_company(
    company_id: str,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:company:delete")),
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if not company or company.is_deleted:
        return success(code=404, message="客户不存在")

    company.is_deleted = True
    company.updated_by = current_user.id
    db.commit()
    return success(message="删除成功")
