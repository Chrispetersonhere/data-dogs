from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from src.ratios import RatioInputs, compute_ratio_groups, formula_catalog


def test_ratio_engine_known_input_output_values() -> None:
    inputs = RatioInputs(
        revenue=1000,
        gross_profit=400,
        operating_income=200,
        net_income=120,
        assets=2000,
        liabilities=1200,
        equity=800,
        cfo=180,
        capex=60,
        current_assets=500,
        current_liabilities=250,
        inventory=100,
        receivables=125,
        enterprise_value=3000,
        market_cap=2400,
        shares=100,
    )

    ratios = compute_ratio_groups(inputs=inputs)

    assert math.isclose(ratios["margins"]["gross_margin"], 0.4)
    assert math.isclose(ratios["margins"]["operating_margin"], 0.2)
    assert math.isclose(ratios["margins"]["net_margin"], 0.12)
    assert math.isclose(ratios["margins"]["fcf_margin"], 0.12)

    assert math.isclose(ratios["leverage"]["liabilities_to_equity"], 1.5)
    assert math.isclose(ratios["leverage"]["liabilities_to_assets"], 0.6)

    assert math.isclose(ratios["liquidity"]["current_ratio"], 2.0)
    assert math.isclose(ratios["liquidity"]["quick_ratio"], 1.6)

    assert math.isclose(ratios["efficiency"]["asset_turnover"], 0.5)
    assert math.isclose(ratios["efficiency"]["receivables_turnover"], 8.0)

    assert math.isclose(ratios["valuation_support"]["free_cash_flow"], 120.0)
    assert math.isclose(ratios["valuation_support"]["eps"], 1.2)
    assert math.isclose(ratios["valuation_support"]["ev_to_revenue"], 3.0)
    assert math.isclose(ratios["valuation_support"]["price_to_earnings"], 20.0)
    assert math.isclose(ratios["valuation_support"]["fcf_yield"], 0.05)


def test_ratio_engine_handles_missing_or_zero_denominators() -> None:
    inputs = RatioInputs(
        revenue=0,
        gross_profit=10,
        operating_income=10,
        net_income=0,
        assets=100,
        liabilities=40,
        equity=0,
        cfo=30,
        capex=10,
        current_assets=50,
        current_liabilities=0,
        receivables=None,
        enterprise_value=None,
        market_cap=0,
        shares=0,
    )

    ratios = compute_ratio_groups(inputs=inputs)

    assert ratios["margins"]["gross_margin"] is None
    assert ratios["margins"]["operating_margin"] is None
    assert ratios["margins"]["net_margin"] is None
    assert ratios["leverage"]["liabilities_to_equity"] is None
    assert ratios["liquidity"]["current_ratio"] is None
    assert ratios["efficiency"]["receivables_turnover"] is None
    assert ratios["valuation_support"]["eps"] is None
    assert ratios["valuation_support"]["ev_to_revenue"] is None
    assert ratios["valuation_support"]["fcf_yield"] is None


def test_formula_catalog_is_explicit_and_complete() -> None:
    catalog = formula_catalog()

    assert set(catalog.keys()) == {
        "margins",
        "leverage",
        "liquidity",
        "efficiency",
        "valuation_support",
    }
    assert catalog["margins"]["gross_margin"] == "gross_profit / revenue"
    assert catalog["margins"]["fcf_margin"] == "(cfo - capex) / revenue"
    assert catalog["leverage"]["liabilities_to_equity"] == "liabilities / equity"
    assert catalog["liquidity"]["quick_ratio"] == "(current_assets - inventory) / current_liabilities"
    assert catalog["efficiency"]["asset_turnover"] == "revenue / assets"
    assert catalog["valuation_support"]["free_cash_flow"] == "cfo - capex"
    assert catalog["valuation_support"]["price_to_earnings"] == "market_cap / net_income"
