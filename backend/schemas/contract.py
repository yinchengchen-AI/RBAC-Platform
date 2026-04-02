from pydantic import BaseModel, Field
from datetime import date
from decimal import Decimal


class ContractCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    type: str
    amount: Decimal = Field(..., ge=0)
    company_id: str
    sign_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    service_content: str | None = None
    service_cycle: str | None = None
    service_times: int = 1
    payment_terms: str | None = None
    manager_id: str | None = None
    remark: str | None = None


class ContractUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    amount: Decimal | None = Field(None, ge=0)
    sign_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    service_content: str | None = None
    service_cycle: str | None = None
    service_times: int | None = None
    payment_terms: str | None = None
    manager_id: str | None = None
    remark: str | None = None


class ContractStatusUpdate(BaseModel):
    status: str
    remark: str | None = None
