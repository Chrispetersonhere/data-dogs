from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MappingRule:
    rule_id: str
    source: str
    source_concept: str
    allowed_units: tuple[str, ...]
    canonical_metric: str
    confidence: float
    explanation: str


@dataclass(frozen=True)
class MappedFact:
    raw_fact_id: str
    source_concept: str
    unit: str
    value_text: str
    period_start: str | None
    period_end: str | None
    canonical_metric: str
    rule_id: str
    rule_source: str
    confidence: float
    audit: dict[str, Any]


RULE_SOURCE = "packages/parser-rules/src/xbrl_rules.ts"

MAPPING_RULES: tuple[MappingRule, ...] = (
    MappingRule(
        rule_id="RULE_REV_US_GAAP_001",
        source="us-gaap:Revenues",
        source_concept="us-gaap:Revenues",
        allowed_units=("USD", "USD/shares"),
        canonical_metric="revenue",
        confidence=0.99,
        explanation="Exact us-gaap revenues concept with currency-denominated unit",
    ),
    MappingRule(
        rule_id="RULE_GP_US_GAAP_001",
        source="us-gaap:GrossProfit",
        source_concept="us-gaap:GrossProfit",
        allowed_units=("USD", "USD/shares"),
        canonical_metric="gross_profit",
        confidence=0.99,
        explanation="Exact us-gaap gross profit concept with currency-denominated unit",
    ),
    MappingRule(
        rule_id="RULE_OI_US_GAAP_001",
        source="us-gaap:OperatingIncomeLoss",
        source_concept="us-gaap:OperatingIncomeLoss",
        allowed_units=("USD", "USD/shares"),
        canonical_metric="operating_income",
        confidence=0.99,
        explanation="Exact us-gaap operating income(loss) concept with currency-denominated unit",
    ),
    MappingRule(
        rule_id="RULE_NI_US_GAAP_001",
        source="us-gaap:NetIncomeLoss",
        source_concept="us-gaap:NetIncomeLoss",
        allowed_units=("USD", "USD/shares"),
        canonical_metric="net_income",
        confidence=0.99,
        explanation="Exact us-gaap net income(loss) concept with currency-denominated unit",
    ),
    MappingRule(
        rule_id="RULE_ASSETS_US_GAAP_001",
        source="us-gaap:Assets",
        source_concept="us-gaap:Assets",
        allowed_units=("USD",),
        canonical_metric="assets_total",
        confidence=0.995,
        explanation="Exact us-gaap total assets concept with USD unit",
    ),
    MappingRule(
        rule_id="RULE_LIAB_US_GAAP_001",
        source="us-gaap:Liabilities",
        source_concept="us-gaap:Liabilities",
        allowed_units=("USD",),
        canonical_metric="liabilities_total",
        confidence=0.995,
        explanation="Exact us-gaap total liabilities concept with USD unit",
    ),
    MappingRule(
        rule_id="RULE_CASH_US_GAAP_001",
        source="us-gaap:CashAndCashEquivalentsAtCarryingValue",
        source_concept="us-gaap:CashAndCashEquivalentsAtCarryingValue",
        allowed_units=("USD",),
        canonical_metric="cash_and_equivalents",
        confidence=0.995,
        explanation="Exact us-gaap cash and cash equivalents concept with USD unit",
    ),
)


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _find_rule(*, source_concept: str, unit: str) -> MappingRule | None:
    for rule in MAPPING_RULES:
        if source_concept == rule.source_concept and unit in rule.allowed_units:
            return rule
    return None


def map_raw_fact(raw_fact: dict[str, Any]) -> MappedFact | None:
    """
    Deterministic raw-to-canonical mapping with audit trail.

    Rollback rule: if we cannot explain *why* a mapping happened via a specific
    deterministic rule, return None instead of producing an opaque mapping.
    """

    source_concept = _normalize_text(raw_fact.get("source_concept"))
    unit = _normalize_text(raw_fact.get("unit"))
    raw_fact_id = _normalize_text(raw_fact.get("raw_fact_id"))
    value_text = _normalize_text(raw_fact.get("value_text"))

    if not source_concept or not unit or not raw_fact_id:
        return None

    matched_rule = _find_rule(source_concept=source_concept, unit=unit)
    if matched_rule is None:
        return None

    return MappedFact(
        raw_fact_id=raw_fact_id,
        source_concept=source_concept,
        unit=unit,
        value_text=value_text,
        period_start=raw_fact.get("period_start"),
        period_end=raw_fact.get("period_end"),
        canonical_metric=matched_rule.canonical_metric,
        rule_id=matched_rule.rule_id,
        rule_source=f"{RULE_SOURCE}#{matched_rule.rule_id}",
        confidence=matched_rule.confidence,
        audit={
            "mapping_reason": matched_rule.explanation,
            "matched_on": {
                "source_concept": source_concept,
                "unit": unit,
            },
            "input_snapshot": {
                "raw_fact_id": raw_fact_id,
                "source_concept": source_concept,
                "unit": unit,
                "value_text": value_text,
                "period_start": raw_fact.get("period_start"),
                "period_end": raw_fact.get("period_end"),
            },
        },
    )


def map_raw_facts(raw_facts: list[dict[str, Any]]) -> list[MappedFact]:
    mapped: list[MappedFact] = []
    for raw_fact in raw_facts:
        mapped_fact = map_raw_fact(raw_fact)
        if mapped_fact is not None:
            mapped.append(mapped_fact)
    return mapped
