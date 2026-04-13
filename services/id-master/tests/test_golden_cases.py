from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SQL_PATH = ROOT / "packages" / "db" / "seeds" / "golden_companies.sql"
DOC_PATH = ROOT / "docs" / "qa" / "golden-dataset.md"

REQUIRED_FAMILIES = {
    "name_changes",
    "multiple_securities",
    "amended_filings",
    "complex_histories",
    "identity_ambiguity",
}


def _load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_rows(sql_text: str) -> list[str]:
    return [line.strip() for line in sql_text.splitlines() if line.strip().startswith("('")]


def test_golden_sql_exists_and_has_non_trivial_volume() -> None:
    assert SQL_PATH.exists(), "golden_companies.sql must exist"
    rows = _extract_rows(_load_text(SQL_PATH))
    assert len(rows) >= 10, "gold dataset is too small/trivial; add meaningful coverage"


def test_required_case_families_are_present() -> None:
    sql_text = _load_text(SQL_PATH)
    for family in REQUIRED_FAMILIES:
        assert f"'{family}'" in sql_text, f"missing required family: {family}"


def test_documentation_explains_each_required_family() -> None:
    assert DOC_PATH.exists(), "golden-dataset.md must exist"
    text = _load_text(DOC_PATH).lower()

    expected_sections = [
        "name changes",
        "multiple securities",
        "amended filings",
        "complex histories",
        "identity ambiguity",
        "why this exists",
    ]
    for section in expected_sections:
        assert section in text, f"missing documentation text: {section}"
