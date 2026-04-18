from __future__ import annotations

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from parse_grants import parse_grants_table


def test_parse_grants_extracts_award_and_links_to_executive_and_period() -> None:
    table_text = """Grants of Plan-Based Awards
Name  Fiscal Year  Grant Date Fair Value
Chief Executive Officer  2025  $2,500,000
Chief Financial Officer  2025  1,250,000
"""

    parsed = parse_grants_table(
        table_text=table_text,
        start_line=500,
        source_url="https://www.sec.gov/Archives/edgar/data/0000000/def14a.htm",
        accession="0000000-26-000888",
    )

    assert parsed.parser_version == "parse-proxy.parse_grants.v1"
    assert parsed.header_line == 501
    assert len(parsed.rows) == 2

    ceo = parsed.rows[0]
    assert ceo.raw_row_line == 502
    assert ceo.executive == "Chief Executive Officer"
    assert ceo.executive_candidates == ("Chief Executive Officer",)
    assert ceo.period == "2025"
    assert ceo.period_candidates == ("2025",)
    assert ceo.award == 2_500_000
    assert ceo.award_candidates == (2_500_000,)


def test_parse_grants_keeps_ambiguity_explicit() -> None:
    table_text = """Name  Officer Name  Fiscal Year  Performance Period  Grant Date Fair Value  Stock Award
Jane Doe  Jane A. Doe  2025  2024-2025  300000  500000
"""

    parsed = parse_grants_table(
        table_text=table_text,
        start_line=100,
        source_url="https://example.test/proxy",
        accession="acc-ambiguous",
    )

    row = parsed.rows[0]

    assert row.executive is None
    assert row.executive_candidates == ("Jane Doe", "Jane A. Doe")

    assert row.period is None
    assert row.period_candidates == ("2025", "2024-2025")

    assert row.award is None
    assert row.award_candidates == (300_000, 500_000)


def test_parse_grants_does_not_guess_missing_awards() -> None:
    table_text = """Name  Fiscal Year  Grant Date Fair Value
Chief Accounting Officer  2025  --
"""

    parsed = parse_grants_table(
        table_text=table_text,
        start_line=12,
        source_url="https://example.test/proxy",
        accession="acc-missing-award",
    )

    row = parsed.rows[0]
    assert row.executive == "Chief Accounting Officer"
    assert row.period == "2025"
    assert row.award is None
    assert row.award_candidates == ()


def test_parse_grants_preserves_blank_pipe_columns_and_source_line_numbers() -> None:
    table_text = """Grants of Plan-Based Awards

Name|Fiscal Year|Grant Date Fair Value|Stock Award

Chief Accounting Officer|2025||400000
"""

    parsed = parse_grants_table(
        table_text=table_text,
        start_line=30,
        source_url="https://example.test/grants-pipes",
        accession="acc-grants-pipes",
    )

    assert parsed.header_line == 32
    row = parsed.rows[0]
    assert row.raw_row_line == 34
    assert row.executive == "Chief Accounting Officer"
    assert row.period == "2025"
    assert row.award == 400_000
    assert row.award_candidates == (400_000,)
