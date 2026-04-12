from __future__ import annotations

from typing import Any, Callable

from ..jobs.base import BaseIngestionJob
from ..storage.job_store import InMemoryJobStore
from ..storage.raw_store import InMemoryRawStore

FramesFetcher = Callable[[str], dict[str, Any]]


class FramesBackfillJob(BaseIngestionJob[str]):
    def __init__(
        self,
        *,
        job_id: str,
        frame_keys: list[str],
        fetcher: FramesFetcher,
        job_store: InMemoryJobStore,
        raw_store: InMemoryRawStore,
        parser_version: str = "frames_parser/v1",
    ) -> None:
        super().__init__(job_id=job_id, store=job_store)
        self._frame_keys = list(frame_keys)
        self._fetcher = fetcher
        self._raw_store = raw_store
        self._parser_version = parser_version
        self._staged_metadata_by_frame: dict[str, dict[str, Any]] = {}

    @property
    def source_type(self) -> str:
        return "sec_frames"

    @property
    def staged_metadata(self) -> list[dict[str, Any]]:
        return list(self._staged_metadata_by_frame.values())

    def load_units(self) -> list[str]:
        return list(self._frame_keys)

    def process_unit(self, unit: str, index: int) -> None:
        frame_key = unit
        source_url = f"https://data.sec.gov/api/xbrl/frames/{frame_key}.json"
        payload = self._fetcher(frame_key)

        artifact = self._raw_store.store_raw_submission(
            cik=frame_key,
            source_url=source_url,
            submission_json=payload,
            parser_version=self._parser_version,
            job_id=self.job_id,
        )

        data_rows = payload.get("data", []) or []
        metadata = {
            "frame_key": str(payload.get("frame", frame_key)),
            "taxonomy": str(payload.get("taxonomy", "")),
            "unit": str(payload.get("unit", "")),
            "fact_count": len(data_rows),
            "raw_checksum_sha256": artifact.checksum_sha256,
        }
        self._staged_metadata_by_frame[frame_key] = metadata
        self._raw_store.persist_checkpoint(job_id=self.job_id, cik=frame_key)
