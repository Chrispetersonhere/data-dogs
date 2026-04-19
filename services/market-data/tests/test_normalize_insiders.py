from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.insider_ingest import (  # noqa: E402
    InMemoryInsiderStore,
    InsiderTransactionRow,
    ingest_insider_dataset,
)
from src.normalize_insiders import (  # noqa: E402
    NORMALIZED_CLASSES,
    NORMALIZER_VERSION,
    NormalizedInsiderTransaction,
    classify_transaction_code,
    normalize_transaction,
    normalize_transactions,
)


AAPL_SOURCE_URL = (
    "https://www.sec.gov/Archives/edgar/data/320193/"
    "000032019324000099/xslF345X05/wk-form4_1700000001.xml"
)
AAPL_ACCESSION = "0000320193-24-000099"


def _aapl_insider() -> dict[str, Any]:
    return {
        "insider_full_name": "Cook Timothy D",
        "insider_cik": "0001214156",
        "is_officer": True,
        "officer_title": "Chief Executive Officer",
    }


def _ingest_with_transaction(transaction: dict[str, Any]) -> InsiderTransactionRow:
    store = InMemoryInsiderStore()
    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-norm",
        insider=_aapl_insider(),
        transactions=[transaction],
        store=store,
    )
    assert len(store.transactions) == 1
    return store.transactions[0]


def _txn(**overrides: Any) -> dict[str, Any]:
    base = {
        "security_title": "Common Stock",
        "security_ticker": "AAPL",
        "transaction_date": "2024-10-01",
        "transaction_code": "P",
        "acquired_or_disposed": "A",
        "shares": 100,
        "price_per_share": 200.0,
        "ownership_form": "D",
    }
    base.update(overrides)
    return base


def test_classify_open_market_buy() -> None:
    cls, reason = classify_transaction_code("P", "A")
    assert cls == "buy"
    assert reason is None


def test_classify_open_market_sell() -> None:
    cls, reason = classify_transaction_code("S", "D")
    assert cls == "sell"
    assert reason is None


def test_classify_grant_from_issuer() -> None:
    cls, reason = classify_transaction_code("A", "A")
    assert cls == "grant"
    assert reason is None


def test_classify_disposition_back_to_issuer_is_sell() -> None:
    cls, reason = classify_transaction_code("D", "D")
    assert cls == "sell"
    assert reason is None


def test_classify_tender_disposition_is_sell() -> None:
    cls, reason = classify_transaction_code("U", "D")
    assert cls == "sell"
    assert reason is None


@pytest.mark.parametrize("code", ["M", "C", "E", "H", "O", "X", "K"])
@pytest.mark.parametrize("direction", ["A", "D"])
def test_classify_derivative_events(code: str, direction: str) -> None:
    cls, reason = classify_transaction_code(code, direction)
    assert cls == "derivative_event"
    assert reason is None


@pytest.mark.parametrize("code", ["F", "G", "W", "Z"])
@pytest.mark.parametrize("direction", ["A", "D"])
def test_classify_holdings_changes(code: str, direction: str) -> None:
    cls, reason = classify_transaction_code(code, direction)
    assert cls == "holdings_change"
    assert reason is None


def test_classify_small_acquisition_is_buy() -> None:
    cls, reason = classify_transaction_code("L", "A")
    assert cls == "buy"
    assert reason is None


@pytest.mark.parametrize("code", ["V", "I", "J"])
@pytest.mark.parametrize("direction", ["A", "D"])
def test_inherently_ambiguous_codes_stay_ambiguous(code: str, direction: str) -> None:
    cls, reason = classify_transaction_code(code, direction)
    assert cls == "ambiguous"
    assert reason is not None
    assert code in reason


def test_unknown_code_is_ambiguous_with_reason() -> None:
    cls, reason = classify_transaction_code("Q", "A")
    assert cls == "ambiguous"
    assert reason == "unknown transaction_code: Q"


def test_direction_mismatch_is_ambiguous_not_silently_flipped() -> None:
    # P (purchase) legitimately only maps when direction is A; a D direction must not be
    # silently reclassified as sell.
    cls, reason = classify_transaction_code("P", "D")
    assert cls == "ambiguous"
    assert reason is not None
    assert "P" in reason and "D" in reason

    # Mirror case: S (sale) with A direction must not be reclassified as buy.
    cls, reason = classify_transaction_code("S", "A")
    assert cls == "ambiguous"
    assert reason is not None
    assert "S" in reason and "A" in reason


def test_invalid_inputs_raise() -> None:
    with pytest.raises(ValueError):
        classify_transaction_code("", "A")
    with pytest.raises(ValueError):
        classify_transaction_code("P", "X")


def test_normalize_transaction_preserves_full_provenance_and_stamps_normalizer_version() -> None:
    staged = _ingest_with_transaction(
        _txn(transaction_code="P", acquired_or_disposed="A", shares=150, price_per_share=210.10),
    )

    normalized = normalize_transaction(staged)
    assert isinstance(normalized, NormalizedInsiderTransaction)
    assert normalized.normalized_class == "buy"
    assert normalized.normalized_ambiguous is False
    assert normalized.normalized_reason is None
    assert normalized.normalizer_version == NORMALIZER_VERSION
    assert normalized.normalized_at.endswith("+00:00")

    # Provenance must carry over exactly from the staged row.
    assert normalized.insider_id == staged.insider_id
    assert normalized.issuer_cik == staged.issuer_cik
    assert normalized.raw_insider_artifact_id == staged.raw_insider_artifact_id
    assert normalized.source_url == staged.source_url
    assert normalized.source_accession == staged.source_accession
    assert normalized.source_fetched_at == staged.source_fetched_at
    assert normalized.source_checksum == staged.source_checksum
    assert normalized.parser_version == staged.parser_version
    assert normalized.ingest_job_id == staged.ingest_job_id
    assert normalized.recorded_at == staged.recorded_at

    # Transaction payload must not be mutated.
    assert normalized.transaction_code == "P"
    assert normalized.acquired_or_disposed == "A"
    assert normalized.shares == 150.0
    assert normalized.price_per_share == 210.10
    assert normalized.security_title == "Common Stock"
    assert normalized.security_ticker == "AAPL"


def test_normalize_does_not_mutate_numeric_precision() -> None:
    staged = _ingest_with_transaction(
        _txn(transaction_code="S", acquired_or_disposed="D", shares=511000, price_per_share=227.52),
    )
    normalized = normalize_transaction(staged)
    assert normalized.normalized_class == "sell"
    # No rounding, no unit conversion — the source numbers survive verbatim.
    assert normalized.shares == 511000.0
    assert normalized.price_per_share == 227.52
    assert normalized.shares_owned_after == staged.shares_owned_after


def test_ambiguous_row_preserves_source_row_and_flags_reason() -> None:
    staged = _ingest_with_transaction(
        _txn(transaction_code="J", acquired_or_disposed="A"),
    )
    normalized = normalize_transaction(staged)
    assert normalized.normalized_class == "ambiguous"
    assert normalized.normalized_ambiguous is True
    assert normalized.normalized_reason is not None
    assert "J" in normalized.normalized_reason
    # Even for ambiguous rows, the underlying source fields survive untouched for audit.
    assert normalized.transaction_code == "J"
    assert normalized.acquired_or_disposed == "A"
    assert normalized.raw_insider_artifact_id == staged.raw_insider_artifact_id


def test_ambiguous_direction_mismatch_is_flagged() -> None:
    # The ingest layer accepts any A/D on any code; normalization must catch the mismatch.
    staged = _ingest_with_transaction(
        _txn(transaction_code="P", acquired_or_disposed="D"),
    )
    normalized = normalize_transaction(staged)
    assert normalized.normalized_class == "ambiguous"
    assert normalized.normalized_ambiguous is True
    assert normalized.normalized_reason is not None
    assert "P" in normalized.normalized_reason
    assert "D" in normalized.normalized_reason


def test_normalize_transactions_preserves_order_and_covers_all_required_classes() -> None:
    store = InMemoryInsiderStore()
    ingest_insider_dataset(
        dataset_name="sec-form4",
        source_url=AAPL_SOURCE_URL,
        source_accession=AAPL_ACCESSION,
        issuer_cik="320193",
        ingest_job_id="job-aapl-form4-mixed",
        insider=_aapl_insider(),
        transactions=[
            _txn(
                transaction_code="P",
                acquired_or_disposed="A",
                transaction_date="2024-10-01",
                shares=100,
                price_per_share=220.0,
            ),
            _txn(
                transaction_code="S",
                acquired_or_disposed="D",
                transaction_date="2024-10-02",
                shares=50,
                price_per_share=225.0,
            ),
            _txn(
                transaction_code="A",
                acquired_or_disposed="A",
                transaction_date="2024-10-03",
                security_title="Restricted Stock Units",
                shares=500,
                price_per_share=0.0,
            ),
            _txn(
                transaction_code="M",
                acquired_or_disposed="A",
                transaction_date="2024-10-04",
                security_title="Employee Stock Option",
                shares=1000,
                price_per_share=50.0,
            ),
            _txn(
                transaction_code="F",
                acquired_or_disposed="D",
                transaction_date="2024-10-05",
                shares=25,
                price_per_share=225.0,
            ),
            _txn(
                transaction_code="J",
                acquired_or_disposed="A",
                transaction_date="2024-10-06",
                shares=1,
                price_per_share=0.0,
            ),
        ],
        store=store,
    )

    normalized = normalize_transactions(store.transactions)
    assert len(normalized) == 6

    classes = [n.normalized_class for n in normalized]
    assert classes == [
        "buy",
        "sell",
        "grant",
        "derivative_event",
        "holdings_change",
        "ambiguous",
    ]

    # The 5 required classes must all be represented in this mixed batch, and every row
    # must resolve to a known class from the canonical set.
    resolved = {c for c in classes if c != "ambiguous"}
    assert resolved == {"buy", "sell", "grant", "derivative_event", "holdings_change"}
    assert all(n.normalized_class in NORMALIZED_CLASSES for n in normalized)

    # Only the J row is flagged ambiguous; the other five carry no reason.
    assert [n.normalized_ambiguous for n in normalized] == [False, False, False, False, False, True]
    assert normalized[-1].normalized_reason is not None

    # Every normalized row keeps provenance linkage to the staged row it came from.
    for staged_row, normalized_row in zip(store.transactions, normalized):
        assert normalized_row.raw_insider_artifact_id == staged_row.raw_insider_artifact_id
        assert normalized_row.source_accession == staged_row.source_accession
        assert normalized_row.source_checksum == staged_row.source_checksum
        assert normalized_row.parser_version == staged_row.parser_version
        assert normalized_row.ingest_job_id == staged_row.ingest_job_id
        assert normalized_row.normalizer_version == NORMALIZER_VERSION


def test_normalizer_version_is_stable_across_rows() -> None:
    staged_a = _ingest_with_transaction(_txn(transaction_code="P", acquired_or_disposed="A"))
    staged_b = _ingest_with_transaction(
        _txn(
            transaction_code="S",
            acquired_or_disposed="D",
            transaction_date="2024-10-02",
            shares=25,
        ),
    )
    versions = {normalize_transaction(staged_a).normalizer_version,
                normalize_transaction(staged_b).normalizer_version}
    assert versions == {NORMALIZER_VERSION}
