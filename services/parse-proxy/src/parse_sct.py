from __future__ import annotations

from dataclasses import dataclass
import re

PARSER_VERSION = "parse-proxy.parse_sct.v1"

_REQUIRED_FIELDS = (
    "salary",
    "bonus",
    "stock_awards",
    "option_awards",
    "non_equity",
    "pension_change",
    "other_comp",
    "total",
)

_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "salary": ("salary",),
    "bonus": ("bonus",),
    "stock_awards": ("stock awards",),
    "option_awards": ("option awards",),
    "non_equity": (
        "non-equity",
        "non equity",
        "non-equity incentive",
        "nonequity incentive",
    ),
    "pension_change": (
        "change in pension value",
        "pension value",
        "pension change",
    ),
    "other_comp": ("all other compensation", "other comp", "other compensation"),
    "total": ("total",),
}


@dataclass(frozen=True)
class SctRow:
    raw_row_text: str
    raw_row_line: int
    salary: int | None
    bonus: int | None
    stock_awards: int | None
    option_awards: int | None
    non_equity: int | None
    pension_change: int | None
    other_comp: int | None
    total: int | None


@dataclass(frozen=True)
class ParsedSct:
    source_url: str
    accession: str
    parser_version: str
    header_line: int
    rows: tuple[SctRow, ...]


def parse_summary_comp_table(*, table_text: str, start_line: int, source_url: str, accession: str) -> ParsedSct:
    """Parse a Summary Compensation Table text block into normalized numeric fields.

    The parser is intentionally conservative:
    - It only emits values explicitly present in each row.
    - It never guesses/fills missing cells.
    - It preserves raw row text + raw row line for traceability.
    """
    lines = [line for line in table_text.splitlines() if line.strip()]
    if not lines:
        return ParsedSct(
            source_url=source_url,
            accession=accession,
            parser_version=PARSER_VERSION,
            header_line=start_line,
            rows=(),
        )

    header_idx = _find_header_index(lines)
    header_line = lines[header_idx]
    canonical_by_column = _canonical_columns(header_line)

    parsed_rows: list[SctRow] = []
    for idx in range(header_idx + 1, len(lines)):
        line = lines[idx]
        columns = _split_columns(line)
        if len(columns) <= 1:
            continue

        parsed_rows.append(
            SctRow(
                raw_row_text=line,
                raw_row_line=start_line + idx,
                salary=_value_for(columns, canonical_by_column, "salary"),
                bonus=_value_for(columns, canonical_by_column, "bonus"),
                stock_awards=_value_for(columns, canonical_by_column, "stock_awards"),
                option_awards=_value_for(columns, canonical_by_column, "option_awards"),
                non_equity=_value_for(columns, canonical_by_column, "non_equity"),
                pension_change=_value_for(columns, canonical_by_column, "pension_change"),
                other_comp=_value_for(columns, canonical_by_column, "other_comp"),
                total=_value_for(columns, canonical_by_column, "total"),
            )
        )

    return ParsedSct(
        source_url=source_url,
        accession=accession,
        parser_version=PARSER_VERSION,
        header_line=start_line + header_idx,
        rows=tuple(parsed_rows),
    )


def _find_header_index(lines: list[str]) -> int:
    for idx, line in enumerate(lines):
        lowered = line.lower()
        matched = sum(any(alias in lowered for alias in aliases) for aliases in _COLUMN_ALIASES.values())
        if matched >= 4:
            return idx
    return 0


def _canonical_columns(header_line: str) -> dict[int, str]:
    columns = _split_columns(header_line)
    out: dict[int, str] = {}
    for idx, col in enumerate(columns):
        lowered = col.lower().strip()
        for canonical in _REQUIRED_FIELDS:
            aliases = _COLUMN_ALIASES[canonical]
            if any(alias in lowered for alias in aliases):
                out[idx] = canonical
                break
    return out


def _split_columns(line: str) -> list[str]:
    if "|" in line:
        return [c.strip() for c in line.split("|") if c.strip()]
    return [c.strip() for c in re.split(r"\s{2,}", line.strip()) if c.strip()]


def _value_for(columns: list[str], canonical_by_column: dict[int, str], field: str) -> int | None:
    for idx, canonical in canonical_by_column.items():
        if canonical != field or idx >= len(columns):
            continue
        return _parse_money_int(columns[idx])
    return None


def _parse_money_int(text: str) -> int | None:
    cleaned = text.strip().replace("$", "").replace(",", "")
    if cleaned in {"", "-", "--", "N/A", "n/a"}:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    if not match:
        return None

    number = match.group(0)
    if "." in number:
        return int(round(float(number)))
    return int(number)
