from __future__ import annotations

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from parse_governance import parse_governance_facts


def test_parse_governance_extracts_required_facts_with_source_links() -> None:
    text = """Our board leadership structure is as follows.
Jane Doe serves as both Chair and Chief Executive Officer.
The Compensation Committee consists of Alice Smith, Bob Jones and Carol Lee.
At our 2025 annual meeting, the say-on-pay proposal was approved with 94.2% support.
"""

    parsed = parse_governance_facts(
        text=text,
        start_line=700,
        source_url="https://www.sec.gov/Archives/edgar/data/0000000/def14a.htm",
        accession="0000000-26-000999",
    )

    assert parsed.parser_version == "parse-proxy.parse_governance.v1"

    structure = parsed.ceo_chair_structure
    assert structure is not None
    assert structure.structure == "combined"
    assert structure.ceo_name == "Jane Doe"
    assert structure.chair_name == "Jane Doe"
    assert structure.source.source_url == parsed.source_url
    assert structure.source.raw_line == 701
    assert "both Chair and Chief Executive Officer" in structure.source.raw_text

    member_names = {member.member_name for member in parsed.compensation_committee_members}
    assert member_names == {"Alice Smith", "Bob Jones", "Carol Lee"}
    for member in parsed.compensation_committee_members:
        assert member.source.source_url == parsed.source_url
        assert member.source.raw_line == 702
        assert "Compensation Committee" in member.source.raw_text

    say_on_pay = parsed.say_on_pay_result
    assert say_on_pay is not None
    assert say_on_pay.outcome == "approved"
    assert say_on_pay.support_percent == 94.2
    assert say_on_pay.source.source_url == parsed.source_url
    assert say_on_pay.source.raw_line == 703
    assert "say-on-pay" in say_on_pay.source.raw_text


def test_parse_governance_extracts_separate_ceo_chair_when_roles_are_split() -> None:
    text = """Board leadership
John Carter is our Chief Executive Officer.
Maria Diaz is Chair of the Board.
"""

    parsed = parse_governance_facts(
        text=text,
        start_line=10,
        source_url="https://example.test/proxy",
        accession="acc-split",
    )

    structure = parsed.ceo_chair_structure
    assert structure is not None
    assert structure.structure == "separate"
    assert structure.ceo_name == "John Carter"
    assert structure.chair_name == "Maria Diaz"
    assert structure.source.raw_line == 12
    assert structure.source.raw_text == "Maria Diaz is Chair of the Board."


def test_parse_governance_keeps_missing_optional_facts_none_when_not_feasible() -> None:
    text = """Corporate governance highlights
We maintain governance oversight through board committees.
"""

    parsed = parse_governance_facts(
        text=text,
        start_line=55,
        source_url="https://example.test/no-facts",
        accession="acc-none",
    )

    assert parsed.ceo_chair_structure is None
    assert parsed.compensation_committee_members == ()
    assert parsed.say_on_pay_result is None
