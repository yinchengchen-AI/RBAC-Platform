from io import BytesIO
from uuid import uuid4

from minio import Minio

from core.config import settings


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def ensure_bucket(bucket_name: str) -> None:
    client = get_minio_client()
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)


def upload_public_file(
    filename: str, content: bytes, content_type: str
) -> tuple[str, str]:
    ensure_bucket(settings.minio_public_bucket)
    client = get_minio_client()
    object_name = f"uploads/{uuid4().hex}-{filename}"
    data = BytesIO(content)
    client.put_object(
        settings.minio_public_bucket,
        object_name,
        data,
        length=len(content),
        content_type=content_type,
    )
    return (
        object_name,
        f"http://{settings.minio_endpoint}/{settings.minio_public_bucket}/{object_name}",
    )
