from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Literal

from src.insider_ingest import InsiderTransactionRow

NORMALIZER_VERSION = "market-data.normalize_insiders.v1"

NormalizedClass = Literal[
    "buy",
    "sell",
    "grant",
    "derivative_event",
    "holdings_change",
    "ambiguous",
]

NORMALIZED_CLASSES: frozenset[str] = frozenset(
    {"buy", "sell", "grant", "derivative_event", "holdings_change", "ambiguous"},
)

# SEC Form 4 transaction codes, mapped by (code, acquired_or_disposed) → normalized class.
# Codes and their legal meaning are from Form 4 "Explanation of Responses / Transaction Codes".
# Any code or direction not covered here resolves to "ambiguous" with a reason; this is
# deliberate — the rollback rule forbids inventing precision the source data does not support.
_CODE_RULES: dict[str, dict[str, NormalizedClass]] = {
    # General open-market transactions
    "P": {"A": "buy"},
    "S": {"D": "sell"},
    # Rule 16b-3 issuer-related transactions
    "A": {"A": "grant"},
    "D": {"D": "sell"},
    "F": {"A": "holdings_change", "D": "holdings_change"},
    "M": {"A": "derivative_event", "D": "derivative_event"},
    # Derivative-security transactions
    "C": {"A": "derivative_event", "D": "derivative_event"},
    "E": {"A": "derivative_event", "D": "derivative_event"},
    "H": {"A": "derivative_event", "D": "derivative_event"},
    "O": {"A": "derivative_event", "D": "derivative_event"},
    "X": {"A": "derivative_event", "D": "derivative_event"},
    "K": {"A": "derivative_event", "D": "derivative_event"},
    # Other exempt / small-acquisition / estate transactions
    "G": {"A": "holdings_change", "D": "holdings_change"},
    "L": {"A": "buy"},
    "W": {"A": "holdings_change", "D": "holdings_change"},
    "Z": {"A": "holdings_change", "D": "holdings_change"},
    "U": {"D": "sell"},
    # Codes deliberately left out: V (voluntarily reported early, underlying event unknown),
    # I (discretionary under Rule 16b-3(f), direction alone does not disambiguate),
    # J (other acquisition or disposition). These always resolve to "ambiguous".
}

_ALWAYS_AMBIGUOUS: frozenset[str] = frozenset({"V", "I", "J"})


@dataclass(frozen=True)
class NormalizedInsiderTransaction:
    """Staged insider transaction with its normalized class, ambiguity flag, and full provenance.

    Provenance fields are copied verbatim from the upstream `InsiderTransactionRow`; a distinct
    `normalizer_version` records which normalization mapping produced `normalized_class`.
    """

    insider_id: str
    issuer_cik: str
    security_ticker: str | None
    security_title: str
    transaction_date: str
    transaction_code: str
    acquired_or_disposed: str
    shares: float | None
    price_per_share: float | None
    shares_owned_after: float | None
    ownership_form: str | None
    raw_insider_artifact_id: str
    source_url: str
    source_accession: str
    source_fetched_at: str
    source_checksum: str
    parser_version: str
    ingest_job_id: str
    recorded_at: str
    normalized_class: NormalizedClass
    normalized_ambiguous: bool
    normalized_reason: str | None
    normalizer_version: str
    normalized_at: str


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def classify_transaction_code(
    transaction_code: str,
    acquired_or_disposed: str,
) -> tuple[NormalizedClass, str | None]:
    """Return (normalized_class, reason) for a SEC Form 4 transaction code + A/D direction.

    `reason` is None for a clean classification and a short human-readable string whenever
    the result is "ambiguous". Ambiguity is explicit; callers must not silently drop it.
    """

    if not isinstance(transaction_code, str) or not transaction_code.strip():
        raise ValueError("transaction_code must be a non-empty string")
    if acquired_or_disposed not in {"A", "D"}:
        raise ValueError("acquired_or_disposed must be 'A' or 'D'")

    code = transaction_code.strip().upper()
    if code in _ALWAYS_AMBIGUOUS:
        return "ambiguous", f"transaction_code {code} is inherently ambiguous per SEC Form 4"

    rule = _CODE_RULES.get(code)
    if rule is None:
        return "ambiguous", f"unknown transaction_code: {code}"

    resolved = rule.get(acquired_or_disposed)
    if resolved is None:
        return (
            "ambiguous",
            f"transaction_code {code} has no rule for direction {acquired_or_disposed}",
        )
    return resolved, None


def normalize_transaction(row: InsiderTransactionRow) -> NormalizedInsiderTransaction:
    """Classify a single staged insider transaction row and carry provenance forward."""

    normalized_class, reason = classify_transaction_code(
        row.transaction_code,
        row.acquired_or_disposed,
    )
    return NormalizedInsiderTransaction(
        insider_id=row.insider_id,
        issuer_cik=row.issuer_cik,
        security_ticker=row.security_ticker,
        security_title=row.security_title,
        transaction_date=row.transaction_date,
        transaction_code=row.transaction_code,
        acquired_or_disposed=row.acquired_or_disposed,
        shares=row.shares,
        price_per_share=row.price_per_share,
        shares_owned_after=row.shares_owned_after,
        ownership_form=row.ownership_form,
        raw_insider_artifact_id=row.raw_insider_artifact_id,
        source_url=row.source_url,
        source_accession=row.source_accession,
        source_fetched_at=row.source_fetched_at,
        source_checksum=row.source_checksum,
        parser_version=row.parser_version,
        ingest_job_id=row.ingest_job_id,
        recorded_at=row.recorded_at,
        normalized_class=normalized_class,
        normalized_ambiguous=normalized_class == "ambiguous",
        normalized_reason=reason,
        normalizer_version=NORMALIZER_VERSION,
        normalized_at=_utc_now_iso(),
    )


def normalize_transactions(
    rows: Iterable[InsiderTransactionRow],
) -> list[NormalizedInsiderTransaction]:
    """Vectorized helper for `normalize_transaction`. Order is preserved."""

    return [normalize_transaction(r) for r in rows]
