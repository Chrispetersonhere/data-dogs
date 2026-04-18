from __future__ import annotations

import hashlib
from pathlib import Path
import re
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fetch_proxy import fetch_proxy_filing
from segment_proxy import segment_proxy_filing


def test_fetch_proxy_filing_preserves_provenance_fields() -> None:
    sample_body = "NOTICE OF ANNUAL MEETING\nBody"

    raw = fetch_proxy_filing(
        source_url="https://www.sec.gov/Archives/edgar/data/0000000/proxy.htm",
        accession="0000000-26-000001",
        job_id="job-58-fetch",
        fetcher=lambda _url: sample_body,
    )

    assert raw.source_url.endswith("proxy.htm")
    assert raw.accession == "0000000-26-000001"
    assert raw.job_id == "job-58-fetch"
    assert raw.body_text == sample_body
    assert raw.source_checksum_sha256 == hashlib.sha256(sample_body.encode("utf-8")).hexdigest()
    assert raw.parser_version == "parse-proxy.fetch_proxy.v1"
    assert re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", raw.fetched_at_utc)


def test_segment_major_sections_and_find_candidate_comp_table() -> None:
    filing = """NOTICE OF ANNUAL MEETING OF STOCKHOLDERS
Intro text.

EXECUTIVE COMPENSATION
Summary Compensation Table
Name  Salary  Bonus  Total Compensation
CEO   1000000 500000 1500000
CFO   700000  300000 1000000

SECURITY OWNERSHIP OF CERTAIN BENEFICIAL OWNERS
Ownership text.
"""

    raw = fetch_proxy_filing(
        source_url="https://www.sec.gov/Archives/edgar/data/0000000/def14a.htm",
        accession="0000000-26-000002",
        job_id="job-58-segment",
        fetcher=lambda _url: filing,
    )

    segmented = segment_proxy_filing(raw)

    titles = [s.title for s in segmented.sections]
    assert titles == [
        "NOTICE OF ANNUAL MEETING OF STOCKHOLDERS",
        "EXECUTIVE COMPENSATION",
        "SECURITY OWNERSHIP OF CERTAIN BENEFICIAL OWNERS",
    ]

    assert segmented.source_url == raw.source_url
    assert segmented.source_checksum_sha256 == raw.source_checksum_sha256
    assert segmented.parser_version == "parse-proxy.segment_proxy.v1"

    assert len(segmented.candidate_comp_tables) == 1
    table = segmented.candidate_comp_tables[0]
    assert table.section_title == "EXECUTIVE COMPENSATION"
    assert "Salary" in table.text
    assert "Bonus" in table.text
    assert table.source_url == raw.source_url
