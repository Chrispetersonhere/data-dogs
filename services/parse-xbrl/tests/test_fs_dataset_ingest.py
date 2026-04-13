from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "src" / "fs_dataset_ingest.py"
SPEC = importlib.util.spec_from_file_location("fs_dataset_ingest", MODULE_PATH)
assert SPEC and SPEC.loader
fs_dataset_ingest = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = fs_dataset_ingest
SPEC.loader.exec_module(fs_dataset_ingest)

InMemoryFsDatasetStore = fs_dataset_ingest.InMemoryFsDatasetStore
ingest_fs_dataset = fs_dataset_ingest.ingest_fs_dataset


def _sample_rows() -> list[dict[str, object]]:
    return [
        {
            "issuer_cik": "0000320193",
            "statement_code": "IS",
            "line_item": "RevenueFromContractWithCustomerExcludingAssessedTax",
            "amount": 391035000000,
            "unit": "USD",
        },
        {
            "issuer_cik": "0000320193",
            "statement_code": "BS",
            "line_item": "CashAndCashEquivalentsAtCarryingValue",
            "amount": 29943000000,
            "unit": "USD",
        },
    ]


def test_ingest_preserves_period_metadata_and_separates_raw_from_staging() -> None:
    store = InMemoryFsDatasetStore()

    result = ingest_fs_dataset(
        dataset_name="sec-fs-quarterly",
        source_url="https://www.sec.gov/files/dera/data/financial-statement-data-sets/2024q4.zip",
        period_start="2024-10-01",
        period_end="2024-12-31",
        period_type="quarter",
        rows=_sample_rows(),
        store=store,
    )

    assert result["staged_count"] == 2
    assert result["period_start"] == "2024-10-01"
    assert result["period_end"] == "2024-12-31"
    assert result["period_type"] == "quarter"
    assert len(store.raw_artifacts) == 1
    assert len(store.staging_rows) == 2

    raw_artifact = next(iter(store.raw_artifacts.values()))
    assert raw_artifact.period_start == "2024-10-01"
    assert raw_artifact.period_end == "2024-12-31"
    assert raw_artifact.period_type == "quarter"
    assert "RevenueFromContractWithCustomerExcludingAssessedTax" in raw_artifact.payload_json

    for row in store.staging_rows:
        assert row["period_start"] == "2024-10-01"
        assert row["period_end"] == "2024-12-31"
        assert row["period_type"] == "quarter"
        assert row["raw_checksum_sha256"] == raw_artifact.checksum_sha256
        assert "payload_json" not in row


def test_ingest_rerun_is_deduplicated_and_not_canonicalized() -> None:
    store = InMemoryFsDatasetStore()
    rows = [
        {
            "issuer_cik": "0000789019",
            "statement_code": "IS",
            "line_item": "CustomCompanySpecificLineItem",  # preserve source line item as-is
            "amount": 62020000000,
            "unit": "USD",
        }
    ]

    first = ingest_fs_dataset(
        dataset_name="sec-fs-annual",
        source_url="https://www.sec.gov/files/dera/data/financial-statement-data-sets/2024q4.zip",
        period_start="2024-01-01",
        period_end="2024-12-31",
        period_type="annual",
        rows=rows,
        store=store,
    )
    second = ingest_fs_dataset(
        dataset_name="sec-fs-annual",
        source_url="https://www.sec.gov/files/dera/data/financial-statement-data-sets/2024q4.zip",
        period_start="2024-01-01",
        period_end="2024-12-31",
        period_type="annual",
        rows=rows,
        store=store,
    )

    assert len(store.raw_artifacts) == 1
    assert len(store.staging_rows) == 1
    assert first["staged_count"] == 1
    assert second["staged_count"] == 0
    assert store.staging_rows[0]["line_item"] == "CustomCompanySpecificLineItem"


def test_same_rows_different_period_type_are_distinct_staging_records() -> None:
    store = InMemoryFsDatasetStore()
    rows = [
        {
            "issuer_cik": "0001652044",
            "statement_code": "CF",
            "line_item": "NetCashProvidedByUsedInOperatingActivities",
            "amount": 13256000000,
            "unit": "USD",
        }
    ]

    quarter = ingest_fs_dataset(
        dataset_name="sec-fs-quarterly",
        source_url="https://www.sec.gov/files/dera/data/financial-statement-data-sets/2024q4.zip",
        period_start="2024-10-01",
        period_end="2024-12-31",
        period_type="quarter",
        rows=rows,
        store=store,
    )
    ytd = ingest_fs_dataset(
        dataset_name="sec-fs-quarterly",
        source_url="https://www.sec.gov/files/dera/data/financial-statement-data-sets/2024q4.zip",
        period_start="2024-10-01",
        period_end="2024-12-31",
        period_type="year_to_date",
        rows=rows,
        store=store,
    )

    assert quarter["staged_count"] == 1
    assert ytd["staged_count"] == 1
    assert len(store.staging_rows) == 2
    assert quarter["raw_checksum_sha256"] != ytd["raw_checksum_sha256"]
