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


@dataclass(frozen=True)
class RawDatasetArtifact:
    dataset_name: str
    source_url: str
    period_start: str
    period_end: str
    period_type: str
    fetch_timestamp: str
    checksum_sha256: str
    parser_version: str
    payload_json: str


class InMemoryFsDatasetStore:
    """In-memory raw + staging store with strict layer separation."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._raw_by_checksum: dict[str, RawDatasetArtifact] = {}
        self._staging_rows: list[dict[str, Any]] = []
        self._staging_keys: set[tuple[str, str, str, str, str, str, str]] = set()

    @property
    def raw_artifacts(self) -> dict[str, RawDatasetArtifact]:
        return self._raw_by_checksum

    @property
    def staging_rows(self) -> list[dict[str, Any]]:
        return self._staging_rows

    def store_raw_dataset(
        self,
        *,
        dataset_name: str,
        source_url: str,
        period_start: str,
        period_end: str,
        period_type: str,
        payload: list[dict[str, Any]],
        parser_version: str,
    ) -> RawDatasetArtifact:
        # Include ingest envelope metadata in checksum material so a period/context
        # change cannot collapse into an existing raw artifact by payload rows alone.
        checksum_material = {
            "dataset_name": dataset_name,
            "source_url": source_url,
            "period_start": period_start,
            "period_end": period_end,
            "period_type": period_type,
            "rows": payload,
        }
        payload_json = _stable_json(payload)
        checksum_payload = _stable_json(checksum_material)
        checksum_sha256 = hashlib.sha256(checksum_payload.encode("utf-8")).hexdigest()

        with self._lock:
            existing = self._raw_by_checksum.get(checksum_sha256)
            if existing is not None:
                return existing

            artifact = RawDatasetArtifact(
                dataset_name=dataset_name,
                source_url=source_url,
                period_start=period_start,
                period_end=period_end,
                period_type=period_type,
                fetch_timestamp=_utc_now_iso(),
                checksum_sha256=checksum_sha256,
                parser_version=parser_version,
                payload_json=payload_json,
            )
            self._raw_by_checksum[checksum_sha256] = artifact
            return artifact

    def stage_statement_rows(
        self,
        *,
        dataset_name: str,
        period_start: str,
        period_end: str,
        period_type: str,
        raw_checksum_sha256: str,
        rows: list[dict[str, Any]],
    ) -> int:
        inserted = 0
        with self._lock:
            for row in rows:
                issuer_cik = str(row.get("issuer_cik", ""))
                statement_code = str(row.get("statement_code", ""))
                line_item = str(row.get("line_item", ""))

                key = (
                    dataset_name,
                    issuer_cik,
                    statement_code,
                    line_item,
                    period_start,
                    period_end,
                    period_type,
                )
                if key in self._staging_keys:
                    continue

                self._staging_keys.add(key)
                self._staging_rows.append(
                    {
                        "dataset_name": dataset_name,
                        "issuer_cik": issuer_cik,
                        "statement_code": statement_code,
                        "line_item": line_item,
                        "amount": row.get("amount"),
                        "unit": row.get("unit"),
                        "period_start": period_start,
                        "period_end": period_end,
                        "period_type": period_type,
                        "raw_checksum_sha256": raw_checksum_sha256,
                    }
                )
                inserted += 1

        return inserted


def ingest_fs_dataset(
    *,
    dataset_name: str,
    source_url: str,
    period_start: str,
    period_end: str,
    period_type: str,
    rows: list[dict[str, Any]],
    store: InMemoryFsDatasetStore,
    parser_version: str = "day23-fs-dataset-v1",
) -> dict[str, Any]:
    """Store immutable raw dataset then stage parsed rows for downstream mapping."""

    raw_artifact = store.store_raw_dataset(
        dataset_name=dataset_name,
        source_url=source_url,
        period_start=period_start,
        period_end=period_end,
        period_type=period_type,
        payload=rows,
        parser_version=parser_version,
    )

    staged_count = store.stage_statement_rows(
        dataset_name=dataset_name,
        period_start=period_start,
        period_end=period_end,
        period_type=period_type,
        raw_checksum_sha256=raw_artifact.checksum_sha256,
        rows=rows,
    )

    return {
        "raw_checksum_sha256": raw_artifact.checksum_sha256,
        "staged_count": staged_count,
        "period_start": period_start,
        "period_end": period_end,
        "period_type": period_type,
    }
