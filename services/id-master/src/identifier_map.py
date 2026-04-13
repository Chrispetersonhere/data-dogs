from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_required(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} must be non-empty")
    return normalized


def _normalize_subject_type(value: str) -> str:
    normalized = _normalize_required(value, "subject_type").lower()
    if normalized not in {"company", "issuer", "security"}:
        raise ValueError("subject_type must be one of: company, issuer, security")
    return normalized


def _normalize_identifier_type(value: str) -> str:
    return _normalize_required(value, "identifier_type").lower()


def _normalize_identifier_value(value: str) -> str:
    return _normalize_required(value, "identifier_value").upper()


@dataclass(frozen=True)
class IdentifierMapping:
    subject_type: str
    subject_id: str
    identifier_type: str
    identifier_value: str
    valid_from: str
    valid_to: str | None
    observed_at: str


class IdentifierMap:
    """In-memory identifier mapping layer with historical support."""

    def __init__(self) -> None:
        self._mappings: list[IdentifierMapping] = []

    def add_mapping(
        self,
        *,
        subject_type: str,
        subject_id: str,
        identifier_type: str,
        identifier_value: str,
        valid_from: str,
        valid_to: str | None = None,
        observed_at: str | None = None,
    ) -> IdentifierMapping:
        normalized_subject_type = _normalize_subject_type(subject_type)
        normalized_subject_id = _normalize_required(subject_id, "subject_id")
        normalized_identifier_type = _normalize_identifier_type(identifier_type)
        normalized_identifier_value = _normalize_identifier_value(identifier_value)
        normalized_valid_from = _normalize_required(valid_from, "valid_from")
        normalized_valid_to = valid_to.strip() if valid_to else None
        normalized_observed_at = observed_at or _utc_now_iso()

        candidate = IdentifierMapping(
            subject_type=normalized_subject_type,
            subject_id=normalized_subject_id,
            identifier_type=normalized_identifier_type,
            identifier_value=normalized_identifier_value,
            valid_from=normalized_valid_from,
            valid_to=normalized_valid_to,
            observed_at=normalized_observed_at,
        )

        for existing in self._mappings:
            if (
                existing.subject_type == candidate.subject_type
                and existing.subject_id == candidate.subject_id
                and existing.identifier_type == candidate.identifier_type
                and existing.identifier_value == candidate.identifier_value
                and existing.valid_from == candidate.valid_from
            ):
                return existing

        self._mappings.append(candidate)
        self._mappings.sort(
            key=lambda row: (
                row.identifier_type,
                row.identifier_value,
                row.subject_type,
                row.subject_id,
                row.valid_from,
            )
        )
        return candidate

    def get_by_internal_id(self, *, subject_type: str, subject_id: str) -> list[IdentifierMapping]:
        normalized_subject_type = _normalize_subject_type(subject_type)
        normalized_subject_id = _normalize_required(subject_id, "subject_id")
        return [
            row
            for row in self._mappings
            if row.subject_type == normalized_subject_type and row.subject_id == normalized_subject_id
        ]

    def get_by_external_identifier(self, *, identifier_type: str, identifier_value: str) -> list[IdentifierMapping]:
        normalized_identifier_type = _normalize_identifier_type(identifier_type)
        normalized_identifier_value = _normalize_identifier_value(identifier_value)
        return [
            row
            for row in self._mappings
            if row.identifier_type == normalized_identifier_type and row.identifier_value == normalized_identifier_value
        ]
