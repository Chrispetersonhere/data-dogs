from __future__ import annotations

from copy import deepcopy

from src.jobs.submissions_backfill import SubmissionsBackfillJob
from src.storage.job_store import InMemoryJobStore
from src.storage.raw_store import InMemoryRawStore


def _sample_submission(cik: str, accession_prefix: str) -> dict:
    return {
        "cik": cik,
        "filings": {
            "recent": {
                "accessionNumber": [f"{accession_prefix}-000001", f"{accession_prefix}-000002"],
                "filingDate": ["2024-01-10", "2024-02-15"],
                "form": ["10-K", "8-K"],
                "primaryDocument": ["annual.htm", "current.htm"],
                "primaryDocDescription": ["Annual report", "Current report"],
            }
        },
    }


def test_submissions_backfill_rerun_is_idempotent_and_separates_raw_vs_parsed_layers() -> None:
    issuers = ["0000320193", "0000789019"]
    responses = {
        issuers[0]: _sample_submission(issuers[0], "0000320193-24"),
        issuers[1]: _sample_submission(issuers[1], "0000789019-24"),
    }

    fetch_calls: list[str] = []

    def fetcher(cik: str) -> dict:
        fetch_calls.append(cik)
        return deepcopy(responses[cik])

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()

    job = SubmissionsBackfillJob(
        job_id="submissions-backfill-day9",
        issuers=issuers,
        fetcher=fetcher,
        job_store=job_store,
        raw_store=raw_store,
    )

    first_result = job.run()

    assert first_result.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 2
    assert len(raw_store.staging_filing_headers) == 4
    assert raw_store.checkpoints["submissions-backfill-day9"] == set(issuers)

    for artifact in raw_store.raw_artifacts.values():
        assert artifact.source_url.startswith("https://data.sec.gov/submissions/CIK")
        assert artifact.checksum_sha256
        assert artifact.fetch_timestamp
        assert artifact.parser_version == "submissions_parser/v1"
        assert artifact.job_id == "submissions-backfill-day9"
        assert artifact.payload_json.startswith("{")

    for row in raw_store.staging_filing_headers:
        assert "raw_checksum_sha256" in row
        assert "payload_json" not in row

    # Rerun must be idempotent: no duplicate raw artifacts or staged headers.
    second_result = job.run()

    assert second_result.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 2
    assert len(raw_store.staging_filing_headers) == 4
    assert fetch_calls == issuers
