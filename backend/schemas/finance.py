from pydantic import BaseModel, Field
from datetime import date
from decimal import Decimal


class InvoiceCreate(BaseModel):
    invoice_no: str = Field(..., min_length=1, max_length=50)
    invoice_code: str | None = None
    contract_id: str
    type: str
    amount: Decimal = Field(..., gt=0)
    tax_amount: Decimal | None = Field(None, ge=0)
    issue_date: date
    buyer_name: str
    buyer_tax_no: str | None = None
    seller_name: str
    seller_tax_no: str | None = None
    remark: str | None = None


class PaymentCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    contract_id: str
    invoice_id: str | None = None
    amount: Decimal = Field(..., gt=0)
    payment_date: date
    method: str
    payer_name: str | None = None
    payer_account: str | None = None
    receiver_account: str | None = None
    voucher_no: str | None = None
    remark: str | None = None
