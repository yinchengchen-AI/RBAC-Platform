from core.security import create_access_token, create_refresh_token, decode_token


def test_access_token_type() -> None:
    token = create_access_token("user-1")
    payload = decode_token(token)
    assert payload["sub"] == "user-1"
    assert payload["type"] == "access"
    assert "jti" in payload


def test_refresh_token_type() -> None:
    token = create_refresh_token("user-2")
    payload = decode_token(token)
    assert payload["sub"] == "user-2"
    assert payload["type"] == "refresh"
    assert "jti" in payload
