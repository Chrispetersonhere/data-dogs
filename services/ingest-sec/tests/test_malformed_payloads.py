from __future__ import annotations

from src.jobs.submissions_backfill import SubmissionsBackfillJob
from src.storage.job_store import InMemoryJobStore
from src.storage.raw_store import InMemoryRawStore


def test_malformed_payload_missing_recent_section_is_handled_without_crash() -> None:
    calls: list[str] = []

    def fetcher(cik: str) -> dict:
        calls.append(cik)
        # Missing filings.recent payload keys: parser should produce zero staged rows.
        return {'cik': cik, 'filings': {}}

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()
    job = SubmissionsBackfillJob(
        job_id='malformed-day13-1',
        issuers=['0000320193'],
        fetcher=fetcher,
        job_store=job_store,
        raw_store=raw_store,
    )

    result = job.run()

    assert result.state.value == 'finished'
    assert len(raw_store.raw_artifacts) == 1
    assert raw_store.staging_filing_headers == []
    assert calls == ['0000320193']


def test_malformed_payload_rerun_does_not_duplicate_raw_or_staged_rows() -> None:
    def fetcher(cik: str) -> dict:
        return {
            'cik': cik,
            'filings': {
                'recent': {
                    'accessionNumber': [],
                    'filingDate': ['2024-01-10'],
                }
            },
        }

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()
    job = SubmissionsBackfillJob(
        job_id='malformed-day13-2',
        issuers=['0000789019'],
        fetcher=fetcher,
        job_store=job_store,
        raw_store=raw_store,
    )

    first = job.run()
    second = job.run()

    assert first.state.value == 'finished'
    assert second.state.value == 'finished'
    assert len(raw_store.raw_artifacts) == 1
    assert raw_store.staging_filing_headers == []
