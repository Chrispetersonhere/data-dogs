from __future__ import annotations

from dataclasses import dataclass
from typing import Any

FLOW_METRICS: dict[str, tuple[str, ...]] = {
    "revenue": ("revenue", "revenues", "sales"),
    "net_income": ("net_income", "netincome", "profit_loss"),
    "cash_from_operations": (
        "net_cash_from_operations",
        "operating_cash_flow",
    ),
    "capital_expenditures": (
        "capital_expenditures",
        "payments_to_acquire_property_plant_and_equipment",
    ),
}

STOCK_METRICS: dict[str, tuple[str, ...]] = {
    "assets": ("assets", "total_assets"),
    "liabilities": ("liabilities", "total_liabilities"),
    "equity": ("stockholders_equity", "equity"),
}


@dataclass(frozen=True)
class QuarterlyPoint:
    fiscal_year: int
    fiscal_quarter: int
    amount: float


@dataclass(frozen=True)
class QuarterlyMetricSeries:
    metric_key: str
    points: list[QuarterlyPoint]


@dataclass(frozen=True)
class TtmOutput:
    metric_key: str
    as_of_fiscal_year: int
    as_of_fiscal_quarter: int
    amount: float
    formula: str
    component_quarters: list[tuple[int, int]]


@dataclass(frozen=True)
class QuarterlyBuildResult:
    quarterly_flow_series: list[QuarterlyMetricSeries]
    quarterly_stock_series: list[QuarterlyMetricSeries]
    ttm_outputs: list[TtmOutput]


def build_quarterly_and_ttm(*, normalized_rows: list[dict[str, Any]]) -> QuarterlyBuildResult:
    """Build quarterly series + explicit TTM formulas with strict period isolation.

    Rules:
    - Only rows marked `period_type == "quarterly"` are eligible.
    - TTM is computed only for flow metrics.
    - TTM formula is explicit and returned as text.
    - No mixed-period contamination: annual rows are ignored.
    """

    quarterly_only = [row for row in normalized_rows if str(row.get("period_type", "")).strip().lower() == "quarterly"]

    flow_series = _build_series(rows=quarterly_only, metric_aliases=FLOW_METRICS)
    stock_series = _build_series(rows=quarterly_only, metric_aliases=STOCK_METRICS)
    ttm_outputs = _compute_ttm(flow_series=flow_series)

    return QuarterlyBuildResult(
        quarterly_flow_series=flow_series,
        quarterly_stock_series=stock_series,
        ttm_outputs=ttm_outputs,
    )


def _build_series(
    *,
    rows: list[dict[str, Any]],
    metric_aliases: dict[str, tuple[str, ...]],
) -> list[QuarterlyMetricSeries]:
    alias_to_metric: dict[str, str] = {}
    for metric_key, aliases in metric_aliases.items():
        for alias in aliases:
            alias_to_metric[alias] = metric_key

    grouped: dict[str, dict[tuple[int, int], QuarterlyPoint]] = {}
    for row in rows:
        concept = str(row.get("normalized_concept", "")).strip().lower()
        metric_key = alias_to_metric.get(concept)
        if metric_key is None:
            continue

        fiscal_year = row.get("fiscal_year")
        fiscal_quarter = row.get("fiscal_quarter")
        amount = _as_number(row.get("amount"))
        if not isinstance(fiscal_year, int) or not isinstance(fiscal_quarter, int) or amount is None:
            continue
        if fiscal_quarter not in (1, 2, 3, 4):
            continue

        grouped.setdefault(metric_key, {})[(fiscal_year, fiscal_quarter)] = QuarterlyPoint(
            fiscal_year=fiscal_year,
            fiscal_quarter=fiscal_quarter,
            amount=amount,
        )

    result: list[QuarterlyMetricSeries] = []
    for metric_key, points_by_quarter in grouped.items():
        sorted_points = sorted(
            points_by_quarter.values(),
            key=lambda point: (point.fiscal_year, point.fiscal_quarter),
            reverse=True,
        )
        result.append(QuarterlyMetricSeries(metric_key=metric_key, points=sorted_points))

    result.sort(key=lambda item: item.metric_key)
    return result


def _compute_ttm(*, flow_series: list[QuarterlyMetricSeries]) -> list[TtmOutput]:
    outputs: list[TtmOutput] = []

    for series in flow_series:
        points = series.points
        if len(points) < 4:
            continue

        latest = points[0]
        by_period = {(point.fiscal_year, point.fiscal_quarter): point for point in points}

        chain = _rolling_4q_chain(latest.fiscal_year, latest.fiscal_quarter)
        components: list[QuarterlyPoint] = []
        for period in chain:
            point = by_period.get(period)
            if point is None:
                components = []
                break
            components.append(point)

        if len(components) != 4:
            continue

        amount = sum(point.amount for point in components)
        formatted_chain = " + ".join([f"FY{year}Q{quarter}" for year, quarter in chain])
        formula = f"TTM {series.metric_key} = {formatted_chain}"

        outputs.append(
            TtmOutput(
                metric_key=series.metric_key,
                as_of_fiscal_year=latest.fiscal_year,
                as_of_fiscal_quarter=latest.fiscal_quarter,
                amount=amount,
                formula=formula,
                component_quarters=chain,
            )
        )

    outputs.sort(key=lambda item: item.metric_key)
    return outputs


def _rolling_4q_chain(fiscal_year: int, fiscal_quarter: int) -> list[tuple[int, int]]:
    chain: list[tuple[int, int]] = []
    year = fiscal_year
    quarter = fiscal_quarter

    for _ in range(4):
        chain.append((year, quarter))
        quarter -= 1
        if quarter == 0:
            quarter = 4
            year -= 1

    return chain


def _as_number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            return float(stripped)
        except ValueError:
            return None
    return None
