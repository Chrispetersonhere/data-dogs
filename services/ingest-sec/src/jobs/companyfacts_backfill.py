from __future__ import annotations

from typing import Any, Callable

from ..jobs.base import BaseIngestionJob
from ..parsers.companyfacts_parser import parse_companyfacts_metadata
from ..storage.job_store import InMemoryJobStore
from ..storage.raw_store import InMemoryRawStore

CompanyFactsFetcher = Callable[[str], dict[str, Any]]


class CompanyFactsBackfillJob(BaseIngestionJob[str]):
    def __init__(
        self,
        *,
        job_id: str,
        issuers: list[str],
        fetcher: CompanyFactsFetcher,
        job_store: InMemoryJobStore,
        raw_store: InMemoryRawStore,
        parser_version: str = "companyfacts_parser/v1",
    ) -> None:
        super().__init__(job_id=job_id, store=job_store)
        self._issuers = list(issuers)
        self._fetcher = fetcher
        self._raw_store = raw_store
        self._parser_version = parser_version
        self._staged_metadata_by_cik: dict[str, dict[str, Any]] = {}

    @property
    def source_type(self) -> str:
        return "sec_companyfacts"

    @property
    def staged_metadata(self) -> list[dict[str, Any]]:
        return list(self._staged_metadata_by_cik.values())

    def load_units(self) -> list[str]:
        return list(self._issuers)

    def process_unit(self, unit: str, index: int) -> None:
        cik = unit
        source_url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik.zfill(10)}.json"
        payload = self._fetcher(cik)

        artifact = self._raw_store.store_raw_submission(
            cik=cik,
            source_url=source_url,
            submission_json=payload,
            parser_version=self._parser_version,
            job_id=self.job_id,
        )

        metadata = parse_companyfacts_metadata(cik=cik, payload=payload, raw_checksum=artifact.checksum_sha256)
        self._staged_metadata_by_cik[cik] = metadata
        self._raw_store.persist_checkpoint(job_id=self.job_id, cik=cik)
