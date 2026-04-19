from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.insider_ingest import (  # noqa: E402
    PARSER_VERSION,
    InMemoryInsiderStore,
    ingest_insider_dataset,
)


AAPL_SOURCE_URL = "https://www.sec.gov/Archives/edgar/data/320193/000032019324000099/xslF345X05/wk-form4_1700000001.xml"
AAPL_ACCESSION = "0000320193-24-000099"


def _aapl_insider() -> dict[str, object]:
    return {
        "insider_full_name": "Cook Timothy D",
        "insider_cik": "0001214156",
        "is_director": False,
        "is_officer": True,
        "is_ten_percent_owner": False,
        "is_other_reporter": False,
        "officer_title": "Chief Executive Officer",
    }


def _aapl_transactions() -> list[dict[str, object]]:
    return [
        {
            "security_title": "Common Stock",
            "security_ticker": "AAPL",
            "transaction_date": "2024-10-01",
            "transaction_code": "S",
            "acquired_or_disposed": "D",
            "shares": 511000,
            "price_per_share": 227.52,
            "shares_owned_after": 2411000,
            "ownership_form": "D",
        },
        {
            "security_title": "Restricted Stock Units",
            "security_ticker": "AAPL",
            "transaction_date": "2024-10-01",
            "transaction_code": "A",
            "acquired_or_disposed": "A",
            "shares": 511000,
            "price_per_share": 0.0,
            "shares_owned_after": 2922000,
            "ownership_form": "D",
        },
    ]


def _aapl_holdings() -> list[dict[str, object]]:
    return [
        {
            "security_title": "Common Stock",
            "security_ticker": "AAPL",
            "shares_owned": 2411000,
            "ownership_form": "D",
            "as_of_date": "2024-10-01",
        }
    ]


def test_ingest_separates_raw_from_normalized_and_preserves_full_source_provenance() -> None:
    store = InMemoryInsiderStore()

    result = ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-001",
        insider=_aapl_insider(),
        transactions=_aapl_transactions(),
        holdings=_aapl_holdings(),
        store=store,
    )

    assert result.staged_transaction_count == 2
    assert result.staged_holding_count == 1
    assert result.source_url == AAPL_SOURCE_URL
    assert result.source_accession == AAPL_ACCESSION
    assert result.parser_version == PARSER_VERSION
    assert result.ingest_job_id == "job-aapl-form4-001"

    assert len(store.raw_artifacts) == 1
    raw = next(iter(store.raw_artifacts.values()))
    assert raw.source_url == AAPL_SOURCE_URL
    assert raw.source_accession == AAPL_ACCESSION
    assert raw.issuer_cik == "0000320193"
    assert raw.parser_version == PARSER_VERSION
    assert raw.ingest_job_id == "job-aapl-form4-001"
    assert raw.fetched_at.endswith("+00:00")
    assert len(raw.checksum_sha256) == 64

    payload = json.loads(raw.payload_json)
    assert payload["insider"]["insider_full_name"] == "Cook Timothy D"
    assert len(payload["transactions"]) == 2
    assert len(payload["holdings"]) == 1

    assert len(store.insiders) == 1
    insider = next(iter(store.insiders.values()))
    assert insider.issuer_cik == "0000320193"
    assert insider.insider_cik == "0001214156"
    assert insider.insider_full_name == "Cook Timothy D"
    assert insider.is_officer is True
    assert insider.officer_title == "Chief Executive Officer"

    assert len(store.transactions) == 2
    for txn in store.transactions:
        assert txn.insider_id == insider.insider_id
        assert txn.issuer_cik == "0000320193"
        assert txn.raw_insider_artifact_id == raw.raw_insider_artifact_id
        assert txn.source_url == AAPL_SOURCE_URL
        assert txn.source_accession == AAPL_ACCESSION
        assert txn.source_fetched_at == raw.fetched_at
        assert txn.source_checksum == raw.checksum_sha256
        assert txn.parser_version == PARSER_VERSION
        assert txn.ingest_job_id == "job-aapl-form4-001"

    sale = next(t for t in store.transactions if t.transaction_code == "S")
    assert sale.security_ticker == "AAPL"
    assert sale.acquired_or_disposed == "D"
    assert sale.shares == 511000.0
    assert sale.price_per_share == 227.52
    assert sale.shares_owned_after == 2411000.0
    assert sale.ownership_form == "D"

    assert len(store.holdings) == 1
    holding = store.holdings[0]
    assert holding.insider_id == insider.insider_id
    assert holding.issuer_cik == "0000320193"
    assert holding.security_ticker == "AAPL"
    assert holding.security_title == "Common Stock"
    assert holding.as_of_date == "2024-10-01"
    assert holding.shares_owned == 2411000.0
    assert holding.raw_insider_artifact_id == raw.raw_insider_artifact_id
    assert holding.source_checksum == raw.checksum_sha256


def test_rerun_with_identical_inputs_is_idempotent() -> None:
    store = InMemoryInsiderStore()

    kwargs = dict(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="0000320193",
        ingest_job_id="job-aapl-form4-002",
        insider=_aapl_insider(),
        transactions=_aapl_transactions(),
        holdings=_aapl_holdings(),
    )

    first = ingest_insider_dataset(store=store, **kwargs)
    second = ingest_insider_dataset(store=store, **kwargs)

    assert first.staged_transaction_count == 2
    assert first.staged_holding_count == 1
    assert second.staged_transaction_count == 0
    assert second.staged_holding_count == 0
    assert first.raw_checksum_sha256 == second.raw_checksum_sha256
    assert first.raw_insider_artifact_id == second.raw_insider_artifact_id
    assert first.insider_id == second.insider_id
    assert len(store.raw_artifacts) == 1
    assert len(store.transactions) == 2
    assert len(store.holdings) == 1
    assert len(store.insiders) == 1


def test_different_filing_produces_distinct_raw_artifact_and_preserves_linkage() -> None:
    store = InMemoryInsiderStore()

    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-003",
        insider=_aapl_insider(),
        transactions=_aapl_transactions()[:1],
        store=store,
    )

    newer_url = (
        "https://www.sec.gov/Archives/edgar/data/320193/000032019324000115/xslF345X05/wk-form4_1700000002.xml"
    )
    newer_accession = "0000320193-24-000115"
    newer_transactions = [
        {
            "security_title": "Common Stock",
            "security_ticker": "AAPL",
            "transaction_date": "2024-11-15",
            "transaction_code": "S",
            "acquired_or_disposed": "D",
            "shares": 100000,
            "price_per_share": 230.10,
            "shares_owned_after": 2311000,
            "ownership_form": "D",
        }
    ]
    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=newer_url,
        source_accession=newer_accession,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-004",
        insider=_aapl_insider(),
        transactions=newer_transactions,
        store=store,
    )

    assert len(store.raw_artifacts) == 2
    assert len(store.insiders) == 1
    assert len(store.transactions) == 2

    accessions = {t.source_accession for t in store.transactions}
    assert accessions == {AAPL_ACCESSION, newer_accession}

    for txn in store.transactions:
        matching_raw = next(
            r for r in store.raw_artifacts.values() if r.source_accession == txn.source_accession
        )
        assert txn.raw_insider_artifact_id == matching_raw.raw_insider_artifact_id
        assert txn.source_url == matching_raw.source_url
        assert txn.source_checksum == matching_raw.checksum_sha256


def test_security_linkage_ticker_is_optional_but_security_title_is_required() -> None:
    store = InMemoryInsiderStore()

    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url="https://www.sec.gov/Archives/edgar/data/789019/000078901924000050/wk-form4.xml",
        source_accession="0000789019-24-000050",
        issuer_cik="0000789019",
        ingest_job_id="job-msft-form4-001",
        insider={
            "insider_full_name": "Nadella Satya",
            "insider_cik": "0001513362",
            "is_officer": True,
            "officer_title": "Chief Executive Officer",
        },
        transactions=[
            {
                "security_title": "Common Stock",
                "security_ticker": None,
                "transaction_date": "2024-03-15",
                "transaction_code": "S",
                "acquired_or_disposed": "D",
                "shares": 28000,
                "price_per_share": 415.50,
                "shares_owned_after": 800000,
                "ownership_form": "D",
            }
        ],
        store=store,
    )

    assert len(store.transactions) == 1
    txn = store.transactions[0]
    assert txn.security_title == "Common Stock"
    assert txn.security_ticker is None
    assert txn.issuer_cik == "0000789019"

    with pytest.raises(ValueError, match="security_title"):
        ingest_insider_dataset(
            dataset_name="sec-form4",
            source_url="https://www.sec.gov/Archives/edgar/data/789019/000078901924000051/wk-form4.xml",
            source_accession="0000789019-24-000051",
            issuer_cik="0000789019",
            ingest_job_id="job-msft-form4-002",
            insider={
                "insider_full_name": "Nadella Satya",
                "is_officer": True,
            },
            transactions=[
                {
                    "transaction_date": "2024-03-16",
                    "transaction_code": "S",
                    "acquired_or_disposed": "D",
                    "shares": 1000,
                }
            ],
            store=store,
        )


def test_invalid_acquired_or_disposed_code_is_rejected() -> None:
    store = InMemoryInsiderStore()
    with pytest.raises(ValueError, match="acquired_or_disposed"):
        ingest_insider_dataset(
            dataset_name="sec-form4",
            source_url=AAPL_SOURCE_URL,
            source_accession=AAPL_ACCESSION,
            issuer_cik="320193",
            ingest_job_id="job-aapl-form4-bad",
            insider=_aapl_insider(),
            transactions=[
                {
                    "security_title": "Common Stock",
                    "transaction_date": "2024-10-01",
                    "transaction_code": "S",
                    "acquired_or_disposed": "X",  # invalid
                    "shares": 1,
                    "price_per_share": 1,
                }
            ],
            store=store,
        )


def test_invalid_transaction_date_is_rejected() -> None:
    store = InMemoryInsiderStore()
    with pytest.raises(ValueError, match="transaction_date"):
        ingest_insider_dataset(
            dataset_name="sec-form4",
            source_url=AAPL_SOURCE_URL,
            source_accession=AAPL_ACCESSION,
            issuer_cik="320193",
            ingest_job_id="job-aapl-form4-bad-date",
            insider=_aapl_insider(),
            transactions=[
                {
                    "security_title": "Common Stock",
                    "transaction_date": "10/01/2024",
                    "transaction_code": "S",
                    "acquired_or_disposed": "D",
                    "shares": 1,
                }
            ],
            store=store,
        )


def test_issuer_cik_is_normalized_to_ten_digits_for_linkage() -> None:
    store = InMemoryInsiderStore()
    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-norm",
        insider=_aapl_insider(),
        store=store,
    )
    insider = next(iter(store.insiders.values()))
    raw = next(iter(store.raw_artifacts.values()))
    assert insider.issuer_cik == "0000320193"
    assert raw.issuer_cik == "0000320193"


def test_non_digit_issuer_cik_is_rejected() -> None:
    store = InMemoryInsiderStore()
    with pytest.raises(ValueError, match="issuer_cik"):
        ingest_insider_dataset(
            dataset_name="sec-form4",
            source_url=AAPL_SOURCE_URL,
            source_accession=AAPL_ACCESSION,
            issuer_cik="AAPL",
            ingest_job_id="job-aapl-form4-badcik",
            insider=_aapl_insider(),
            store=store,
        )


def test_same_insider_two_accessions_produces_distinct_transactions_with_shared_insider_id() -> None:
    store = InMemoryInsiderStore()

    first = ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-r1",
        insider=_aapl_insider(),
        transactions=[
            {
                "security_title": "Common Stock",
                "security_ticker": "AAPL",
                "transaction_date": "2024-10-01",
                "transaction_code": "S",
                "acquired_or_disposed": "D",
                "shares": 100,
                "price_per_share": 227.52,
                "ownership_form": "D",
            }
        ],
        store=store,
    )
    second = ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL.replace("000099", "000100"),
        source_accession="0000320193-24-000100",
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-r2",
        insider=_aapl_insider(),
        transactions=[
            {
                "security_title": "Common Stock",
                "security_ticker": "AAPL",
                "transaction_date": "2024-10-01",
                "transaction_code": "S",
                "acquired_or_disposed": "D",
                "shares": 100,
                "price_per_share": 227.52,
                "ownership_form": "D",
            }
        ],
        store=store,
    )

    assert first.insider_id == second.insider_id
    assert len(store.insiders) == 1
    assert len(store.raw_artifacts) == 2
    assert len(store.transactions) == 2
    assert {t.source_accession for t in store.transactions} == {
        AAPL_ACCESSION,
        "0000320193-24-000100",
    }
