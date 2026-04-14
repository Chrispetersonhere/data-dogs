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
class Unit:
    unit_id: str
    measure_code: str


@dataclass(frozen=True)
class Period:
    period_id: str
    period_start: str
    period_end: str


@dataclass(frozen=True)
class XbrlFactRaw:
    raw_fact_id: str
    source_filing_accession: str
    source_concept: str
    source_fact_key: str
    unit_id: str
    period_id: str
    value_text: str
    captured_at: str


@dataclass(frozen=True)
class XbrlFactNormalized:
    normalized_fact_id: str
    raw_fact_id: str
    source_filing_accession: str
    source_concept: str
    unit_id: str
    period_id: str
    normalized_concept: str | None
    normalized_value_text: str | None
    normalization_status: str
    normalized_at: str


class InMemoryFactModelStore:
    """Normalized fact skeleton with strict raw identity preservation."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._units: dict[str, Unit] = {}
        self._periods: dict[str, Period] = {}
        self._raw_facts: dict[str, XbrlFactRaw] = {}
        self._normalized_facts_by_raw: dict[str, XbrlFactNormalized] = {}

    @property
    def units(self) -> dict[str, Unit]:
        return self._units

    @property
    def periods(self) -> dict[str, Period]:
        return self._periods

    @property
    def raw_facts(self) -> dict[str, XbrlFactRaw]:
        return self._raw_facts

    @property
    def normalized_facts_by_raw(self) -> dict[str, XbrlFactNormalized]:
        return self._normalized_facts_by_raw

    def upsert_unit(self, *, measure_code: str) -> Unit:
        measure_code = _require_non_empty_text(value=measure_code, field_name="measure_code")
        unit_id = hashlib.sha256(measure_code.encode("utf-8")).hexdigest()
        with self._lock:
            unit = self._units.get(unit_id)
            if unit is None:
                unit = Unit(unit_id=unit_id, measure_code=measure_code)
                self._units[unit_id] = unit
            return unit

    def upsert_period(self, *, period_start: str, period_end: str) -> Period:
        period_start = _require_non_empty_text(value=period_start, field_name="period_start")
        period_end = _require_non_empty_text(value=period_end, field_name="period_end")
        period_key = f"{period_start}:{period_end}"
        period_id = hashlib.sha256(period_key.encode("utf-8")).hexdigest()
        with self._lock:
            period = self._periods.get(period_id)
            if period is None:
                period = Period(period_id=period_id, period_start=period_start, period_end=period_end)
                self._periods[period_id] = period
            return period

    def store_raw_fact(
        self,
        *,
        source_filing_accession: str,
        source_concept: str,
        source_fact_key: str,
        unit_id: str,
        period_id: str,
        value_text: str,
    ) -> XbrlFactRaw:
        source_filing_accession = _require_non_empty_text(
            value=source_filing_accession, field_name="source_filing_accession"
        )
        source_concept = _require_non_empty_text(value=source_concept, field_name="source_concept")
        source_fact_key = _require_non_empty_text(value=source_fact_key, field_name="source_fact_key")
        unit_id = _require_non_empty_text(value=unit_id, field_name="unit_id")
        period_id = _require_non_empty_text(value=period_id, field_name="period_id")
        value_text = _require_non_empty_text(value=value_text, field_name="value_text")

        if unit_id not in self._units:
            raise ValueError("unit_id not found")
        if period_id not in self._periods:
            raise ValueError("period_id not found")

        raw_identity = f"{source_filing_accession}|{source_fact_key}|{source_concept}|{unit_id}|{period_id}"
        raw_fact_id = hashlib.sha256(raw_identity.encode("utf-8")).hexdigest()

        with self._lock:
            existing = self._raw_facts.get(raw_fact_id)
            if existing is not None:
                return existing

            fact = XbrlFactRaw(
                raw_fact_id=raw_fact_id,
                source_filing_accession=source_filing_accession,
                source_concept=source_concept,
                source_fact_key=source_fact_key,
                unit_id=unit_id,
                period_id=period_id,
                value_text=value_text,
                captured_at=_utc_now_iso(),
            )
            self._raw_facts[raw_fact_id] = fact
            return fact

    def upsert_normalized_fact(
        self,
        *,
        raw_fact_id: str,
        normalization_status: str,
        normalized_concept: str | None = None,
        normalized_value_text: str | None = None,
    ) -> XbrlFactNormalized:
        raw_fact_id = _require_non_empty_text(value=raw_fact_id, field_name="raw_fact_id")
        normalization_status = _require_non_empty_text(
            value=normalization_status, field_name="normalization_status"
        )

        raw_fact = self._raw_facts.get(raw_fact_id)
        if raw_fact is None:
            raise ValueError("raw_fact_id not found")

        normalized_fact_id = hashlib.sha256(f"normalized:{raw_fact_id}".encode("utf-8")).hexdigest()
        normalized = XbrlFactNormalized(
            normalized_fact_id=normalized_fact_id,
            raw_fact_id=raw_fact.raw_fact_id,
            source_filing_accession=raw_fact.source_filing_accession,
            source_concept=raw_fact.source_concept,
            unit_id=raw_fact.unit_id,
            period_id=raw_fact.period_id,
            normalized_concept=normalized_concept,
            normalized_value_text=normalized_value_text,
            normalization_status=normalization_status,
            normalized_at=_utc_now_iso(),
        )

        with self._lock:
            self._normalized_facts_by_raw[raw_fact_id] = normalized
            return normalized
