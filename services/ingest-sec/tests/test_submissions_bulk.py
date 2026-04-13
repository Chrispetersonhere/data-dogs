from __future__ import annotations

from copy import deepcopy

from src.jobs.submissions_bulk_backfill import SubmissionsBulkBackfillJob
from src.storage.job_store import InMemoryJobStore
from src.storage.raw_store import InMemoryRawStore


def _sample_recent_payload(cik: str, accession_prefix: str, archive_name: str) -> dict:
    return {
        "cik": cik,
        "filings": {
            "recent": {
                "accessionNumber": [f"{accession_prefix}-000001", f"{accession_prefix}-000002"],
                "filingDate": ["2024-01-10", "2024-02-15"],
                "form": ["10-K", "8-K"],
                "primaryDocument": ["annual.htm", "current.htm"],
                "primaryDocDescription": ["Annual report", "Current report"],
            },
            "files": [{"name": archive_name}],
        },
    }


def _sample_archive_payload(cik: str, accession_prefix: str) -> dict:
    return {
        "cik": cik,
        "filings": {
            "recent": {
                "accessionNumber": [f"{accession_prefix}-000010", f"{accession_prefix}-000011"],
                "filingDate": ["2023-05-12", "2023-08-10"],
                "form": ["10-Q", "8-K"],
                "primaryDocument": ["q1.htm", "event.htm"],
                "primaryDocDescription": ["Quarterly report", "Event report"],
            }
        },
    }


def test_submissions_bulk_backfill_ingests_recent_and_archive_with_dedupe() -> None:
    issuers = ["0000320193", "0000789019"]
    archive_names = {
        issuers[0]: "submissions-0000320193-2023.json",
        issuers[1]: "submissions-0000789019-2023.json",
    }

    latest_payloads = {
        issuers[0]: _sample_recent_payload(issuers[0], "0000320193-24", archive_names[issuers[0]]),
        issuers[1]: _sample_recent_payload(issuers[1], "0000789019-24", archive_names[issuers[1]]),
    }
    archive_payloads = {
        (issuers[0], archive_names[issuers[0]]): _sample_archive_payload(issuers[0], "0000320193-23"),
        (issuers[1], archive_names[issuers[1]]): _sample_archive_payload(issuers[1], "0000789019-23"),
    }

    latest_calls: list[str] = []
    archive_calls: list[tuple[str, str]] = []

    def fetch_latest(cik: str) -> dict:
        latest_calls.append(cik)
        return deepcopy(latest_payloads[cik])

    def fetch_archive(cik: str, archive_name: str) -> dict:
        archive_calls.append((cik, archive_name))
        return deepcopy(archive_payloads[(cik, archive_name)])

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()

    job = SubmissionsBulkBackfillJob(
        job_id="submissions-bulk-day22",
        issuers=issuers,
        fetch_latest=fetch_latest,
        fetch_archive=fetch_archive,
        job_store=job_store,
        raw_store=raw_store,
        partition_count=1,
        partition_index=0,
    )

    first_result = job.run()

    assert first_result.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 4
    assert len(raw_store.staging_filing_headers) == 8
    assert raw_store.checkpoints["submissions-bulk-day22"] == set(issuers)

    for artifact in raw_store.raw_artifacts.values():
        assert artifact.checksum_sha256
        assert artifact.fetch_timestamp
        assert artifact.job_id == "submissions-bulk-day22"
        assert artifact.parser_version == "submissions_parser/v1"
        assert artifact.payload_json.startswith("{")

    for row in raw_store.staging_filing_headers:
        assert "raw_checksum_sha256" in row
        assert "payload_json" not in row

    # A finished rerun is a no-op; dedupe remains intact.
    second_result = job.run()

    assert second_result.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 4
    assert len(raw_store.staging_filing_headers) == 8
    assert latest_calls == issuers
    assert archive_calls == [
        (issuers[0], archive_names[issuers[0]]),
        (issuers[1], archive_names[issuers[1]]),
    ]


def test_submissions_bulk_backfill_partitions_work_by_issuer() -> None:
    issuers = ["0000000001", "0000000002", "0000000003", "0000000004"]

    def fetch_latest(cik: str) -> dict:
        return _sample_recent_payload(cik, f"{cik}-24", f"submissions-{cik}-2023.json")

    def fetch_archive(cik: str, archive_name: str) -> dict:
        return _sample_archive_payload(cik, f"{cik}-23")

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()

    job = SubmissionsBulkBackfillJob(
        job_id="submissions-bulk-part-1of2",
        issuers=issuers,
        fetch_latest=fetch_latest,
        fetch_archive=fetch_archive,
        job_store=job_store,
        raw_store=raw_store,
        partition_count=2,
        partition_index=1,
    )

    result = job.run()
    assert result.state.value == "finished"

    expected_partition = {cik for cik in issuers if int(cik) % 2 == 1}
    assert raw_store.checkpoints["submissions-bulk-part-1of2"] == expected_partition

    observed_subject_keys = {artifact.subject_key for artifact in raw_store.raw_artifacts.values()}
    assert observed_subject_keys == expected_partition
