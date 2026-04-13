from __future__ import annotations

from datetime import datetime, timezone


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_required(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} must be non-empty")
    return normalized


def normalize_upper(value: str, field_name: str) -> str:
    return normalize_required(value, field_name).upper()


def normalize_lower(value: str, field_name: str) -> str:
    return normalize_required(value, field_name).lower()


def normalize_optional(value: str | None) -> str | None:
    return value.strip() if value else None


def is_active_during_window(*, start: str, end: str | None, as_of: str) -> bool:
    if start > as_of:
        return False
    if end is None:
        return True
    return as_of < end
