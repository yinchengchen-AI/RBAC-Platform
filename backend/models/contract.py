from datetime import date
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class ContractStatus(str, Enum):
    """合同状态"""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    SIGNED = "signed"
    EXECUTING = "executing"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    EXPIRED = "expired"


class ContractType(str, Enum):
    """合同类型"""
    SAFETY_EVALUATION = "safety_evaluation"
    SAFETY_CONSULTING = "safety_consulting"
    SAFETY_TRAINING = "safety_training"
    HAZARD_ASSESSMENT = "hazard_assessment"
    EMERGENCY_PLAN = "emergency_plan"
    OTHER = "other"


class Contract(Base, IdMixin, TimestampMixin, AuditMixin):
    """合同表"""
    __tablename__ = "contracts"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="合同编号")
    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="合同名称")
    type: Mapped[str] = mapped_column(String(50), nullable=False, comment="合同类型")
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, comment="合同金额")
    invoiced_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False, comment="已开票金额")
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False, comment="已收款金额")
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id"), nullable=False, comment="客户ID")
    sign_date: Mapped[date | None] = mapped_column(Date, comment="签订日期")
    start_date: Mapped[date | None] = mapped_column(Date, comment="开始日期")
    end_date: Mapped[date | None] = mapped_column(Date, comment="结束日期")
    status: Mapped[str] = mapped_column(String(20), default=ContractStatus.DRAFT.value, nullable=False, comment="合同状态")
    service_content: Mapped[str | None] = mapped_column(Text, comment="服务内容")
    service_cycle: Mapped[str | None] = mapped_column(String(50), comment="服务周期")
    service_times: Mapped[int] = mapped_column(default=1, nullable=False, comment="服务次数")
    payment_terms: Mapped[str | None] = mapped_column(Text, comment="付款条款")
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="负责人ID")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")

    attachments: Mapped[list["ContractAttachment"]] = relationship("ContractAttachment", back_populates="contract", cascade="all, delete-orphan")
    status_history: Mapped[list["ContractStatusHistory"]] = relationship("ContractStatusHistory", back_populates="contract", cascade="all, delete-orphan")


class ContractAttachment(Base, IdMixin, TimestampMixin, AuditMixin):
    """合同附件表"""
    __tablename__ = "contract_attachments"

    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, comment="合同ID")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="文件名")
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, comment="文件路径")
    file_size: Mapped[int] = mapped_column(default=0, nullable=False, comment="文件大小")
    file_type: Mapped[str | None] = mapped_column(String(50), comment="文件类型")

    contract: Mapped["Contract"] = relationship("Contract", back_populates="attachments")


class ContractStatusHistory(Base, IdMixin, TimestampMixin, AuditMixin):
    """合同状态变更历史表"""
    __tablename__ = "contract_status_history"

    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, comment="合同ID")
    old_status: Mapped[str | None] = mapped_column(String(20), comment="原状态")
    new_status: Mapped[str] = mapped_column(String(20), nullable=False, comment="新状态")
    operator_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="操作人ID")
    operator_name: Mapped[str | None] = mapped_column(String(50), comment="操作人姓名")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")

    contract: Mapped["Contract"] = relationship("Contract", back_populates="status_history")
