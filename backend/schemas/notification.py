from datetime import datetime

from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    """通知基础 Schema"""

    title: str = Field(..., min_length=1, max_length=100, description="通知标题")
    content: str = Field(..., min_length=1, description="通知内容")
    type: str = Field(default="info", description="通知类型: info/warning/success/system")
    category: str = Field(default="system", description="业务分类")


class NotificationCreate(NotificationBase):
    """创建通知 Schema"""

    user_id: str = Field(..., description="接收用户ID")
    source_id: str | None = Field(default=None, description="关联业务ID")
    source_type: str | None = Field(default=None, description="关联业务类型")


class NotificationUpdate(BaseModel):
    """更新通知 Schema"""

    is_read: bool = Field(..., description="是否已读")


class NotificationResponse(NotificationBase):
    """通知响应 Schema"""

    id: str = Field(..., description="通知ID")
    user_id: str = Field(..., description="接收用户ID")
    is_read: bool = Field(..., description="是否已读")
    read_time: datetime | None = Field(None, description="阅读时间")
    source_id: str | None = Field(None, description="关联业务ID")
    source_type: str | None = Field(None, description="关联业务类型")
    create_time: datetime = Field(..., description="创建时间")

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """通知列表响应"""

    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int


class NotificationCountResponse(BaseModel):
    """未读通知数量响应"""

    total: int = Field(..., description="未读总数")
    by_type: dict[str, int] = Field(default_factory=dict, description="按类型统计")


class NotificationPageParams(BaseModel):
    """通知分页查询参数"""

    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")
    is_read: bool | None = Field(default=None, description="是否已读筛选")
    category: str | None = Field(default=None, description="分类筛选")
