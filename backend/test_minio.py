import asyncio
from core.storage import upload_public_file

def test_upload():
    content = b"test content"
    filename = "test.txt"
    try:
        obj_name, url = upload_public_file(filename, content, "text/plain")
        print(f"Success! {url}")
    except Exception as e:
        print(f"Error: {e}")

test_upload()
