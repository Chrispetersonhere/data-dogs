from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Iterable

from fetch_proxy import ProxyFilingRaw

PARSER_VERSION = "parse-proxy.segment_proxy.v1"

_MAJOR_SECTION_HINTS = (
    "NOTICE OF ANNUAL MEETING",
    "PROPOSAL",
    "CORPORATE GOVERNANCE",
    "EXECUTIVE COMPENSATION",
    "COMPENSATION DISCUSSION AND ANALYSIS",
    "DIRECTOR COMPENSATION",
    "SECURITY OWNERSHIP",
    "AUDIT COMMITTEE",
)

_COMPENSATION_KEYWORDS = (
    "salary",
    "bonus",
    "stock awards",
    "option awards",
    "non-equity incentive",
    "total",
    "compensation",
)


@dataclass(frozen=True)
class ProxySection:
    title: str
    start_line: int
    end_line: int
    text: str
    source_url: str


@dataclass(frozen=True)
class CandidateCompTable:
    section_title: str
    start_line: int
    end_line: int
    text: str
    source_url: str


@dataclass(frozen=True)
class SegmentedProxy:
    accession: str
    source_url: str
    source_checksum_sha256: str
    parser_version: str
    sections: tuple[ProxySection, ...]
    candidate_comp_tables: tuple[CandidateCompTable, ...]


def _looks_like_major_header(line: str) -> bool:
    normalized = " ".join(line.strip().split())
    if len(normalized) < 6:
        return False
    upper_ratio = sum(ch.isupper() for ch in normalized) / max(len(normalized), 1)
    has_hint = any(hint in normalized.upper() for hint in _MAJOR_SECTION_HINTS)
    return upper_ratio >= 0.65 and has_hint


def _iter_section_spans(lines: list[str]) -> Iterable[tuple[str, int, int]]:
    headers: list[tuple[str, int]] = []
    for idx, line in enumerate(lines):
        if _looks_like_major_header(line):
            headers.append((line.strip(), idx))

    if not headers:
        yield ("FULL DOCUMENT", 0, len(lines) - 1)
        return

    for i, (title, start) in enumerate(headers):
        end = (headers[i + 1][1] - 1) if i + 1 < len(headers) else (len(lines) - 1)
        yield (title, start, end)


def segment_proxy_filing(raw: ProxyFilingRaw) -> SegmentedProxy:
    lines = raw.body_text.splitlines()
    sections: list[ProxySection] = []
    candidates: list[CandidateCompTable] = []

    for title, start, end in _iter_section_spans(lines):
        block_lines = lines[start : end + 1]
        section_text = "\n".join(block_lines).strip()
        section = ProxySection(
            title=title,
            start_line=start + 1,
            end_line=end + 1,
            text=section_text,
            source_url=raw.source_url,
        )
        sections.append(section)
        candidates.extend(_find_candidate_comp_tables(section))

    return SegmentedProxy(
        accession=raw.accession,
        source_url=raw.source_url,
        source_checksum_sha256=raw.source_checksum_sha256,
        parser_version=PARSER_VERSION,
        sections=tuple(sections),
        candidate_comp_tables=tuple(candidates),
    )


def _find_candidate_comp_tables(section: ProxySection) -> list[CandidateCompTable]:
    """Heuristic detector for compensation-table-like blocks in a section."""
    lines = section.text.splitlines()
    found: list[CandidateCompTable] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        looks_tabular = bool(re.search(r"\s{2,}|\|", line))
        has_comp_keyword = any(keyword in line.lower() for keyword in _COMPENSATION_KEYWORDS)

        if looks_tabular and has_comp_keyword:
            start = i
            j = i + 1
            while j < len(lines) and (re.search(r"\s{2,}|\|", lines[j]) or lines[j].strip() == ""):
                j += 1

            text = "\n".join(lines[start:j]).strip()
            if text:
                found.append(
                    CandidateCompTable(
                        section_title=section.title,
                        start_line=section.start_line + start,
                        end_line=section.start_line + j - 1,
                        text=text,
                        source_url=section.source_url,
                    )
                )
            i = j
            continue

        i += 1

    return found
