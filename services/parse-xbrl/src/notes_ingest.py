from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _stable_json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def _require_non_empty_text(*, value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"missing required non-empty field: {field_name}")
    return value.strip()


@dataclass(frozen=True)
class NoteArtifact:
    artifact_checksum_sha256: str
    filing_accession: str
    issuer_cik: str
    note_type: str
    source_uri: str
    parser_version: str
    discovered_at: str
    content_json: str


class InMemoryNotesArtifactStore:
    """In-memory note artifact store that keeps source linkage explicit and auditable."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._artifacts_by_checksum: dict[str, NoteArtifact] = {}
        self._artifact_links: list[dict[str, str]] = []
        self._link_keys: set[tuple[str, str, str]] = set()

    @property
    def artifacts_by_checksum(self) -> dict[str, NoteArtifact]:
        return self._artifacts_by_checksum

    @property
    def artifact_links(self) -> list[dict[str, str]]:
        return self._artifact_links

    def store_note_artifact(
        self,
        *,
        filing_accession: str,
        issuer_cik: str,
        note_type: str,
        source_uri: str,
        content: dict[str, Any],
        parser_version: str,
    ) -> NoteArtifact:
        filing_accession = _require_non_empty_text(value=filing_accession, field_name="filing_accession")
        issuer_cik = _require_non_empty_text(value=issuer_cik, field_name="issuer_cik")
        note_type = _require_non_empty_text(value=note_type, field_name="note_type")
        source_uri = _require_non_empty_text(value=source_uri, field_name="source_uri")

        content_json = _stable_json(content)
        checksum_material = {
            "filing_accession": filing_accession,
            "issuer_cik": issuer_cik,
            "note_type": note_type,
            "source_uri": source_uri,
            "content": content,
        }
        artifact_checksum_sha256 = hashlib.sha256(
            _stable_json(checksum_material).encode("utf-8")
        ).hexdigest()

        with self._lock:
            artifact = self._artifacts_by_checksum.get(artifact_checksum_sha256)
            if artifact is None:
                artifact = NoteArtifact(
                    artifact_checksum_sha256=artifact_checksum_sha256,
                    filing_accession=filing_accession,
                    issuer_cik=issuer_cik,
                    note_type=note_type,
                    source_uri=source_uri,
                    parser_version=parser_version,
                    discovered_at=_utc_now_iso(),
                    content_json=content_json,
                )
                self._artifacts_by_checksum[artifact_checksum_sha256] = artifact

            link_key = (artifact_checksum_sha256, filing_accession, issuer_cik)
            if link_key not in self._link_keys:
                self._link_keys.add(link_key)
                self._artifact_links.append(
                    {
                        "artifact_checksum_sha256": artifact_checksum_sha256,
                        "filing_accession": filing_accession,
                        "issuer_cik": issuer_cik,
                        "linked_at": _utc_now_iso(),
                    }
                )

            return artifact


def ingest_note_artifacts(
    *,
    filing_accession: str,
    issuer_cik: str,
    artifacts: list[dict[str, Any]],
    store: InMemoryNotesArtifactStore,
    parser_version: str = "day24-notes-v1",
) -> dict[str, Any]:
    filing_accession = _require_non_empty_text(value=filing_accession, field_name="filing_accession")
    issuer_cik = _require_non_empty_text(value=issuer_cik, field_name="issuer_cik")

    artifact_count_before = len(store.artifacts_by_checksum)
    link_count_before = len(store.artifact_links)
    stored_checksums: list[str] = []
    for artifact in artifacts:
        note_type = _require_non_empty_text(value=artifact.get("note_type"), field_name="note_type")
        source_uri = _require_non_empty_text(value=artifact.get("source_uri"), field_name="source_uri")

        stored = store.store_note_artifact(
            filing_accession=filing_accession,
            issuer_cik=issuer_cik,
            note_type=note_type,
            source_uri=source_uri,
            content=artifact,
            parser_version=parser_version,
        )
        stored_checksums.append(stored.artifact_checksum_sha256)

    artifact_count_after = len(store.artifacts_by_checksum)
    link_count_after = len(store.artifact_links)

    return {
        "filing_accession": filing_accession,
        "issuer_cik": issuer_cik,
        "stored_count": artifact_count_after - artifact_count_before,
        "linked_count": link_count_after - link_count_before,
        "processed_count": len(stored_checksums),
        "artifact_checksums": stored_checksums,
    }
