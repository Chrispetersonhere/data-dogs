from __future__ import annotations

from dataclasses import dataclass

import pytest

from src.jobs.base import BaseIngestionJob
from src.models.job_state import JobState
from src.storage.job_store import InMemoryJobStore


@dataclass
class _InterruptControl:
    fail_at_index: int | None = None
    did_fail: bool = False


class _ResumeJob(BaseIngestionJob[str]):
    def __init__(
        self,
        *,
        job_id: str,
        store: InMemoryJobStore,
        units: list[str],
        sink: list[str],
        interrupt: _InterruptControl,
    ) -> None:
        super().__init__(job_id=job_id, store=store)
        self._units = units
        self._sink = sink
        self._interrupt = interrupt

    @property
    def source_type(self) -> str:
        return 'sec_submissions'

    def load_units(self) -> list[str]:
        return list(self._units)

    def process_unit(self, unit: str, index: int) -> None:
        if (
            self._interrupt.fail_at_index is not None
            and index == self._interrupt.fail_at_index
            and not self._interrupt.did_fail
        ):
            self._interrupt.did_fail = True
            raise RuntimeError(f'interrupted at index {index}')
        self._sink.append(unit)


def test_interrupted_job_resume_continues_from_checkpoint_without_duplicate_writes() -> None:
    sink: list[str] = []
    store = InMemoryJobStore()
    interrupt = _InterruptControl(fail_at_index=2)
    job = _ResumeJob(
        job_id='resume-day13-1',
        store=store,
        units=['u1', 'u2', 'u3', 'u4'],
        sink=sink,
        interrupt=interrupt,
    )

    with pytest.raises(RuntimeError, match='interrupted at index 2'):
        job.run()

    failed = store.get('resume-day13-1')
    assert failed.state == JobState.FAILED
    assert failed.checkpoint == 2
    assert failed.retry_count == 1
    assert sink == ['u1', 'u2']

    resumed = job.run()

    assert resumed.state == JobState.FINISHED
    assert resumed.checkpoint == 4
    assert resumed.retry_count == 1
    assert sink == ['u1', 'u2', 'u3', 'u4']


def test_duplicate_rerun_protection_after_finish_is_idempotent() -> None:
    sink: list[str] = []
    store = InMemoryJobStore()
    job = _ResumeJob(
        job_id='resume-day13-2',
        store=store,
        units=['a', 'b'],
        sink=sink,
        interrupt=_InterruptControl(),
    )

    first = job.run()
    second = job.run()

    assert first.state == JobState.FINISHED
    assert second.state == JobState.FINISHED
    assert sink == ['a', 'b']
