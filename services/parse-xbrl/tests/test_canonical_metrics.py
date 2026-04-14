from __future__ import annotations

import re
from pathlib import Path

REQUIRED_KEYS = {
    "revenue",
    "gross_profit",
    "operating_income",
    "net_income",
    "assets",
    "liabilities",
    "equity",
    "cfo",
    "capex",
    "fcf",
    "shares",
}


def _canonical_metrics_text() -> str:
    root = Path(__file__).resolve().parents[3]
    target = root / "packages" / "schemas" / "src" / "domain" / "canonical_metrics.ts"
    return target.read_text(encoding="utf-8")


def test_dictionary_contains_exact_required_metric_keys() -> None:
    text = _canonical_metrics_text()
    found = set(re.findall(r"^\s{2}([a-z_]+):\s*\{", text, flags=re.MULTILINE))

    assert found == REQUIRED_KEYS


def test_every_metric_has_required_fields() -> None:
    text = _canonical_metrics_text()

    for key in REQUIRED_KEYS:
        block_match = re.search(rf"\n\s{{2}}{key}:\s*\{{(.*?)\n\s{{2}}\}},", text, flags=re.DOTALL)
        assert block_match, f"missing block for metric: {key}"
        block = block_match.group(1)

        for field in ("name", "description", "unit", "scopeNote"):
            assert re.search(rf"\b{field}:\s*'[^']+'", block), f"missing {field} on {key}"


def test_dictionary_remains_tight_and_not_bloated() -> None:
    text = _canonical_metrics_text()
    count = len(re.findall(r"^\s{2}[a-z_]+:\s*\{", text, flags=re.MULTILINE))

    assert count == len(REQUIRED_KEYS)
