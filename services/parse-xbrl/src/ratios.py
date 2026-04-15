from __future__ import annotations

from dataclasses import dataclass
from typing import Any

FORMULAS: dict[str, dict[str, str]] = {
    "margins": {
        "gross_margin": "gross_profit / revenue",
        "operating_margin": "operating_income / revenue",
        "net_margin": "net_income / revenue",
        "fcf_margin": "(cfo - capex) / revenue",
    },
    "leverage": {
        "liabilities_to_equity": "liabilities / equity",
        "liabilities_to_assets": "liabilities / assets",
    },
    "liquidity": {
        "current_ratio": "current_assets / current_liabilities",
        "quick_ratio": "(current_assets - inventory) / current_liabilities",
    },
    "efficiency": {
        "asset_turnover": "revenue / assets",
        "receivables_turnover": "revenue / receivables",
    },
    "valuation_support": {
        "free_cash_flow": "cfo - capex",
        "eps": "net_income / shares",
        "ev_to_revenue": "enterprise_value / revenue",
        "price_to_earnings": "market_cap / net_income",
        "fcf_yield": "(cfo - capex) / market_cap",
    },
}


@dataclass(frozen=True)
class RatioInputs:
    revenue: float
    gross_profit: float
    operating_income: float
    net_income: float
    assets: float
    liabilities: float
    equity: float
    cfo: float
    capex: float
    current_assets: float
    current_liabilities: float
    inventory: float | None = None
    receivables: float | None = None
    enterprise_value: float | None = None
    market_cap: float | None = None
    shares: float | None = None


def compute_ratio_groups(*, inputs: RatioInputs) -> dict[str, dict[str, float | None]]:
    """Compute explicit, testable ratio groups for deterministic outputs."""

    fcf = inputs.cfo - inputs.capex

    margins = {
        "gross_margin": _safe_divide(inputs.gross_profit, inputs.revenue),
        "operating_margin": _safe_divide(inputs.operating_income, inputs.revenue),
        "net_margin": _safe_divide(inputs.net_income, inputs.revenue),
        "fcf_margin": _safe_divide(fcf, inputs.revenue),
    }

    leverage = {
        "liabilities_to_equity": _safe_divide(inputs.liabilities, inputs.equity),
        "liabilities_to_assets": _safe_divide(inputs.liabilities, inputs.assets),
    }

    inventory = inputs.inventory if inputs.inventory is not None else 0.0
    liquidity = {
        "current_ratio": _safe_divide(inputs.current_assets, inputs.current_liabilities),
        "quick_ratio": _safe_divide(inputs.current_assets - inventory, inputs.current_liabilities),
    }

    efficiency = {
        "asset_turnover": _safe_divide(inputs.revenue, inputs.assets),
        "receivables_turnover": _safe_divide(inputs.revenue, inputs.receivables),
    }

    valuation_support = {
        "free_cash_flow": fcf,
        "eps": _safe_divide(inputs.net_income, inputs.shares),
        "ev_to_revenue": _safe_divide(inputs.enterprise_value, inputs.revenue),
        "price_to_earnings": _safe_divide(inputs.market_cap, inputs.net_income),
        "fcf_yield": _safe_divide(fcf, inputs.market_cap),
    }

    return {
        "margins": margins,
        "leverage": leverage,
        "liquidity": liquidity,
        "efficiency": efficiency,
        "valuation_support": valuation_support,
    }


def formula_catalog() -> dict[str, dict[str, str]]:
    return FORMULAS


def _safe_divide(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator


def ratio_snapshot(*, inputs: RatioInputs) -> dict[str, Any]:
    return {
        "inputs": inputs,
        "formulas": formula_catalog(),
        "ratios": compute_ratio_groups(inputs=inputs),
    }
