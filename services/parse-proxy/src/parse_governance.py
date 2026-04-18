from __future__ import annotations

from dataclasses import dataclass
import re

PARSER_VERSION = "parse-proxy.parse_governance.v1"

_NAME_PATTERN = r"[A-Z][A-Za-z'\.-]+(?:\s+[A-Z][A-Za-z'\.-]+){1,4}"


@dataclass(frozen=True)
class GovernanceLineRef:
    source_url: str
    raw_line: int
    raw_text: str


@dataclass(frozen=True)
class CeoChairStructureFact:
    structure: str  # combined | separate
    ceo_name: str | None
    chair_name: str | None
    source: GovernanceLineRef


@dataclass(frozen=True)
class CompensationCommitteeMemberFact:
    member_name: str
    source: GovernanceLineRef


@dataclass(frozen=True)
class SayOnPayResultFact:
    outcome: str  # approved | failed | unknown
    support_percent: float | None
    source: GovernanceLineRef


@dataclass(frozen=True)
class ParsedGovernance:
    source_url: str
    accession: str
    parser_version: str
    ceo_chair_structure: CeoChairStructureFact | None
    compensation_committee_members: tuple[CompensationCommitteeMemberFact, ...]
    say_on_pay_result: SayOnPayResultFact | None


def parse_governance_facts(*, text: str, start_line: int, source_url: str, accession: str) -> ParsedGovernance:
    """Conservatively parse governance facts while preserving source links.

    The parser is intentionally strict and audit-oriented:
    - It emits facts only when patterns are explicit in source text.
    - It preserves source URL + raw line + raw text for every extracted fact.
    - It avoids guessing when evidence is weak or conflicting.
    """
    lines = [line for line in text.splitlines() if line.strip()]

    ceo_chair_structure = _extract_ceo_chair_structure(lines=lines, start_line=start_line, source_url=source_url)
    compensation_members = _extract_comp_committee_members(lines=lines, start_line=start_line, source_url=source_url)
    say_on_pay_result = _extract_say_on_pay(lines=lines, start_line=start_line, source_url=source_url)

    return ParsedGovernance(
        source_url=source_url,
        accession=accession,
        parser_version=PARSER_VERSION,
        ceo_chair_structure=ceo_chair_structure,
        compensation_committee_members=compensation_members,
        say_on_pay_result=say_on_pay_result,
    )


def _extract_ceo_chair_structure(*, lines: list[str], start_line: int, source_url: str) -> CeoChairStructureFact | None:
    ceo_name: str | None = None
    chair_name: str | None = None
    ceo_ref: GovernanceLineRef | None = None
    chair_ref: GovernanceLineRef | None = None

    for idx, raw in enumerate(lines):
        lowered = raw.lower()

        combined_markers = (
            "chairman and chief executive officer",
            "chair and chief executive officer",
            "both chair and chief executive officer",
            "both chairman and chief executive officer",
            "serves as both chair",
            "serves as both chairman",
        )
        if any(marker in lowered for marker in combined_markers):
            name = _first_name(raw)
            line_ref = GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw)
            return CeoChairStructureFact(
                structure="combined",
                ceo_name=name,
                chair_name=name,
                source=line_ref,
            )

        if "chief executive officer" in lowered:
            ceo_name = _first_name(raw)
            ceo_ref = GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw)

        if "chair of the board" in lowered or "chairman of the board" in lowered or "board chair" in lowered:
            chair_name = _first_name(raw)
            chair_ref = GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw)

        if "roles of chief executive officer and" in lowered and "chair" in lowered and "separate" in lowered:
            line_ref = GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw)
            return CeoChairStructureFact(
                structure="separate",
                ceo_name=ceo_name,
                chair_name=chair_name,
                source=line_ref,
            )

    if ceo_ref is not None and chair_ref is not None:
        # Prefer an explicit policy line when available; otherwise use the chair line as the structure source.
        return CeoChairStructureFact(
            structure="separate",
            ceo_name=ceo_name,
            chair_name=chair_name,
            source=chair_ref,
        )

    return None


def _extract_comp_committee_members(*, lines: list[str], start_line: int, source_url: str) -> tuple[CompensationCommitteeMemberFact, ...]:
    members: dict[str, CompensationCommitteeMemberFact] = {}

    for idx, raw in enumerate(lines):
        lowered = raw.lower()
        if "compensation committee" not in lowered:
            continue

        if not any(keyword in lowered for keyword in ("members", "consists of", "comprised of", "include")):
            continue

        line_ref = GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw)
        for name in _extract_names(raw):
            members.setdefault(name, CompensationCommitteeMemberFact(member_name=name, source=line_ref))

    return tuple(members.values())


def _extract_say_on_pay(*, lines: list[str], start_line: int, source_url: str) -> SayOnPayResultFact | None:
    for idx, raw in enumerate(lines):
        lowered = raw.lower()
        if "say-on-pay" not in lowered and "say on pay" not in lowered:
            continue

        percent_match = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", raw)
        support_percent = float(percent_match.group(1)) if percent_match else None

        if any(term in lowered for term in ("approved", "passed", "received majority", "supported")):
            outcome = "approved"
        elif any(term in lowered for term in ("failed", "did not pass", "not approved")):
            outcome = "failed"
        else:
            outcome = "unknown"

        return SayOnPayResultFact(
            outcome=outcome,
            support_percent=support_percent,
            source=GovernanceLineRef(source_url=source_url, raw_line=start_line + idx, raw_text=raw),
        )

    return None


def _extract_names(text: str) -> tuple[str, ...]:
    blocked = {
        "Compensation Committee",
        "The Compensation Committee",
        "Chief Executive Officer",
        "Chair Of The Board",
        "Board Chair",
        "Say On Pay",
    }
    names: list[str] = []
    for match in re.findall(_NAME_PATTERN, text):
        normalized = " ".join(match.split()).strip(".,;:")
        if normalized in blocked:
            continue
        names.append(normalized)
    return tuple(names)


def _first_name(text: str) -> str | None:
    names = _extract_names(text)
    if not names:
        return None
    return names[0]
