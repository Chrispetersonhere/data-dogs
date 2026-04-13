from __future__ import annotations

from typing import Callable

from ..jobs.base import BaseIngestionJob
from ..parsers.submissions_parser import parse_submission_headers
from ..storage.job_store import InMemoryJobStore
from ..storage.raw_store import InMemoryRawStore

SubmissionsFetcher = Callable[[str], dict]
ArchiveFetcher = Callable[[str, str], dict]


class SubmissionsBulkBackfillJob(BaseIngestionJob[str]):
    """Bulk submissions backfill with archive-aware ingestion and partitioning."""

    def __init__(
        self,
        *,
        job_id: str,
        issuers: list[str],
        fetch_latest: SubmissionsFetcher,
        fetch_archive: ArchiveFetcher,
        job_store: InMemoryJobStore,
        raw_store: InMemoryRawStore,
        parser_version: str = "submissions_parser/v1",
        partition_count: int = 1,
        partition_index: int = 0,
    ) -> None:
        super().__init__(job_id=job_id, store=job_store)
        if partition_count < 1:
            raise ValueError("partition_count must be >= 1")
        if partition_index < 0 or partition_index >= partition_count:
            raise ValueError("partition_index must be in [0, partition_count)")

        self._issuers = list(issuers)
        self._fetch_latest = fetch_latest
        self._fetch_archive = fetch_archive
        self._raw_store = raw_store
        self._parser_version = parser_version
        self._partition_count = partition_count
        self._partition_index = partition_index

    @property
    def source_type(self) -> str:
        return "sec_submissions_bulk"

    def load_units(self) -> list[str]:
        if self._partition_count == 1:
            return list(self._issuers)

        return [
            cik
            for cik in self._issuers
            if (int(cik) % self._partition_count) == self._partition_index
        ]

    def process_unit(self, unit: str, index: int) -> None:
        cik = unit
        latest_source_url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
        latest_payload = self._fetch_latest(cik)
        self._stage_submission_payload(cik=cik, source_url=latest_source_url, payload=latest_payload)

        archive_files = latest_payload.get("filings", {}).get("files", []) or []
        for archive_info in archive_files:
            archive_name = str(archive_info.get("name", "")).strip()
            if not archive_name:
                continue
            archive_source_url = f"https://data.sec.gov/submissions/{archive_name}"
            archive_payload = self._fetch_archive(cik, archive_name)
            self._stage_submission_payload(cik=cik, source_url=archive_source_url, payload=archive_payload)

        self._raw_store.persist_checkpoint(job_id=self.job_id, unit_key=cik)

    def _stage_submission_payload(self, *, cik: str, source_url: str, payload: dict) -> None:
        artifact = self._raw_store.store_raw_artifact(
            subject_key=cik,
            source_url=source_url,
            payload=payload,
            parser_version=self._parser_version,
            job_id=self.job_id,
        )

        staging_rows = parse_submission_headers(
            cik=cik,
            submission_json=payload,
            raw_checksum=artifact.checksum_sha256,
        )
        self._raw_store.stage_filing_headers(staging_rows)
