from __future__ import annotations

from typing import Any


def to_camel_key(key: str) -> str:
    parts = key.split("_")
    if len(parts) == 1:
        return key
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


def camelize_keys(data: Any) -> Any:
    if isinstance(data, dict):
        return {
            to_camel_key(str(key)): camelize_keys(value) for key, value in data.items()
        }
    if isinstance(data, list):
        return [camelize_keys(item) for item in data]
    return data
