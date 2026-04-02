from datetime import datetime

from pydantic import BaseModel, Field


class TodoBase(BaseModel):
    """待办基础 Schema"""

    title: str = Field(..., min_length=1, max_length=100, description="待办标题")
    description: str | None = Field(default=None, description="待办描述")
    priority: int = Field(default=0, ge=0, le=2, description="优先级: 0-低 1-中 2-高")
    due_date: datetime | None = Field(default=None, description="截止日期")
    category: str | None = Field(default=None, description="分类标签")


class TodoCreate(TodoBase):
    """创建待办 Schema"""

    pass


class TodoUpdate(BaseModel):
    """更新待办 Schema"""

    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None)
    priority: int | None = Field(default=None, ge=0, le=2)
    status: int | None = Field(default=None, ge=0, le=1)
    due_date: datetime | None = Field(default=None)
    category: str | None = Field(default=None)


class TodoToggleResponse(BaseModel):
    """切换状态响应"""

    id: str
    status: int
    completed_at: datetime | None


class TodoResponse(TodoBase):
    """待办响应 Schema"""

    id: str = Field(..., description="待办ID")
    user_id: str = Field(..., description="创建用户ID")
    status: int = Field(..., description="状态: 0-待办 1-已完成")
    completed_at: datetime | None = Field(None, description="完成时间")
    create_time: datetime = Field(..., description="创建时间")
    update_time: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    """待办列表响应"""

    items: list[TodoResponse]
    total: int
    page: int
    page_size: int


class TodoCountResponse(BaseModel):
    """待办统计响应"""

    total: int = Field(..., description="总数量")
    pending: int = Field(..., description="待办数量")
    completed: int = Field(..., description="已完成数量")
    high_priority: int = Field(..., description="高优先级待办")
    overdue: int = Field(..., description="已逾期待办")


class TodoPageParams(BaseModel):
    """待办分页查询参数"""

    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")
    status: int | None = Field(default=None, ge=0, le=1, description="状态筛选")
    priority: int | None = Field(default=None, ge=0, le=2, description="优先级筛选")
    category: str | None = Field(default=None, description="分类筛选")
