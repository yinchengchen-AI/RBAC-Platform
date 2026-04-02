from datetime import date
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class InvoiceStatus(str, Enum):
    PENDING = "pending"
    ISSUED = "issued"
    SENT = "sent"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class InvoiceType(str, Enum):
    SPECIAL = "special"
    NORMAL = "normal"
    ELECTRONIC = "electronic"


class PaymentMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    ONLINE = "online"
    OTHER = "other"


class Invoice(Base, IdMixin, TimestampMixin, AuditMixin):
    """发票表"""
    __tablename__ = "invoices"

    invoice_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="发票号码")
    invoice_code: Mapped[str | None] = mapped_column(String(50), comment="发票代码")
    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("contracts.id"), nullable=False, comment="合同ID")
    type: Mapped[str] = mapped_column(String(20), nullable=False, comment="发票类型")
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, comment="发票金额")
    tax_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), comment="税额")
    issue_date: Mapped[date] = mapped_column(Date, nullable=False, comment="开票日期")
    buyer_name: Mapped[str] = mapped_column(String(200), nullable=False, comment="购方名称")
    buyer_tax_no: Mapped[str | None] = mapped_column(String(50), comment="购方税号")
    seller_name: Mapped[str] = mapped_column(String(200), nullable=False, comment="销方名称")
    seller_tax_no: Mapped[str | None] = mapped_column(String(50), comment="销方税号")
    status: Mapped[str] = mapped_column(String(20), default=InvoiceStatus.PENDING.value, nullable=False, comment="状态")
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False, comment="已收款金额")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")


class Payment(Base, IdMixin, TimestampMixin, AuditMixin):
    """收款记录表"""
    __tablename__ = "payments"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="收款编号")
    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("contracts.id"), nullable=False, comment="合同ID")
    invoice_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("invoices.id"), comment="发票ID")
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, comment="收款金额")
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, comment="收款日期")
    method: Mapped[str] = mapped_column(String(20), nullable=False, comment="支付方式")
    payer_name: Mapped[str | None] = mapped_column(String(200), comment="付款方")
    payer_account: Mapped[str | None] = mapped_column(String(100), comment="付款账号")
    receiver_account: Mapped[str | None] = mapped_column(String(100), comment="收款账号")
    voucher_no: Mapped[str | None] = mapped_column(String(50), comment="凭证号")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")
