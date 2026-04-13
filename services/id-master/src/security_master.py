from __future__ import annotations

from dataclasses import dataclass

from _shared import normalize_lower, normalize_optional, normalize_required, normalize_upper, utc_now_iso


@dataclass(frozen=True)
class SecurityRecord:
    security_id: str
    issuer_id: str
    security_key: str
    security_type: str
    created_at: str
    updated_at: str


@dataclass(frozen=True)
class ListingRecord:
    security_id: str
    venue_code: str
    listing_symbol: str
    effective_from: str
    effective_to: str | None


class SecurityMaster:
    """Canonical security master with effective-dated listing relationships."""

    def __init__(self) -> None:
        self._next_sequence = 1
        self._security_by_key: dict[str, SecurityRecord] = {}
        self._security_by_id: dict[str, SecurityRecord] = {}
        self._listing_history: dict[str, list[ListingRecord]] = {}

    def upsert_security(
        self,
        *,
        issuer_id: str,
        security_key: str,
        security_type: str,
        observed_at: str | None = None,
    ) -> SecurityRecord:
        normalized_issuer_id = normalize_required(issuer_id, "issuer_id")
        normalized_security_key = normalize_upper(security_key, "security_key")
        normalized_security_type = normalize_lower(security_type, "security_type")
        observed_timestamp = observed_at or utc_now_iso()

        current = self._security_by_key.get(normalized_security_key)
        if current is None:
            security_id = f"security-{self._next_sequence:06d}"
            self._next_sequence += 1
            created = SecurityRecord(
                security_id=security_id,
                issuer_id=normalized_issuer_id,
                security_key=normalized_security_key,
                security_type=normalized_security_type,
                created_at=observed_timestamp,
                updated_at=observed_timestamp,
            )
            self._security_by_key[normalized_security_key] = created
            self._security_by_id[security_id] = created
            self._listing_history[security_id] = []
            return created

        if current.issuer_id != normalized_issuer_id:
            raise ValueError("security_key already mapped to a different issuer_id")

        if current.security_type == normalized_security_type:
            return current

        updated = SecurityRecord(
            security_id=current.security_id,
            issuer_id=current.issuer_id,
            security_key=current.security_key,
            security_type=normalized_security_type,
            created_at=current.created_at,
            updated_at=observed_timestamp,
        )
        self._security_by_key[normalized_security_key] = updated
        self._security_by_id[updated.security_id] = updated
        return updated

    def add_listing(
        self,
        *,
        security_id: str,
        venue_code: str,
        listing_symbol: str,
        effective_from: str,
        effective_to: str | None = None,
    ) -> ListingRecord:
        normalized_security_id = normalize_required(security_id, "security_id")
        normalized_venue_code = normalize_upper(venue_code, "venue_code")
        normalized_listing_symbol = normalize_upper(listing_symbol, "listing_symbol")
        normalized_effective_from = normalize_required(effective_from, "effective_from")
        normalized_effective_to = normalize_optional(effective_to)

        if normalized_security_id not in self._security_by_id:
            raise KeyError(f"Unknown security_id: {normalized_security_id}")

        listing = ListingRecord(
            security_id=normalized_security_id,
            venue_code=normalized_venue_code,
            listing_symbol=normalized_listing_symbol,
            effective_from=normalized_effective_from,
            effective_to=normalized_effective_to,
        )

        history = self._listing_history[normalized_security_id]
        for existing in history:
            if (
                existing.venue_code == listing.venue_code
                and existing.listing_symbol == listing.listing_symbol
                and existing.effective_from == listing.effective_from
            ):
                return existing

        history.append(listing)
        history.sort(key=lambda row: row.effective_from)
        return listing

    def get_security_by_id(self, security_id: str) -> SecurityRecord | None:
        return self._security_by_id.get(normalize_required(security_id, "security_id"))

    def get_security_by_key(self, security_key: str) -> SecurityRecord | None:
        normalized_security_key = normalize_upper(security_key, "security_key")
        return self._security_by_key.get(normalized_security_key)

    def get_listings(self, security_id: str) -> list[ListingRecord]:
        normalized_security_id = normalize_required(security_id, "security_id")
        return list(self._listing_history.get(normalized_security_id, []))

    def get_securities_for_issuer(self, issuer_id: str) -> list[SecurityRecord]:
        normalized_issuer_id = normalize_required(issuer_id, "issuer_id")
        return [security for security in self._security_by_id.values() if security.issuer_id == normalized_issuer_id]
