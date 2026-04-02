from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import AuditMixin, Base, IdMixin, TimestampMixin


class DocumentType(str, Enum):
    CONTRACT = "contract"
    REPORT = "report"
    CERTIFICATE = "certificate"
    TRAINING = "training"
    POLICY = "policy"
    OTHER = "other"


class DocumentStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DISABLED = "disabled"


class Document(Base, IdMixin, TimestampMixin, AuditMixin):
    """文档表"""
    __tablename__ = "documents"

    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="文档标题")
    description: Mapped[str | None] = mapped_column(Text, comment="文档描述")
    type: Mapped[str] = mapped_column(String(20), nullable=False, comment="文档类型")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="文件名")
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, comment="文件路径")
    file_size: Mapped[int] = mapped_column(default=0, nullable=False, comment="文件大小")
    file_type: Mapped[str | None] = mapped_column(String(50), comment="文件MIME类型")
    file_ext: Mapped[str | None] = mapped_column(String(20), comment="文件扩展名")
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False, comment="版本号")
    status: Mapped[str] = mapped_column(String(20), default=DocumentStatus.ACTIVE.value, nullable=False, comment="状态")
    is_public: Mapped[bool] = mapped_column(default=False, nullable=False, comment="是否公开")
    allow_download: Mapped[bool] = mapped_column(default=True, nullable=False, comment="允许下载")
    view_count: Mapped[int] = mapped_column(default=0, nullable=False, comment="浏览次数")
    download_count: Mapped[int] = mapped_column(default=0, nullable=False, comment="下载次数")
    uploader_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sys_user.id"), comment="上传人ID")
