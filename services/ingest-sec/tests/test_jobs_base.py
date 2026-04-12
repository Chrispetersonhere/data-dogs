from __future__ import annotations

from dataclasses import dataclass

import pytest

from src.jobs.base import BaseIngestionJob
from src.models.job_state import JobState
from src.storage.job_store import InMemoryJobStore


@dataclass
class _FailureControl:
    fail_once_at_index: int | None = None
    did_fail: bool = False


class _ExampleIngestionJob(BaseIngestionJob[str]):
    def __init__(
        self,
        *,
        job_id: str,
        store: InMemoryJobStore,
        units: list[str],
        sink: list[str],
        failure: _FailureControl,
    ) -> None:
        super().__init__(job_id=job_id, store=store)
        self._units = units
        self._sink = sink
        self._failure = failure

    @property
    def source_type(self) -> str:
        return "sec_submissions"

    def load_units(self) -> list[str]:
        return list(self._units)

    def process_unit(self, unit: str, index: int) -> None:
        if (
            self._failure.fail_once_at_index is not None
            and index == self._failure.fail_once_at_index
            and not self._failure.did_fail
        ):
            self._failure.did_fail = True
            raise RuntimeError(f"transient failure at index {index}")
        self._sink.append(unit)


def test_job_tracks_lifecycle_and_required_fields() -> None:
    store = InMemoryJobStore()
    sink: list[str] = []
    job = _ExampleIngestionJob(
        job_id="job-lifecycle-1",
        store=store,
        units=["u1", "u2"],
        sink=sink,
        failure=_FailureControl(),
    )

    result = job.run()

    assert sink == ["u1", "u2"]
    assert result.job_id == "job-lifecycle-1"
    assert result.source_type == "sec_submissions"
    assert result.state == JobState.FINISHED
    assert result.checkpoint == 2
    assert result.retry_count == 0
    assert result.last_error is None
    assert result.started_at is not None
    assert result.finished_at is not None


def test_job_resumes_after_failure_without_duplicate_writes() -> None:
    store = InMemoryJobStore()
    sink: list[str] = []
    failure = _FailureControl(fail_once_at_index=1)
    job = _ExampleIngestionJob(
        job_id="job-resume-1",
        store=store,
        units=["a", "b", "c"],
        sink=sink,
        failure=failure,
    )

    with pytest.raises(RuntimeError):
        job.run()

    failed_record = store.get("job-resume-1")
    assert failed_record.state == JobState.FAILED
    assert failed_record.checkpoint == 1
    assert failed_record.retry_count == 1
    assert failed_record.last_error is not None
    assert sink == ["a"]

    resumed_record = job.run()

    # No duplicate "a" write after resume.
    assert sink == ["a", "b", "c"]
    assert resumed_record.state == JobState.FINISHED
    assert resumed_record.checkpoint == 3
    assert resumed_record.retry_count == 1
    assert resumed_record.last_error is None


def test_finished_job_is_idempotent_on_rerun() -> None:
    store = InMemoryJobStore()
    sink: list[str] = []
    job = _ExampleIngestionJob(
        job_id="job-idempotent-1",
        store=store,
        units=["x", "y"],
        sink=sink,
        failure=_FailureControl(),
    )

    first = job.run()
    second = job.run()

    assert first.state == JobState.FINISHED
    assert second.state == JobState.FINISHED
    assert sink == ["x", "y"]
