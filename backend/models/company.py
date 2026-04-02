from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class CompanyScale(str, Enum):
    """企业规模"""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    XLARGE = "xlarge"


class CompanyStatus(str, Enum):
    """客户状态"""
    POTENTIAL = "potential"
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOST = "lost"


class Company(Base, IdMixin, TimestampMixin, AuditMixin):
    """客户企业表"""
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="企业名称")
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True, comment="客户编码")
    short_name: Mapped[str | None] = mapped_column(String(100), comment="企业简称")
    unified_code: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, comment="统一社会信用代码")
    industry: Mapped[str | None] = mapped_column(String(100), comment="所属行业")
    scale: Mapped[str | None] = mapped_column(String(20), comment="企业规模")
    province: Mapped[str | None] = mapped_column(String(50), comment="省份")
    city: Mapped[str | None] = mapped_column(String(50), comment="城市")
    district: Mapped[str | None] = mapped_column(String(50), comment="区县")
    street: Mapped[str | None] = mapped_column(String(50), comment="镇街")
    address: Mapped[str | None] = mapped_column(String(500), comment="详细地址")
    status: Mapped[str] = mapped_column(String(20), default=CompanyStatus.POTENTIAL.value, nullable=False, comment="客户状态")
    source: Mapped[str | None] = mapped_column(String(50), comment="客户来源")
    manager_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="客户经理ID")
    remark: Mapped[str | None] = mapped_column(Text, comment="备注")

    contacts: Mapped[list["CompanyContact"]] = relationship("CompanyContact", back_populates="company", cascade="all, delete-orphan")


class CompanyContact(Base, IdMixin, TimestampMixin, AuditMixin):
    """企业联系人表"""
    __tablename__ = "company_contacts"

    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, comment="企业ID")
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    phone: Mapped[str | None] = mapped_column(String(20), comment="手机号")
    email: Mapped[str | None] = mapped_column(String(100), comment="邮箱")
    position: Mapped[str | None] = mapped_column(String(50), comment="职位")
    department: Mapped[str | None] = mapped_column(String(50), comment="部门")
    is_primary: Mapped[bool] = mapped_column(default=False, nullable=False, comment="是否主要联系人")

    company: Mapped["Company"] = relationship("Company", back_populates="contacts")
