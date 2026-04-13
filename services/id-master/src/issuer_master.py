from __future__ import annotations

from dataclasses import dataclass

from _shared import normalize_required, normalize_upper, utc_now_iso


def _normalize_key(value: str) -> str:
    return normalize_upper(value, "issuer_key")


def _normalize_name(value: str) -> str:
    return normalize_required(value, "display_name")


@dataclass(frozen=True)
class IssuerNameVersion:
    issuer_id: str
    name: str
    valid_from: str
    valid_to: str | None


@dataclass(frozen=True)
class IssuerRecord:
    issuer_id: str
    issuer_key: str
    current_name: str
    created_at: str
    updated_at: str


class IssuerMaster:
    """In-memory canonical issuer master with historical name tracking."""

    def __init__(self) -> None:
        self._next_sequence = 1
        self._by_key: dict[str, IssuerRecord] = {}
        self._by_id: dict[str, IssuerRecord] = {}
        self._name_history: dict[str, list[IssuerNameVersion]] = {}

    def upsert_issuer(self, *, issuer_key: str, display_name: str, observed_at: str | None = None) -> IssuerRecord:
        stable_key = _normalize_key(issuer_key)
        normalized_name = _normalize_name(display_name)
        observed_timestamp = observed_at or utc_now_iso()

        current = self._by_key.get(stable_key)
        if current is None:
            issuer_id = f"issuer-{self._next_sequence:06d}"
            self._next_sequence += 1
            created = IssuerRecord(
                issuer_id=issuer_id,
                issuer_key=stable_key,
                current_name=normalized_name,
                created_at=observed_timestamp,
                updated_at=observed_timestamp,
            )
            self._by_key[stable_key] = created
            self._by_id[issuer_id] = created
            self._name_history[issuer_id] = [
                IssuerNameVersion(
                    issuer_id=issuer_id,
                    name=normalized_name,
                    valid_from=observed_timestamp,
                    valid_to=None,
                )
            ]
            return created

        if current.current_name == normalized_name:
            return current

        history = self._name_history[current.issuer_id]
        latest = history[-1]
        history[-1] = IssuerNameVersion(
            issuer_id=latest.issuer_id,
            name=latest.name,
            valid_from=latest.valid_from,
            valid_to=observed_timestamp,
        )
        history.append(
            IssuerNameVersion(
                issuer_id=current.issuer_id,
                name=normalized_name,
                valid_from=observed_timestamp,
                valid_to=None,
            )
        )

        updated = IssuerRecord(
            issuer_id=current.issuer_id,
            issuer_key=current.issuer_key,
            current_name=normalized_name,
            created_at=current.created_at,
            updated_at=observed_timestamp,
        )
        self._by_key[stable_key] = updated
        self._by_id[updated.issuer_id] = updated
        return updated

    def get_issuer_by_key(self, issuer_key: str) -> IssuerRecord | None:
        return self._by_key.get(_normalize_key(issuer_key))

    def get_issuer_by_id(self, issuer_id: str) -> IssuerRecord | None:
        return self._by_id.get(issuer_id)

    def get_name_history(self, issuer_id: str) -> list[IssuerNameVersion]:
        return list(self._name_history.get(issuer_id, []))
