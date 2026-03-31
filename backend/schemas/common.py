from pydantic import BaseModel


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 10
    keyword: str | None = None


class PageResult(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
