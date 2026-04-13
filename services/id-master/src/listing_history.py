from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_required(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} must be non-empty")
    return normalized


def _is_active_during_window(*, effective_from: str, effective_to: str | None, as_of: str) -> bool:
    if effective_from > as_of:
        return False
    if effective_to is None:
        return True
    return as_of < effective_to


@dataclass(frozen=True)
class ListingHistoryRecord:
    security_id: str
    venue_code: str
    listing_symbol: str
    effective_from: str
    effective_to: str | None
    recorded_at: str


class ListingHistory:
    """Effective-dated listing history that preserves transitions over time."""

    def __init__(self) -> None:
        self._history: dict[str, list[ListingHistoryRecord]] = {}

    def add_record(
        self,
        *,
        security_id: str,
        venue_code: str,
        listing_symbol: str,
        effective_from: str,
        effective_to: str | None = None,
        recorded_at: str | None = None,
    ) -> ListingHistoryRecord:
        normalized_security_id = _normalize_required(security_id, "security_id")
        normalized_venue_code = _normalize_required(venue_code, "venue_code").upper()
        normalized_listing_symbol = _normalize_required(listing_symbol, "listing_symbol").upper()
        normalized_effective_from = _normalize_required(effective_from, "effective_from")
        normalized_effective_to = effective_to.strip() if effective_to else None
        normalized_recorded_at = recorded_at or _utc_now_iso()

        candidate = ListingHistoryRecord(
            security_id=normalized_security_id,
            venue_code=normalized_venue_code,
            listing_symbol=normalized_listing_symbol,
            effective_from=normalized_effective_from,
            effective_to=normalized_effective_to,
            recorded_at=normalized_recorded_at,
        )

        history = self._history.setdefault(normalized_security_id, [])
        for existing in history:
            if (
                existing.venue_code == candidate.venue_code
                and existing.listing_symbol == candidate.listing_symbol
                and existing.effective_from == candidate.effective_from
            ):
                return existing

        history.append(candidate)
        history.sort(key=lambda row: row.effective_from)
        return candidate

    def transition_listing(
        self,
        *,
        security_id: str,
        new_venue_code: str,
        new_listing_symbol: str,
        transition_at: str,
        recorded_at: str | None = None,
    ) -> ListingHistoryRecord:
        normalized_security_id = _normalize_required(security_id, "security_id")
        normalized_transition_at = _normalize_required(transition_at, "transition_at")
        normalized_recorded_at = recorded_at or _utc_now_iso()

        history = self._history.get(normalized_security_id, [])
        for idx in range(len(history) - 1, -1, -1):
            row = history[idx]
            if row.effective_to is None:
                history[idx] = ListingHistoryRecord(
                    security_id=row.security_id,
                    venue_code=row.venue_code,
                    listing_symbol=row.listing_symbol,
                    effective_from=row.effective_from,
                    effective_to=normalized_transition_at,
                    recorded_at=row.recorded_at,
                )
                break

        return self.add_record(
            security_id=normalized_security_id,
            venue_code=new_venue_code,
            listing_symbol=new_listing_symbol,
            effective_from=normalized_transition_at,
            effective_to=None,
            recorded_at=normalized_recorded_at,
        )

    def get_history(self, security_id: str) -> list[ListingHistoryRecord]:
        normalized_security_id = _normalize_required(security_id, "security_id")
        return list(self._history.get(normalized_security_id, []))

    def get_listing_as_of(
        self,
        *,
        security_id: str,
        as_of: str,
        knowledge_as_of: str | None = None,
    ) -> ListingHistoryRecord | None:
        normalized_security_id = _normalize_required(security_id, "security_id")
        normalized_as_of = _normalize_required(as_of, "as_of")
        normalized_knowledge_as_of = knowledge_as_of.strip() if knowledge_as_of else normalized_as_of

        eligible = [
            row
            for row in self._history.get(normalized_security_id, [])
            if row.recorded_at <= normalized_knowledge_as_of
            and _is_active_during_window(
                effective_from=row.effective_from,
                effective_to=row.effective_to,
                as_of=normalized_as_of,
            )
        ]
        if not eligible:
            return None

        eligible.sort(key=lambda row: row.effective_from)
        return eligible[-1]
