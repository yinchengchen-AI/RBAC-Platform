from datetime import date
from enum import Enum

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class ServiceType(str, Enum):
    ON_SITE = "on_site"
    REMOTE = "remote"
    TRAINING = "training"
    CONSULTING = "consulting"
    AUDIT = "audit"


class ServiceStatus(str, Enum):
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Service(Base, IdMixin, TimestampMixin, AuditMixin):
    """服务项目表"""
    __tablename__ = "services"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="服务编号")
    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="服务名称")
    type: Mapped[str] = mapped_column(String(20), nullable=False, comment="服务类型")
    contract_id: Mapped[str] = mapped_column(String(36), ForeignKey("contracts.id"), nullable=False, comment="合同ID")
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="负责人ID")
    planned_start_date: Mapped[date | None] = mapped_column(Date, comment="计划开始日期")
    planned_end_date: Mapped[date | None] = mapped_column(Date, comment="计划结束日期")
    actual_start_date: Mapped[date | None] = mapped_column(Date, comment="实际开始日期")
    actual_end_date: Mapped[date | None] = mapped_column(Date, comment="实际结束日期")
    status: Mapped[str] = mapped_column(String(20), default=ServiceStatus.PLANNED.value, nullable=False, comment="状态")
    description: Mapped[str | None] = mapped_column(Text, comment="服务描述")
    requirements: Mapped[str | None] = mapped_column(Text, comment="服务要求")
    deliverables: Mapped[str | None] = mapped_column(Text, comment="交付物")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")


class ServiceRecord(Base, IdMixin, TimestampMixin, AuditMixin):
    """服务执行记录表"""
    __tablename__ = "service_records"

    service_id: Mapped[str] = mapped_column(String(36), ForeignKey("services.id", ondelete="CASCADE"), nullable=False, comment="服务ID")
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="记录标题")
    record_date: Mapped[date] = mapped_column(Date, nullable=False, comment="记录日期")
    work_content: Mapped[str | None] = mapped_column(Text, comment="工作内容")
    findings: Mapped[str | None] = mapped_column(Text, comment="发现问题")
    suggestions: Mapped[str | None] = mapped_column(Text, comment="改进建议")
    client_confirm: Mapped[bool] = mapped_column(default=False, nullable=False, comment="客户确认")
    satisfaction: Mapped[int | None] = mapped_column(Integer, comment="满意度(1-5)")
    recorder_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="记录人ID")
