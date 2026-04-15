from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.restatement_resolution import InMemoryRestatementResolver


def test_supersession_logic_links_amendment_to_previous_current_truth() -> None:
    resolver = InMemoryRestatementResolver()

    original = resolver.record_fact(
        filing_accession="0000320193-24-000123",
        issuer_cik="0000320193",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:Assets",
        value_text="100",
        filed_at="2025-02-01T00:00:00+00:00",
    )
    amended = resolver.record_fact(
        filing_accession="0000320193-24-000130",
        issuer_cik="0000320193",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:Assets",
        value_text="120",
        filed_at="2025-02-20T00:00:00+00:00",
    )

    assert amended.supersedes_restatement_version_id == original.restatement_version_id


def test_prior_truth_is_preserved_in_append_only_history() -> None:
    resolver = InMemoryRestatementResolver()

    original = resolver.record_fact(
        filing_accession="0000789019-24-000045",
        issuer_cik="0000789019",
        fiscal_period_end="2024-12-31",
        concept="dei:EntityCommonStockSharesOutstanding",
        value_text="7432100000",
        filed_at="2025-01-31T00:00:00+00:00",
    )
    resolver.record_fact(
        filing_accession="0000789019-24-000055",
        issuer_cik="0000789019",
        fiscal_period_end="2024-12-31",
        concept="dei:EntityCommonStockSharesOutstanding",
        value_text="7440000000",
        filed_at="2025-02-15T00:00:00+00:00",
    )

    history = resolver.get_history(
        issuer_cik="0000789019",
        fiscal_period_end="2024-12-31",
        concept="dei:EntityCommonStockSharesOutstanding",
    )

    assert len(history) == 2
    assert history[0].restatement_version_id == original.restatement_version_id
    assert history[0].value_text == "7432100000"


def test_current_resolved_truth_is_separately_represented_from_history() -> None:
    resolver = InMemoryRestatementResolver()

    resolver.record_fact(
        filing_accession="0001652044-24-000090",
        issuer_cik="0001652044",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
        value_text="96000",
        filed_at="2025-02-10T00:00:00+00:00",
    )
    amended = resolver.record_fact(
        filing_accession="0001652044-24-000101",
        issuer_cik="0001652044",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
        value_text="97500",
        filed_at="2025-02-25T00:00:00+00:00",
    )

    current = resolver.get_current(
        issuer_cik="0001652044",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
    )
    history = resolver.get_history(
        issuer_cik="0001652044",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax",
    )

    assert current is not None
    assert current.current_restatement_version_id == amended.restatement_version_id
    assert current.current_value_text == "97500"
    assert len(history) == 2


def test_rerun_same_filing_is_idempotent_and_does_not_overwrite_history() -> None:
    resolver = InMemoryRestatementResolver()

    first = resolver.record_fact(
        filing_accession="0001018724-24-000010",
        issuer_cik="0001018724",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:Liabilities",
        value_text="8800",
        filed_at="2025-02-03T00:00:00+00:00",
    )
    second = resolver.record_fact(
        filing_accession="0001018724-24-000010",
        issuer_cik="0001018724",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:Liabilities",
        value_text="8800",
        filed_at="2025-02-03T00:00:00+00:00",
    )

    history = resolver.get_history(
        issuer_cik="0001018724",
        fiscal_period_end="2024-12-31",
        concept="us-gaap:Liabilities",
    )

    assert first.restatement_version_id == second.restatement_version_id
    assert len(history) == 1


def test_required_fields_are_enforced() -> None:
    resolver = InMemoryRestatementResolver()

    with pytest.raises(ValueError, match="filing_accession"):
        resolver.record_fact(
            filing_accession="",
            issuer_cik="0000320193",
            fiscal_period_end="2024-12-31",
            concept="us-gaap:Assets",
            value_text="100",
            filed_at="2025-02-01T00:00:00+00:00",
        )
