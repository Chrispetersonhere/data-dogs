from __future__ import annotations

from typing import Callable

from ..jobs.base import BaseIngestionJob
from ..parsers.submissions_parser import parse_submission_headers
from ..storage.job_store import InMemoryJobStore
from ..storage.raw_store import InMemoryRawStore

SubmissionsFetcher = Callable[[str], dict]


class SubmissionsBackfillJob(BaseIngestionJob[str]):
    def __init__(
        self,
        *,
        job_id: str,
        issuers: list[str],
        fetcher: SubmissionsFetcher,
        job_store: InMemoryJobStore,
        raw_store: InMemoryRawStore,
        parser_version: str = "submissions_parser/v1",
    ) -> None:
        super().__init__(job_id=job_id, store=job_store)
        self._issuers = list(issuers)
        self._fetcher = fetcher
        self._raw_store = raw_store
        self._parser_version = parser_version

    @property
    def source_type(self) -> str:
        return "sec_submissions"

    def load_units(self) -> list[str]:
        return list(self._issuers)

    def process_unit(self, unit: str, index: int) -> None:
        cik = unit
        source_url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"

        submission_json = self._fetcher(cik)
        artifact = self._raw_store.store_raw_submission(
            cik=cik,
            source_url=source_url,
            submission_json=submission_json,
            parser_version=self._parser_version,
            job_id=self.job_id,
        )

        staging_rows = parse_submission_headers(
            cik=cik,
            submission_json=submission_json,
            raw_checksum=artifact.checksum_sha256,
        )
        self._raw_store.stage_filing_headers(staging_rows)
        self._raw_store.persist_checkpoint(job_id=self.job_id, cik=cik)
