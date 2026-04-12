from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Sequence, TypeVar

from ..models.job_state import JobRecord, JobState
from ..storage.job_store import InMemoryJobStore

TUnit = TypeVar("TUnit")


class BaseIngestionJob(ABC, Generic[TUnit]):
    """Generic local ingestion job with checkpoint-based resume semantics."""

    def __init__(self, *, job_id: str, store: InMemoryJobStore) -> None:
        if not job_id.strip():
            raise ValueError("job_id must be non-empty")
        self.job_id = job_id
        self.store = store

    @property
    @abstractmethod
    def source_type(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def load_units(self) -> Sequence[TUnit]:
        raise NotImplementedError

    @abstractmethod
    def process_unit(self, unit: TUnit, index: int) -> None:
        raise NotImplementedError

    def run(self) -> JobRecord:
        current = self.store.create_or_get(job_id=self.job_id, source_type=self.source_type)

        # Explicit idempotency: once finished, reruns are no-op.
        if current.state == JobState.FINISHED:
            return current

        current = self.store.mark_running(self.job_id)
        units = self.load_units()

        start_index = max(0, current.checkpoint)
        if start_index > len(units):
            raise ValueError("checkpoint cannot exceed unit count")

        for idx in range(start_index, len(units)):
            unit = units[idx]
            try:
                self.process_unit(unit, idx)
            except Exception as exc:  # surface original exception after durable failed state
                self.store.mark_failed(self.job_id, error=str(exc))
                raise
            self.store.mark_progress(self.job_id, checkpoint=idx + 1)

        return self.store.mark_finished(self.job_id)
