from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import bind_current_user
from core.responses import success
from db.session import get_db
from models.company import Company
from models.contract import Contract
from models.finance import Invoice, Payment
from models.service import Service
from models.user import User

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(bind_current_user),
    db: Session = Depends(get_db),
):
    """获取工作台统计数据"""
    
    # 客户统计
    company_total = db.scalar(
        select(func.count()).where(Company.is_deleted.is_(False))
    ) or 0
    
    company_by_status = db.execute(
        select(Company.status, func.count())
        .where(Company.is_deleted.is_(False))
        .group_by(Company.status)
    ).all()
    
    # 合同统计
    contract_total = db.scalar(
        select(func.count()).where(Contract.is_deleted.is_(False))
    ) or 0
    
    contract_amount = db.scalar(
        select(func.sum(Contract.amount))
        .where(Contract.is_deleted.is_(False))
    ) or Decimal("0")
    
    contract_paid = db.scalar(
        select(func.sum(Contract.paid_amount))
        .where(Contract.is_deleted.is_(False))
    ) or Decimal("0")
    
    contract_by_status = db.execute(
        select(Contract.status, func.count())
        .where(Contract.is_deleted.is_(False))
        .group_by(Contract.status)
    ).all()
    
    # 服务统计
    service_total = db.scalar(
        select(func.count()).where(Service.is_deleted.is_(False))
    ) or 0
    
    service_by_status = db.execute(
        select(Service.status, func.count())
        .where(Service.is_deleted.is_(False))
        .group_by(Service.status)
    ).all()
    
    # 财务统计
    invoice_total = db.scalar(
        select(func.count()).where(Invoice.is_deleted.is_(False))
    ) or 0
    
    invoice_amount = db.scalar(
        select(func.sum(Invoice.amount))
        .where(Invoice.is_deleted.is_(False))
    ) or Decimal("0")
    
    payment_total = db.scalar(
        select(func.count()).where(Payment.is_deleted.is_(False))
    ) or 0
    
    payment_amount = db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.is_deleted.is_(False))
    ) or Decimal("0")
    
    # 最近7天趋势数据（简化处理，实际应该按日期分组）
    recent_companies = db.scalars(
        select(Company)
        .where(Company.is_deleted.is_(False))
        .order_by(Company.create_time.desc())
        .limit(5)
    ).all()
    
    recent_contracts = db.scalars(
        select(Contract)
        .where(Contract.is_deleted.is_(False))
        .order_by(Contract.create_time.desc())
        .limit(5)
    ).all()
    
    return success(data={
        "overview": {
            "company_total": company_total,
            "contract_total": contract_total,
            "contract_amount": float(contract_amount),
            "contract_paid": float(contract_paid),
            "service_total": service_total,
            "invoice_amount": float(invoice_amount),
            "payment_amount": float(payment_amount),
        },
        "company_by_status": [{"status": s, "count": c} for s, c in company_by_status],
        "contract_by_status": [{"status": s, "count": c} for s, c in contract_by_status],
        "service_by_status": [{"status": s, "count": c} for s, c in service_by_status],
        "recent_companies": [
            {
                "id": c.id,
                "name": c.name,
                "code": c.code,
                "status": c.status,
                "create_time": c.create_time.isoformat() if c.create_time else None,
            }
            for c in recent_companies
        ],
        "recent_contracts": [
            {
                "id": c.id,
                "name": c.name,
                "code": c.code,
                "amount": float(c.amount),
                "status": c.status,
                "create_time": c.create_time.isoformat() if c.create_time else None,
            }
            for c in recent_contracts
        ],
    })
