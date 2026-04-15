from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _require_non_empty_text(*, value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"missing required non-empty field: {field_name}")
    return value.strip()


@dataclass(frozen=True)
class RestatementVersion:
    restatement_version_id: str
    truth_key: str
    issuer_cik: str
    fiscal_period_end: str
    concept: str
    filing_accession: str
    value_text: str
    filed_at: str
    supersedes_restatement_version_id: str | None
    recorded_at: str


@dataclass(frozen=True)
class ResolvedCurrentTruth:
    truth_key: str
    issuer_cik: str
    fiscal_period_end: str
    concept: str
    current_restatement_version_id: str
    current_filing_accession: str
    current_value_text: str
    resolved_at: str


class InMemoryRestatementResolver:
    """Keeps append-only restatement history and separately tracked current truth."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._versions: dict[str, RestatementVersion] = {}
        self._history_by_truth_key: dict[str, list[str]] = {}
        self._current_by_truth_key: dict[str, ResolvedCurrentTruth] = {}

    @property
    def versions(self) -> dict[str, RestatementVersion]:
        return self._versions

    @property
    def history_by_truth_key(self) -> dict[str, list[str]]:
        return self._history_by_truth_key

    @property
    def current_by_truth_key(self) -> dict[str, ResolvedCurrentTruth]:
        return self._current_by_truth_key

    def record_fact(
        self,
        *,
        filing_accession: str,
        issuer_cik: str,
        fiscal_period_end: str,
        concept: str,
        value_text: str,
        filed_at: str,
    ) -> RestatementVersion:
        filing_accession = _require_non_empty_text(value=filing_accession, field_name="filing_accession")
        issuer_cik = _require_non_empty_text(value=issuer_cik, field_name="issuer_cik")
        fiscal_period_end = _require_non_empty_text(value=fiscal_period_end, field_name="fiscal_period_end")
        concept = _require_non_empty_text(value=concept, field_name="concept")
        value_text = _require_non_empty_text(value=value_text, field_name="value_text")
        filed_at = _require_non_empty_text(value=filed_at, field_name="filed_at")

        truth_key = self._build_truth_key(
            issuer_cik=issuer_cik,
            fiscal_period_end=fiscal_period_end,
            concept=concept,
        )

        version_id = hashlib.sha256(
            f"{filing_accession}|{truth_key}|{value_text}".encode("utf-8")
        ).hexdigest()

        with self._lock:
            existing = self._versions.get(version_id)
            if existing is not None:
                return existing

            previous_current = self._current_by_truth_key.get(truth_key)
            supersedes_restatement_version_id = (
                previous_current.current_restatement_version_id if previous_current is not None else None
            )

            version = RestatementVersion(
                restatement_version_id=version_id,
                truth_key=truth_key,
                issuer_cik=issuer_cik,
                fiscal_period_end=fiscal_period_end,
                concept=concept,
                filing_accession=filing_accession,
                value_text=value_text,
                filed_at=filed_at,
                supersedes_restatement_version_id=supersedes_restatement_version_id,
                recorded_at=_utc_now_iso(),
            )
            self._versions[version_id] = version
            self._history_by_truth_key.setdefault(truth_key, []).append(version_id)
            self._current_by_truth_key[truth_key] = ResolvedCurrentTruth(
                truth_key=truth_key,
                issuer_cik=issuer_cik,
                fiscal_period_end=fiscal_period_end,
                concept=concept,
                current_restatement_version_id=version.restatement_version_id,
                current_filing_accession=version.filing_accession,
                current_value_text=version.value_text,
                resolved_at=_utc_now_iso(),
            )
            return version

    def get_history(self, *, issuer_cik: str, fiscal_period_end: str, concept: str) -> list[RestatementVersion]:
        truth_key = self._build_truth_key(
            issuer_cik=issuer_cik,
            fiscal_period_end=fiscal_period_end,
            concept=concept,
        )
        version_ids = self._history_by_truth_key.get(truth_key, [])
        return [self._versions[version_id] for version_id in version_ids]

    def get_current(
        self,
        *,
        issuer_cik: str,
        fiscal_period_end: str,
        concept: str,
    ) -> ResolvedCurrentTruth | None:
        truth_key = self._build_truth_key(
            issuer_cik=issuer_cik,
            fiscal_period_end=fiscal_period_end,
            concept=concept,
        )
        return self._current_by_truth_key.get(truth_key)

    @staticmethod
    def _build_truth_key(*, issuer_cik: str, fiscal_period_end: str, concept: str) -> str:
        return hashlib.sha256(f"{issuer_cik}|{fiscal_period_end}|{concept}".encode("utf-8")).hexdigest()
