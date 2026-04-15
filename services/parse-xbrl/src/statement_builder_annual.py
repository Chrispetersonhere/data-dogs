from __future__ import annotations

from dataclasses import dataclass
from typing import Any


ANNUAL_STATEMENT_METRICS: dict[str, list[tuple[str, tuple[str, ...]]]] = {
    "income_statement": [
        ("Revenue", ("revenue", "revenues", "sales")),
        ("Gross Profit", ("gross_profit", "grossprofit")),
        ("Operating Income", ("operating_income", "operatingincome")),
        ("Net Income", ("net_income", "netincome", "profit_loss")),
    ],
    "balance_sheet": [
        ("Cash & Equivalents", ("cash_and_cash_equivalents", "cash")),
        ("Total Assets", ("assets", "total_assets")),
        ("Total Liabilities", ("liabilities", "total_liabilities")),
        ("Shareholders' Equity", ("stockholders_equity", "equity")),
    ],
    "cash_flow": [
        ("Cash From Operations", ("net_cash_from_operations", "operating_cash_flow")),
        ("Cash From Investing", ("net_cash_from_investing", "investing_cash_flow")),
        ("Cash From Financing", ("net_cash_from_financing", "financing_cash_flow")),
        (
            "Capital Expenditures",
            ("capital_expenditures", "payments_to_acquire_property_plant_and_equipment"),
        ),
    ],
}


@dataclass(frozen=True)
class AnnualValue:
    fiscal_year: int
    amount: float
    unit: str
    source_concept: str


@dataclass(frozen=True)
class AnnualStatementRow:
    label: str
    values: dict[int, AnnualValue]


@dataclass(frozen=True)
class AnnualStatements:
    fiscal_years: list[int]
    income_statement: list[AnnualStatementRow]
    balance_sheet: list[AnnualStatementRow]
    cash_flow: list[AnnualStatementRow]


def build_annual_statements(*, normalized_rows: list[dict[str, Any]], year_count: int = 3) -> AnnualStatements:
    """Build focused annual statements from normalized annual fact rows.

    Expected row shape (minimal):
      - statement_code: income_statement | balance_sheet | cash_flow
      - normalized_concept: canonical concept key
      - fiscal_year: int
      - amount: numeric
      - unit: e.g. USD
      - source_concept: raw source concept name
    """

    annual_rows = [
        row
        for row in normalized_rows
        if row.get("statement_code") in ANNUAL_STATEMENT_METRICS
        and isinstance(row.get("fiscal_year"), int)
        and as_number(row.get("amount")) is not None
        and _as_number(row.get("amount")) is not None
    ]

    fiscal_years = sorted({int(row["fiscal_year"]) for row in annual_rows}, reverse=True)[:year_count]

    return AnnualStatements(
        fiscal_years=fiscal_years,
        income_statement=_build_statement_rows(
            annual_rows=annual_rows,
            statement_code="income_statement",
            fiscal_years=fiscal_years,
        ),
        balance_sheet=_build_statement_rows(
            annual_rows=annual_rows,
            statement_code="balance_sheet",
            fiscal_years=fiscal_years,
        ),
        cash_flow=_build_statement_rows(
            annual_rows=annual_rows,
            statement_code="cash_flow",
            fiscal_years=fiscal_years,
        ),
    )


def _build_statement_rows(
    *,
    annual_rows: list[dict[str, Any]],
    statement_code: str,
    fiscal_years: list[int],
) -> list[AnnualStatementRow]:
    metric_spec = ANNUAL_STATEMENT_METRICS[statement_code]
    rows_by_metric_year: dict[tuple[str, int], AnnualValue] = {}

    for row in annual_rows:
        if row.get("statement_code") != statement_code:
            continue

        concept_key = str(row.get("normalized_concept", "")).strip().lower()
        fiscal_year = int(row["fiscal_year"])
        if fiscal_year not in fiscal_years:
            continue

        amount = as_number(row.get("amount"))
        amount = _as_number(row.get("amount"))
        if amount is None:
            continue

        unit = str(row.get("unit") or "USD")
        source_concept = str(row.get("source_concept") or row.get("normalized_concept") or "unknown")

        for label, aliases in metric_spec:
            if concept_key in aliases:
                rows_by_metric_year[(label, fiscal_year)] = AnnualValue(
                    fiscal_year=fiscal_year,
                    amount=amount,
                    unit=unit,
                    source_concept=source_concept,
                )

    statement_rows: list[AnnualStatementRow] = []
    for label, _aliases in metric_spec:
        values = {
            year: rows_by_metric_year[(label, year)]
            for year in fiscal_years
            if (label, year) in rows_by_metric_year
        }
        statement_rows.append(AnnualStatementRow(label=label, values=values))

    return statement_rows


def as_number(value: Any) -> float | None:
    """Shared numeric parser used across statement builders."""
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


def _as_number(value: Any) -> float | None:
    """Backward-compatible alias retained for legacy call sites."""
    return as_number(value)
