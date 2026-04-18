from __future__ import annotations

from dataclasses import dataclass
import re

PARSER_VERSION = "parse-proxy.parse_grants.v1"

_COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "executive": (
        "name",
        "executive",
        "officer",
        "principal position",
    ),
    "period": (
        "year",
        "fiscal year",
        "period",
        "performance period",
    ),
    "award": (
        "stock award",
        "option award",
        "award",
        "grant date fair value",
        "grant fair value",
    ),
}


@dataclass(frozen=True)
class GrantRow:
    raw_row_text: str
    raw_row_line: int
    executive: str | None
    executive_candidates: tuple[str, ...]
    period: str | None
    period_candidates: tuple[str, ...]
    award: int | None


@dataclass(frozen=True)
class ParsedGrants:
    source_url: str
    accession: str
    parser_version: str
    header_line: int
    rows: tuple[GrantRow, ...]


def parse_grants_table(*, table_text: str, start_line: int, source_url: str, accession: str) -> ParsedGrants:
    """Parse grants table text into award rows linked to executive + period.

    Parsing is conservative and audit-safe:
    - Values are extracted only when present in the source row.
    - Ambiguity is explicit via *_candidates fields rather than guessed.
    - Raw row line/text are preserved for traceability.
    """
    lines = [line for line in table_text.splitlines() if line.strip()]
    if not lines:
        return ParsedGrants(
            source_url=source_url,
            accession=accession,
            parser_version=PARSER_VERSION,
            header_line=start_line,
            rows=(),
        )

    header_idx = _find_header_index(lines)
    header_line = lines[header_idx]
    canonical_by_column = _canonical_columns(header_line)

    parsed_rows: list[GrantRow] = []
    for idx in range(header_idx + 1, len(lines)):
        line = lines[idx]
        columns = _split_columns(line)
        if len(columns) <= 1:
            continue

        executive_candidates = _text_candidates(columns, canonical_by_column, "executive")
        period_candidates = _text_candidates(columns, canonical_by_column, "period")
        award_candidates = _award_candidates(columns, canonical_by_column)

        parsed_rows.append(
            GrantRow(
                raw_row_text=line,
                raw_row_line=start_line + idx,
                executive=executive_candidates[0] if len(executive_candidates) == 1 else None,
                executive_candidates=executive_candidates,
                period=period_candidates[0] if len(period_candidates) == 1 else None,
                period_candidates=period_candidates,
                award=award_candidates[0] if len(award_candidates) == 1 else None,
            )
        )

    return ParsedGrants(
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
        if matched >= 2:
            return idx
    return 0


def _canonical_columns(header_line: str) -> dict[str, tuple[int, ...]]:
    columns = _split_columns(header_line)
    out: dict[str, list[int]] = {"executive": [], "period": [], "award": []}
    for idx, col in enumerate(columns):
        lowered = col.lower().strip()
        for canonical, aliases in _COLUMN_ALIASES.items():
            if any(alias in lowered for alias in aliases):
                out[canonical].append(idx)
                break
    return {key: tuple(value) for key, value in out.items()}


def _split_columns(line: str) -> list[str]:
    if "|" in line:
        return [c.strip() for c in line.split("|") if c.strip()]
    return [c.strip() for c in re.split(r"\s{2,}", line.strip()) if c.strip()]


def _text_candidates(columns: list[str], canonical_by_column: dict[str, tuple[int, ...]], field: str) -> tuple[str, ...]:
    values: list[str] = []
    for idx in canonical_by_column.get(field, ()):  # explicit when 0 or many matches
        if idx >= len(columns):
            continue
        value = columns[idx].strip()
        if value and value not in {"-", "--", "N/A", "n/a"}:
            values.append(value)
    return tuple(values)


def _award_candidates(columns: list[str], canonical_by_column: dict[str, tuple[int, ...]]) -> tuple[int, ...]:
    values: list[int] = []
    for idx in canonical_by_column.get("award", ()):  # explicit when 0 or many matches
        if idx >= len(columns):
            continue
        parsed = _parse_money_int(columns[idx])
        if parsed is not None:
            values.append(parsed)
    return tuple(values)


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
