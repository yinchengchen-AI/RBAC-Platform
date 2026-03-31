from pydantic import BaseModel, ConfigDict


class FileOut(BaseModel):
    id: str
    filename: str
    object_name: str
    bucket_name: str
    url: str
    content_type: str | None = None
    size: int

    model_config = ConfigDict(from_attributes=True)
