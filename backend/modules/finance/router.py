from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import bind_current_user, permission_required
from core.finance_logic import update_contract_invoiced_amount, update_contract_paid_amount, validate_invoice_amount, validate_payment_amount
from core.responses import success
from db.session import get_db
from models.contract import Contract
from models.finance import Invoice, Payment
from models.user import User
from schemas.finance import InvoiceCreate, PaymentCreate

router = APIRouter()


@router.get("/invoices")
def list_invoices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(permission_required("business:invoice:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Invoice).where(Invoice.is_deleted.is_(False))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Invoice.create_time.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return success(data={"items": items, "total": total})


@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:invoice:create")),
    db: Session = Depends(get_db),
):
    # 验证合同存在
    contract = db.get(Contract, payload.contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=400, detail="合同不存在")

    # 验证开票金额
    is_valid, error_msg = validate_invoice_amount(contract, payload.amount)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 创建发票
    invoice = Invoice(**payload.model_dump(), created_by=current_user.id)
    db.add(invoice)
    db.flush()

    # 更新合同已开票金额
    update_contract_invoiced_amount(db, payload.contract_id, payload.amount)

    return success(data=invoice)


@router.get("/payments")
def list_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    _: User = Depends(permission_required("business:payment:view")),
    db: Session = Depends(get_db),
):
    stmt = select(Payment).where(Payment.is_deleted.is_(False))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Payment.create_time.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return success(data={"items": items, "total": total})


@router.post("/payments", status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    current_user: User = Depends(bind_current_user),
    _: User = Depends(permission_required("business:payment:create")),
    db: Session = Depends(get_db),
):
    # 验证合同存在
    contract = db.get(Contract, payload.contract_id)
    if not contract or contract.is_deleted:
        raise HTTPException(status_code=400, detail="合同不存在")

    # 验证收款金额
    is_valid, error_msg = validate_payment_amount(contract, payload.amount)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 创建收款记录
    payment = Payment(**payload.model_dump(), created_by=current_user.id)
    db.add(payment)
    db.flush()

    # 更新合同已收款金额
    update_contract_paid_amount(db, payload.contract_id, payload.amount)

    return success(data=payment)

