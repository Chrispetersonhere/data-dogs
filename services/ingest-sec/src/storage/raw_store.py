from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class RawArtifact:
    source_url: str
    accession: str
    fetch_timestamp: str
    checksum_sha256: str
    parser_version: str
    job_id: str
    cik: str
    payload_json: str


class InMemoryRawStore:
    """Separate raw artifact and parsed staging storage for local backfill runs."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._raw_by_checksum: dict[str, RawArtifact] = {}
        self._staging_filing_headers: list[dict[str, str]] = []
        self._staging_header_keys: set[tuple[str, str]] = set()
        self._checkpoints: dict[str, set[str]] = {}

    @property
    def raw_artifacts(self) -> dict[str, RawArtifact]:
        return self._raw_by_checksum

    @property
    def staging_filing_headers(self) -> list[dict[str, str]]:
        return self._staging_filing_headers

    @property
    def checkpoints(self) -> dict[str, set[str]]:
        return self._checkpoints

    def store_raw_submission(
        self,
        *,
        cik: str,
        source_url: str,
        submission_json: dict[str, Any],
        parser_version: str,
        job_id: str,
    ) -> RawArtifact:
        payload_json = json.dumps(submission_json, sort_keys=True, separators=(",", ":"))
        checksum_sha256 = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

        filings_recent = submission_json.get("filings", {}).get("recent", {})
        accessions = filings_recent.get("accessionNumber", []) or []
        accession = str(accessions[0]) if accessions else ""

        with self._lock:
            existing = self._raw_by_checksum.get(checksum_sha256)
            if existing is not None:
                return existing

            artifact = RawArtifact(
                source_url=source_url,
                accession=accession,
                fetch_timestamp=_utc_now_iso(),
                checksum_sha256=checksum_sha256,
                parser_version=parser_version,
                job_id=job_id,
                cik=cik,
                payload_json=payload_json,
            )
            self._raw_by_checksum[checksum_sha256] = artifact
            return artifact

    def stage_filing_headers(self, rows: list[dict[str, str]]) -> int:
        inserted = 0
        with self._lock:
            for row in rows:
                key = (row["cik"], row["accession_number"])
                if key in self._staging_header_keys:
                    continue
                self._staging_header_keys.add(key)
                self._staging_filing_headers.append(dict(row))
                inserted += 1
        return inserted

    def persist_checkpoint(self, *, job_id: str, cik: str) -> None:
        with self._lock:
            if job_id not in self._checkpoints:
                self._checkpoints[job_id] = set()
            self._checkpoints[job_id].add(cik)
