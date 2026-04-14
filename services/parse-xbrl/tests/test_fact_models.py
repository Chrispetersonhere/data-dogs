from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.fact_models import InMemoryFactModelStore


def test_raw_and_normalized_fact_preserve_source_identity() -> None:
    store = InMemoryFactModelStore()
    unit = store.upsert_unit(measure_code="USD")
    period = store.upsert_period(period_start="2024-10-01", period_end="2024-12-31")

    raw = store.store_raw_fact(
        source_filing_accession="0000320193-24-000123",
        source_concept="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
        source_fact_key="context-2024Q4-1",
        unit_id=unit.unit_id,
        period_id=period.period_id,
        value_text="391035000000",
    )

    normalized = store.upsert_normalized_fact(
        raw_fact_id=raw.raw_fact_id,
        normalization_status="pending",
    )

    assert normalized.raw_fact_id == raw.raw_fact_id
    assert normalized.source_filing_accession == raw.source_filing_accession
    assert normalized.source_concept == raw.source_concept
    assert normalized.unit_id == raw.unit_id
    assert normalized.period_id == raw.period_id
    assert normalized.normalization_status == "pending"


def test_rerun_deduplicates_raw_fact_identity() -> None:
    store = InMemoryFactModelStore()
    unit = store.upsert_unit(measure_code="shares")
    period = store.upsert_period(period_start="2024-01-01", period_end="2024-12-31")

    first = store.store_raw_fact(
        source_filing_accession="0000789019-24-000045",
        source_concept="dei:EntityCommonStockSharesOutstanding",
        source_fact_key="context-instant-1",
        unit_id=unit.unit_id,
        period_id=period.period_id,
        value_text="7432100000",
    )
    second = store.store_raw_fact(
        source_filing_accession="0000789019-24-000045",
        source_concept="dei:EntityCommonStockSharesOutstanding",
        source_fact_key="context-instant-1",
        unit_id=unit.unit_id,
        period_id=period.period_id,
        value_text="7432100000",
    )

    assert first.raw_fact_id == second.raw_fact_id
    assert len(store.raw_facts) == 1


def test_normalized_requires_existing_raw_fact() -> None:
    store = InMemoryFactModelStore()

    with pytest.raises(ValueError, match="raw_fact_id not found"):
        store.upsert_normalized_fact(
            raw_fact_id="does-not-exist",
            normalization_status="pending",
        )


def test_required_fields_are_enforced() -> None:
    store = InMemoryFactModelStore()

    with pytest.raises(ValueError, match="measure_code"):
        store.upsert_unit(measure_code="")

    unit = store.upsert_unit(measure_code="USD")
    period = store.upsert_period(period_start="2024-10-01", period_end="2024-12-31")

    with pytest.raises(ValueError, match="source_filing_accession"):
        store.store_raw_fact(
            source_filing_accession="",
            source_concept="us-gaap:Assets",
            source_fact_key="ctx-1",
            unit_id=unit.unit_id,
            period_id=period.period_id,
            value_text="1",
        )
