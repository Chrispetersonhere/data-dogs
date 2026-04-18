from __future__ import annotations

from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from parse_sct import parse_summary_comp_table


def test_parse_summary_comp_table_extracts_required_outputs() -> None:
    table_text = """Summary Compensation Table
Name and Principal Position  Salary  Bonus  Stock Awards  Option Awards  Non-Equity Incentive Plan Compensation  Change in Pension Value  All Other Compensation  Total
Chief Executive Officer      1,000,000  250,000  2,500,000  1,100,000  300,000  0  25,000  5,175,000
Chief Financial Officer      650,000  100,000  900,000  450,000  150,000  12,500  18,000  2,280,500
"""

    parsed = parse_summary_comp_table(
        table_text=table_text,
        start_line=210,
        source_url="https://www.sec.gov/Archives/edgar/data/0000000/def14a.htm",
        accession="0000000-26-000777",
    )

    assert parsed.parser_version == "parse-proxy.parse_sct.v1"
    assert parsed.header_line == 211
    assert len(parsed.rows) == 2

    ceo = parsed.rows[0]
    assert ceo.salary == 1_000_000
    assert ceo.bonus == 250_000
    assert ceo.stock_awards == 2_500_000
    assert ceo.option_awards == 1_100_000
    assert ceo.non_equity == 300_000
    assert ceo.pension_change == 0
    assert ceo.other_comp == 25_000
    assert ceo.total == 5_175_000


def test_parse_summary_comp_table_preserves_raw_row_references() -> None:
    table_text = """Name  Salary  Bonus  Stock Awards  Option Awards  Non-Equity Incentive Plan Compensation  Change in Pension Value  All Other Compensation  Total
CEO   100  10  200  50  25  0  5  390
"""

    parsed = parse_summary_comp_table(
        table_text=table_text,
        start_line=100,
        source_url="https://example.test/proxy",
        accession="acc-1",
    )

    row = parsed.rows[0]
    assert row.raw_row_line == 101
    assert row.raw_row_text == "CEO   100  10  200  50  25  0  5  390"


def test_parse_summary_comp_table_does_not_guess_missing_values() -> None:
    table_text = """Name  Salary  Bonus  Stock Awards  Option Awards  Non-Equity Incentive Plan Compensation  Change in Pension Value  All Other Compensation  Total
CEO   100  --  200  --  --  0  --  --
"""

    parsed = parse_summary_comp_table(
        table_text=table_text,
        start_line=10,
        source_url="https://example.test/proxy",
        accession="acc-2",
    )

    row = parsed.rows[0]
    assert row.salary == 100
    assert row.stock_awards == 200
    assert row.pension_change == 0

    assert row.bonus is None
    assert row.option_awards is None
    assert row.non_equity is None
    assert row.other_comp is None
    assert row.total is None
