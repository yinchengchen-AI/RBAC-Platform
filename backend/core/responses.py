from typing import Any


def success(
    data: Any = None, message: str = "success", code: int = 0
) -> dict[str, Any]:
    return {"code": code, "message": message, "data": data}
