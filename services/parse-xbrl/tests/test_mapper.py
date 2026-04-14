from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.mapper import map_raw_fact, map_raw_facts


def test_map_raw_fact_returns_deterministic_mapping_with_audit_fields() -> None:
    raw = {
        "raw_fact_id": "raw-001",
        "source_concept": "us-gaap:Revenues",
        "unit": "USD",
        "value_text": "1000000",
        "period_start": "2025-01-01",
        "period_end": "2025-12-31",
    }

    mapped = map_raw_fact(raw)

    assert mapped is not None
    assert mapped.canonical_metric == "revenue"
    assert mapped.rule_id == "RULE_REV_US_GAAP_001"
    assert mapped.rule_source.endswith("#RULE_REV_US_GAAP_001")
    assert mapped.confidence == 0.99
    assert mapped.audit["mapping_reason"]
    assert mapped.audit["matched_on"] == {
        "source_concept": "us-gaap:Revenues",
        "unit": "USD",
    }


def test_map_raw_fact_returns_none_when_no_explainable_rule_matches() -> None:
    raw = {
        "raw_fact_id": "raw-002",
        "source_concept": "custom:RevenueProxy",
        "unit": "USD",
        "value_text": "123",
    }

    assert map_raw_fact(raw) is None


def test_map_raw_facts_filters_unmapped_facts_and_preserves_order() -> None:
    raws = [
        {
            "raw_fact_id": "raw-010",
            "source_concept": "us-gaap:Revenues",
            "unit": "USD",
            "value_text": "500",
        },
        {
            "raw_fact_id": "raw-011",
            "source_concept": "custom:NotExplainable",
            "unit": "USD",
            "value_text": "999",
        },
        {
            "raw_fact_id": "raw-012",
            "source_concept": "us-gaap:Assets",
            "unit": "USD",
            "value_text": "1200",
        },
    ]

    mapped = map_raw_facts(raws)

    assert [fact.raw_fact_id for fact in mapped] == ["raw-010", "raw-012"]
    assert [fact.canonical_metric for fact in mapped] == ["revenue", "assets_total"]


def test_map_raw_fact_requires_required_identity_fields() -> None:
    raw_missing = {
        "source_concept": "us-gaap:Revenues",
        "unit": "USD",
        "value_text": "7",
    }

    assert map_raw_fact(raw_missing) is None
