from __future__ import annotations

from dataclasses import dataclass
import re

PARSER_VERSION = "parse-proxy.parse_governance.v1"

_NAME_PATTERN = r"[A-Z][A-Za-z'\.-]+(?:\s+[A-Z][A-Za-z'\.-]+){1,4}"


@dataclass(frozen=True)
class GovernanceLineRef:
    source_url: str
    source_accession: str
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
    raw_lines = text.splitlines()
    non_empty_lines = [(idx, line) for idx, line in enumerate(raw_lines) if line.strip()]

    ceo_chair_structure = _extract_ceo_chair_structure(
        lines=non_empty_lines,
        start_line=start_line,
        source_url=source_url,
        accession=accession,
    )
    compensation_members = _extract_comp_committee_members(
        lines=non_empty_lines,
        start_line=start_line,
        source_url=source_url,
        accession=accession,
    )
    say_on_pay_result = _extract_say_on_pay(
        lines=non_empty_lines,
        start_line=start_line,
        source_url=source_url,
        accession=accession,
    )

    return ParsedGovernance(
        source_url=source_url,
        accession=accession,
        parser_version=PARSER_VERSION,
        ceo_chair_structure=ceo_chair_structure,
        compensation_committee_members=compensation_members,
        say_on_pay_result=say_on_pay_result,
    )


def _extract_ceo_chair_structure(
    *, lines: list[tuple[int, str]], start_line: int, source_url: str, accession: str
) -> CeoChairStructureFact | None:
    ceo_name: str | None = None
    chair_name: str | None = None
    ceo_ref: GovernanceLineRef | None = None
    chair_ref: GovernanceLineRef | None = None

    for raw_idx, raw in lines:
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
            line_ref = GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            )
            return CeoChairStructureFact(
                structure="combined",
                ceo_name=name,
                chair_name=name,
                source=line_ref,
            )

        if "chief executive officer" in lowered:
            ceo_name = _first_name(raw)
            ceo_ref = GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            )

        if "chair of the board" in lowered or "chairman of the board" in lowered or "board chair" in lowered:
            chair_name = _first_name(raw)
            chair_ref = GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            )

        separate_markers = (
            "roles of chief executive officer and chair are separate",
            "roles of chief executive officer and chairman are separate",
            "chief executive officer and chair roles are separate",
            "chief executive officer and chairman roles are separate",
        )
        if any(marker in lowered for marker in separate_markers):
            line_ref = GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            )
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


def _extract_comp_committee_members(
    *, lines: list[tuple[int, str]], start_line: int, source_url: str, accession: str
) -> tuple[CompensationCommitteeMemberFact, ...]:
    members: dict[str, CompensationCommitteeMemberFact] = {}
    committee_context_active = False

    for raw_idx, raw in lines:
        lowered = raw.lower()
        has_committee_phrase = "compensation committee" in lowered
        has_member_phrase = any(
            keyword in lowered
            for keyword in ("members", "consists of", "comprised of", "include", "includes", "composed of")
        )

        # Many proxy statements use a section line followed by a member list line.
        if has_committee_phrase:
            committee_context_active = True

        if not has_member_phrase and not (committee_context_active and _looks_like_name_list(raw)):
            continue

        if has_member_phrase or committee_context_active:
            line_ref = GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            )
            for name in _extract_names(raw):
                members.setdefault(name, CompensationCommitteeMemberFact(member_name=name, source=line_ref))

        # Stop context once we move past a likely member list line.
        if has_member_phrase or _looks_like_name_list(raw):
            committee_context_active = False

    return tuple(members.values())


def _extract_say_on_pay(
    *, lines: list[tuple[int, str]], start_line: int, source_url: str, accession: str
) -> SayOnPayResultFact | None:
    for raw_idx, raw in lines:
        lowered = raw.lower()
        if "say-on-pay" not in lowered and "say on pay" not in lowered:
            continue

        support_percent = _extract_support_percent(raw)
        outcome = _infer_say_on_pay_outcome(line=raw, support_percent=support_percent)

        return SayOnPayResultFact(
            outcome=outcome,
            support_percent=support_percent,
            source=GovernanceLineRef(
                source_url=source_url,
                source_accession=accession,
                raw_line=start_line + raw_idx,
                raw_text=raw,
            ),
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


def _looks_like_name_list(text: str) -> bool:
    names = _extract_names(text)
    return len(names) >= 2


def _extract_support_percent(text: str) -> float | None:
    for_pattern = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%\s*(?:for|in favor)", text, flags=re.IGNORECASE)
    if for_pattern:
        return float(for_pattern.group(1))

    generic = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", text)
    if generic:
        return float(generic.group(1))
    return None


def _infer_say_on_pay_outcome(*, line: str, support_percent: float | None) -> str:
    lowered = line.lower()
    if any(term in lowered for term in ("approved", "passed", "received majority", "supported")):
        return "approved"
    if any(term in lowered for term in ("failed", "did not pass", "not approved", "rejected")):
        return "failed"

    against_match = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%\s*against", line, flags=re.IGNORECASE)
    if support_percent is not None and against_match:
        against_percent = float(against_match.group(1))
        return "approved" if support_percent > against_percent else "failed"

    if support_percent is not None:
        return "approved" if support_percent >= 50.0 else "failed"
    return "unknown"
