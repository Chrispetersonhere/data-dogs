from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Iterable

PARSER_VERSION = "market-data.insider_ingest.v1"

_ALLOWED_ACQUIRED_OR_DISPOSED = frozenset({"A", "D"})
_ALLOWED_OWNERSHIP_FORMS = frozenset({"D", "I"})


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _stable_json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def _require_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"missing required non-empty field: {field_name}")
    return value.strip()


def _optional_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("optional text field must be a string or None")
    trimmed = value.strip()
    return trimmed or None


def _require_cik(value: Any, field_name: str) -> str:
    raw = _require_text(value, field_name)
    digits = raw.lstrip("0") or "0"
    if not digits.isdigit():
        raise ValueError(f"{field_name} must be digit-only CIK, got: {value!r}")
    return raw.zfill(10)


def _optional_cik(value: Any, field_name: str) -> str | None:
    if value is None:
        return None
    return _require_cik(value, field_name)


def _require_iso_date(value: Any, field_name: str) -> str:
    raw = _require_text(value, field_name)
    try:
        datetime.strptime(raw, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError(f"{field_name} must be ISO date YYYY-MM-DD, got: {value!r}") from exc
    return raw


def _optional_decimal(value: Any, field_name: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        raise ValueError(f"{field_name} must be numeric, got bool")
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        try:
            return float(stripped)
        except ValueError as exc:
            raise ValueError(f"{field_name} must be numeric, got: {value!r}") from exc
    raise ValueError(f"{field_name} must be numeric, got: {value!r}")


def _require_decimal(value: Any, field_name: str) -> float:
    result = _optional_decimal(value, field_name)
    if result is None:
        raise ValueError(f"missing required numeric field: {field_name}")
    return result


def _require_enum(value: Any, field_name: str, allowed: frozenset[str]) -> str:
    raw = _require_text(value, field_name)
    if raw not in allowed:
        raise ValueError(f"{field_name} must be one of {sorted(allowed)}, got: {value!r}")
    return raw


def _optional_enum(value: Any, field_name: str, allowed: frozenset[str]) -> str | None:
    text = _optional_text(value)
    if text is None:
        return None
    if text not in allowed:
        raise ValueError(f"{field_name} must be one of {sorted(allowed)} or null, got: {value!r}")
    return text


@dataclass(frozen=True)
class RawInsiderArtifact:
    raw_insider_artifact_id: str
    dataset_name: str
    source_url: str
    source_accession: str
    issuer_cik: str | None
    fetched_at: str
    checksum_sha256: str
    parser_version: str
    ingest_job_id: str
    payload_json: str


@dataclass(frozen=True)
class InsiderRecord:
    insider_id: str
    issuer_cik: str
    insider_cik: str | None
    insider_full_name: str
    is_director: bool
    is_officer: bool
    is_ten_percent_owner: bool
    is_other_reporter: bool
    officer_title: str | None
    recorded_at: str


@dataclass(frozen=True)
class InsiderTransactionRow:
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


@dataclass(frozen=True)
class InsiderHoldingRow:
    insider_id: str
    issuer_cik: str
    security_ticker: str | None
    security_title: str
    shares_owned: float
    ownership_form: str | None
    as_of_date: str
    raw_insider_artifact_id: str
    source_url: str
    source_accession: str
    source_fetched_at: str
    source_checksum: str
    parser_version: str
    ingest_job_id: str
    recorded_at: str


class InMemoryInsiderStore:
    """In-memory insider ingest store with strict raw + normalized layer separation."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._raw_by_checksum: dict[str, RawInsiderArtifact] = {}
        self._insiders: dict[str, InsiderRecord] = {}
        self._transactions: list[InsiderTransactionRow] = []
        self._holdings: list[InsiderHoldingRow] = []
        self._transaction_keys: set[tuple[str, ...]] = set()
        self._holding_keys: set[tuple[str, ...]] = set()

    @property
    def raw_artifacts(self) -> dict[str, RawInsiderArtifact]:
        return self._raw_by_checksum

    @property
    def insiders(self) -> dict[str, InsiderRecord]:
        return self._insiders

    @property
    def transactions(self) -> list[InsiderTransactionRow]:
        return self._transactions

    @property
    def holdings(self) -> list[InsiderHoldingRow]:
        return self._holdings

    def store_raw(
        self,
        *,
        dataset_name: str,
        source_url: str,
        source_accession: str,
        issuer_cik: str | None,
        parser_version: str,
        ingest_job_id: str,
        payload: dict[str, Any],
    ) -> RawInsiderArtifact:
        checksum_material = {
            "dataset_name": dataset_name,
            "source_url": source_url,
            "source_accession": source_accession,
            "issuer_cik": issuer_cik,
            "parser_version": parser_version,
            "payload": payload,
        }
        payload_json = _stable_json(payload)
        checksum_payload = _stable_json(checksum_material)
        checksum_sha256 = hashlib.sha256(checksum_payload.encode("utf-8")).hexdigest()

        with self._lock:
            existing = self._raw_by_checksum.get(checksum_sha256)
            if existing is not None:
                return existing
            artifact = RawInsiderArtifact(
                raw_insider_artifact_id=f"raw_insider:{checksum_sha256}",
                dataset_name=dataset_name,
                source_url=source_url,
                source_accession=source_accession,
                issuer_cik=issuer_cik,
                fetched_at=_utc_now_iso(),
                checksum_sha256=checksum_sha256,
                parser_version=parser_version,
                ingest_job_id=ingest_job_id,
                payload_json=payload_json,
            )
            self._raw_by_checksum[checksum_sha256] = artifact
            return artifact

    def upsert_insider(
        self,
        *,
        issuer_cik: str,
        raw_row: dict[str, Any],
    ) -> InsiderRecord:
        insider_full_name = _require_text(raw_row.get("insider_full_name"), "insider_full_name")
        insider_cik = _optional_cik(raw_row.get("insider_cik"), "insider_cik")
        is_director = bool(raw_row.get("is_director", False))
        is_officer = bool(raw_row.get("is_officer", False))
        is_ten_percent_owner = bool(raw_row.get("is_ten_percent_owner", False))
        is_other_reporter = bool(raw_row.get("is_other_reporter", False))
        officer_title = _optional_text(raw_row.get("officer_title"))

        key_material = {
            "issuer_cik": issuer_cik,
            "insider_full_name": insider_full_name,
            "insider_cik": insider_cik,
        }
        insider_id = "insider:" + hashlib.sha256(
            _stable_json(key_material).encode("utf-8"),
        ).hexdigest()[:32]

        with self._lock:
            existing = self._insiders.get(insider_id)
            if existing is not None:
                return existing
            record = InsiderRecord(
                insider_id=insider_id,
                issuer_cik=issuer_cik,
                insider_cik=insider_cik,
                insider_full_name=insider_full_name,
                is_director=is_director,
                is_officer=is_officer,
                is_ten_percent_owner=is_ten_percent_owner,
                is_other_reporter=is_other_reporter,
                officer_title=officer_title,
                recorded_at=_utc_now_iso(),
            )
            self._insiders[insider_id] = record
            return record

    def stage_transaction(
        self,
        *,
        insider: InsiderRecord,
        raw_artifact: RawInsiderArtifact,
        ingest_job_id: str,
        parser_version: str,
        raw_row: dict[str, Any],
    ) -> bool:
        security_title = _require_text(raw_row.get("security_title"), "security_title")
        security_ticker = _optional_text(raw_row.get("security_ticker"))
        transaction_date = _require_iso_date(raw_row.get("transaction_date"), "transaction_date")
        transaction_code = _require_text(raw_row.get("transaction_code"), "transaction_code")
        acquired_or_disposed = _require_enum(
            raw_row.get("acquired_or_disposed"),
            "acquired_or_disposed",
            _ALLOWED_ACQUIRED_OR_DISPOSED,
        )
        shares = _optional_decimal(raw_row.get("shares"), "shares")
        price_per_share = _optional_decimal(raw_row.get("price_per_share"), "price_per_share")
        shares_owned_after = _optional_decimal(raw_row.get("shares_owned_after"), "shares_owned_after")
        ownership_form = _optional_enum(
            raw_row.get("ownership_form"),
            "ownership_form",
            _ALLOWED_OWNERSHIP_FORMS,
        )

        key = (
            insider.issuer_cik,
            insider.insider_id,
            security_title,
            transaction_date,
            transaction_code,
            acquired_or_disposed,
            repr(shares),
            repr(price_per_share),
            raw_artifact.source_accession,
        )
        with self._lock:
            if key in self._transaction_keys:
                return False
            self._transaction_keys.add(key)
            self._transactions.append(
                InsiderTransactionRow(
                    insider_id=insider.insider_id,
                    issuer_cik=insider.issuer_cik,
                    security_ticker=security_ticker,
                    security_title=security_title,
                    transaction_date=transaction_date,
                    transaction_code=transaction_code,
                    acquired_or_disposed=acquired_or_disposed,
                    shares=shares,
                    price_per_share=price_per_share,
                    shares_owned_after=shares_owned_after,
                    ownership_form=ownership_form,
                    raw_insider_artifact_id=raw_artifact.raw_insider_artifact_id,
                    source_url=raw_artifact.source_url,
                    source_accession=raw_artifact.source_accession,
                    source_fetched_at=raw_artifact.fetched_at,
                    source_checksum=raw_artifact.checksum_sha256,
                    parser_version=parser_version,
                    ingest_job_id=ingest_job_id,
                    recorded_at=_utc_now_iso(),
                )
            )
            return True

    def stage_holding(
        self,
        *,
        insider: InsiderRecord,
        raw_artifact: RawInsiderArtifact,
        ingest_job_id: str,
        parser_version: str,
        raw_row: dict[str, Any],
    ) -> bool:
        security_title = _require_text(raw_row.get("security_title"), "security_title")
        security_ticker = _optional_text(raw_row.get("security_ticker"))
        shares_owned = _require_decimal(raw_row.get("shares_owned"), "shares_owned")
        ownership_form = _optional_enum(
            raw_row.get("ownership_form"),
            "ownership_form",
            _ALLOWED_OWNERSHIP_FORMS,
        )
        as_of_date = _require_iso_date(raw_row.get("as_of_date"), "as_of_date")

        key = (
            insider.insider_id,
            security_title,
            as_of_date,
            ownership_form or "",
            raw_artifact.source_accession,
        )
        with self._lock:
            if key in self._holding_keys:
                return False
            self._holding_keys.add(key)
            self._holdings.append(
                InsiderHoldingRow(
                    insider_id=insider.insider_id,
                    issuer_cik=insider.issuer_cik,
                    security_ticker=security_ticker,
                    security_title=security_title,
                    shares_owned=shares_owned,
                    ownership_form=ownership_form,
                    as_of_date=as_of_date,
                    raw_insider_artifact_id=raw_artifact.raw_insider_artifact_id,
                    source_url=raw_artifact.source_url,
                    source_accession=raw_artifact.source_accession,
                    source_fetched_at=raw_artifact.fetched_at,
                    source_checksum=raw_artifact.checksum_sha256,
                    parser_version=parser_version,
                    ingest_job_id=ingest_job_id,
                    recorded_at=_utc_now_iso(),
                )
            )
            return True


@dataclass(frozen=True)
class InsiderIngestResult:
    raw_insider_artifact_id: str
    raw_checksum_sha256: str
    insider_id: str
    staged_transaction_count: int
    staged_holding_count: int
    source_url: str
    source_accession: str
    source_fetched_at: str
    parser_version: str
    ingest_job_id: str


def ingest_insider_dataset(
    *,
    dataset_name: str,
    source_url: str,
    source_accession: str,
    issuer_cik: str,
    ingest_job_id: str,
    insider: dict[str, Any],
    transactions: Iterable[dict[str, Any]] = (),
    holdings: Iterable[dict[str, Any]] = (),
    store: InMemoryInsiderStore,
    parser_version: str = PARSER_VERSION,
) -> InsiderIngestResult:
    """Ingest one insider filing (Form 3/4/5 or equivalent) for a single reporting person.

    The caller provides an already-parsed view of one filing. This function:
      1. Stores an immutable raw artifact containing the full insider + transactions + holdings payload.
      2. Upserts a normalized insider identity linked to the issuer CIK.
      3. Stages normalized transaction and holding rows, each carrying full source provenance
         (raw artifact id, source url, accession, fetched_at, checksum, parser version, ingest job id).

    Reruns with identical inputs are idempotent: raw is deduplicated by checksum; staged rows are
    deduplicated by natural keys that include the source accession.
    """

    normalized_dataset_name = _require_text(dataset_name, "dataset_name")
    normalized_source_url = _require_text(source_url, "source_url")
    normalized_accession = _require_text(source_accession, "source_accession")
    normalized_issuer_cik = _require_cik(issuer_cik, "issuer_cik")
    normalized_ingest_job_id = _require_text(ingest_job_id, "ingest_job_id")
    normalized_parser_version = _require_text(parser_version, "parser_version")

    if not isinstance(insider, dict):
        raise ValueError("insider must be a dict")
    transactions_list = list(transactions)
    holdings_list = list(holdings)

    payload: dict[str, Any] = {
        "insider": insider,
        "transactions": transactions_list,
        "holdings": holdings_list,
    }

    raw_artifact = store.store_raw(
        dataset_name=normalized_dataset_name,
        source_url=normalized_source_url,
        source_accession=normalized_accession,
        issuer_cik=normalized_issuer_cik,
        parser_version=normalized_parser_version,
        ingest_job_id=normalized_ingest_job_id,
        payload=payload,
    )

    insider_record = store.upsert_insider(
        issuer_cik=normalized_issuer_cik,
        raw_row=insider,
    )

    staged_transactions = 0
    for raw_row in transactions_list:
        if not isinstance(raw_row, dict):
            raise ValueError("each transaction row must be a dict")
        if store.stage_transaction(
            insider=insider_record,
            raw_artifact=raw_artifact,
            ingest_job_id=normalized_ingest_job_id,
            parser_version=normalized_parser_version,
            raw_row=raw_row,
        ):
            staged_transactions += 1

    staged_holdings = 0
    for raw_row in holdings_list:
        if not isinstance(raw_row, dict):
            raise ValueError("each holding row must be a dict")
        if store.stage_holding(
            insider=insider_record,
            raw_artifact=raw_artifact,
            ingest_job_id=normalized_ingest_job_id,
            parser_version=normalized_parser_version,
            raw_row=raw_row,
        ):
            staged_holdings += 1

    return InsiderIngestResult(
        raw_insider_artifact_id=raw_artifact.raw_insider_artifact_id,
        raw_checksum_sha256=raw_artifact.checksum_sha256,
        insider_id=insider_record.insider_id,
        staged_transaction_count=staged_transactions,
        staged_holding_count=staged_holdings,
        source_url=raw_artifact.source_url,
        source_accession=raw_artifact.source_accession,
        source_fetched_at=raw_artifact.fetched_at,
        parser_version=normalized_parser_version,
        ingest_job_id=normalized_ingest_job_id,
    )
