from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.statement_builder_quarterly import build_quarterly_and_ttm


def test_ttm_uses_explicit_rolling_4q_formula() -> None:
    rows = [
        {
            "period_type": "quarterly",
            "normalized_concept": "revenue",
            "fiscal_year": 2025,
            "fiscal_quarter": 1,
            "amount": 120,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "revenue",
            "fiscal_year": 2024,
            "fiscal_quarter": 4,
            "amount": 110,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "revenue",
            "fiscal_year": 2024,
            "fiscal_quarter": 3,
            "amount": 105,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "revenue",
            "fiscal_year": 2024,
            "fiscal_quarter": 2,
            "amount": 100,
        },
    ]

    result = build_quarterly_and_ttm(normalized_rows=rows)
    revenue_ttm = next((output for output in result.ttm_outputs if output.metric_key == "revenue"), None)

    assert revenue_ttm is not None
    assert revenue_ttm.amount == 435
    assert revenue_ttm.component_quarters == [(2025, 1), (2024, 4), (2024, 3), (2024, 2)]
    assert revenue_ttm.formula == "TTM revenue = FY2025Q1 + FY2024Q4 + FY2024Q3 + FY2024Q2"


def test_ttm_rejects_mixed_period_contamination() -> None:
    rows = [
        {
            "period_type": "quarterly",
            "normalized_concept": "net_income",
            "fiscal_year": 2025,
            "fiscal_quarter": 1,
            "amount": 20,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "net_income",
            "fiscal_year": 2024,
            "fiscal_quarter": 4,
            "amount": 18,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "net_income",
            "fiscal_year": 2024,
            "fiscal_quarter": 3,
            "amount": 17,
        },
        {
            "period_type": "annual",  # should never be used to fill missing quarter
            "normalized_concept": "net_income",
            "fiscal_year": 2024,
            "fiscal_quarter": 2,
            "amount": 16,
        },
    ]

    result = build_quarterly_and_ttm(normalized_rows=rows)
    net_income_ttm = next((output for output in result.ttm_outputs if output.metric_key == "net_income"), None)

    assert net_income_ttm is None


def test_stock_metrics_render_quarterly_but_not_ttm() -> None:
    rows = [
        {
            "period_type": "quarterly",
            "normalized_concept": "assets",
            "fiscal_year": 2025,
            "fiscal_quarter": 1,
            "amount": 1000,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "assets",
            "fiscal_year": 2024,
            "fiscal_quarter": 4,
            "amount": 990,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "liabilities",
            "fiscal_year": 2025,
            "fiscal_quarter": 1,
            "amount": 640,
        },
        {
            "period_type": "quarterly",
            "normalized_concept": "equity",
            "fiscal_year": 2025,
            "fiscal_quarter": 1,
            "amount": 360,
        },
    ]

    result = build_quarterly_and_ttm(normalized_rows=rows)

    stock_metric_keys = {series.metric_key for series in result.quarterly_stock_series}
    ttm_metric_keys = {output.metric_key for output in result.ttm_outputs}

    assert stock_metric_keys == {"assets", "equity", "liabilities"}
    assert "assets" not in ttm_metric_keys
    assert "equity" not in ttm_metric_keys
    assert "liabilities" not in ttm_metric_keys
