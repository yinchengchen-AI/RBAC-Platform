import json
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


def ensure_bucket(bucket_name: str, is_public: bool = False) -> None:
    client = get_minio_client()
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
        if is_public:
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                    }
                ],
            }
            client.set_bucket_policy(bucket_name, json.dumps(policy))


def upload_public_file(
    filename: str, content: bytes, content_type: str
) -> tuple[str, str]:
    ensure_bucket(settings.minio_public_bucket, is_public=True)
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
