from __future__ import annotations

from copy import deepcopy

import pytest

from src.jobs.companyfacts_backfill import CompanyFactsBackfillJob
from src.jobs.frames_backfill import FramesBackfillJob
from src.storage.job_store import InMemoryJobStore
from src.storage.raw_store import InMemoryRawStore


def _companyfacts_payload(cik: str) -> dict:
    return {
        "cik": cik,
        "entityName": "Example Corp",
        "facts": {
            "us-gaap": {
                "Revenues": {
                    "units": {
                        "USD": [
                            {"end": "2024-12-31", "val": 1000},
                        ]
                    }
                }
            }
        },
    }


def _frames_payload(frame_key: str) -> dict:
    return {
        "frame": frame_key,
        "taxonomy": "us-gaap",
        "unit": "USD",
        "data": [
            {"cik": "0000320193", "val": 1000},
            {"cik": "0000789019", "val": 2000},
        ],
    }


def test_companyfacts_backfill_resume_and_rerun_are_duplicate_safe() -> None:
    issuers = ["0000320193", "0000789019"]
    payloads = {cik: _companyfacts_payload(cik) for cik in issuers}
    fail_once = {issuers[1]: True}
    calls: list[str] = []

    def fetcher(cik: str) -> dict:
        calls.append(cik)
        if fail_once.get(cik):
            fail_once[cik] = False
            raise RuntimeError("transient fetch error")
        return deepcopy(payloads[cik])

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()
    job = CompanyFactsBackfillJob(
        job_id="companyfacts-day10",
        issuers=issuers,
        fetcher=fetcher,
        job_store=job_store,
        raw_store=raw_store,
    )

    with pytest.raises(RuntimeError):
        job.run()

    assert len(raw_store.raw_artifacts) == 1
    assert len(job.staged_metadata) == 1
    assert raw_store.checkpoints["companyfacts-day10"] == {issuers[0]}

    resumed = job.run()
    assert resumed.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 2
    assert len(job.staged_metadata) == 2

    # Idempotent rerun (finished job should no-op)
    rerun = job.run()
    assert rerun.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 2
    assert len(job.staged_metadata) == 2

    for metadata in job.staged_metadata:
        assert "raw_checksum_sha256" in metadata
        assert "payload_json" not in metadata


def test_frames_backfill_rerun_is_idempotent_and_layers_separate() -> None:
    frame_keys = ["us-gaap/Revenues/USD/CY2024Q4I"]
    payloads = {frame_keys[0]: _frames_payload(frame_keys[0])}

    def fetcher(frame_key: str) -> dict:
        return deepcopy(payloads[frame_key])

    job_store = InMemoryJobStore()
    raw_store = InMemoryRawStore()
    job = FramesBackfillJob(
        job_id="frames-day10",
        frame_keys=frame_keys,
        fetcher=fetcher,
        job_store=job_store,
        raw_store=raw_store,
    )

    first = job.run()
    second = job.run()

    assert first.state.value == "finished"
    assert second.state.value == "finished"
    assert len(raw_store.raw_artifacts) == 1
    assert len(job.staged_metadata) == 1
    assert raw_store.checkpoints["frames-day10"] == set(frame_keys)

    staged = job.staged_metadata[0]
    assert staged["frame_key"] == frame_keys[0]
    assert "raw_checksum_sha256" in staged
    assert "payload_json" not in staged
