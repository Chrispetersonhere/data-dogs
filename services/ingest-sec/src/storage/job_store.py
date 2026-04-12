from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock

from ..models.job_state import JobRecord, JobState


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryJobStore:
    """Simple local job store for ingestion job lifecycle state."""

    def __init__(self) -> None:
        self._records: dict[str, JobRecord] = {}
        self._lock = Lock()

    def create_or_get(self, *, job_id: str, source_type: str) -> JobRecord:
        with self._lock:
            record = self._records.get(job_id)
            if record is not None:
                return record

            created = JobRecord(
                job_id=job_id,
                source_type=source_type,
                state=JobState.PENDING,
                checkpoint=0,
                retry_count=0,
                last_error=None,
                started_at=None,
                finished_at=None,
            )
            self._records[job_id] = created
            return created

    def get(self, job_id: str) -> JobRecord:
        with self._lock:
            record = self._records.get(job_id)
            if record is None:
                raise KeyError(f"Unknown job id: {job_id}")
            return record

    def _must_get_unlocked(self, job_id: str) -> JobRecord:
        record = self._records.get(job_id)
        if record is None:
            raise KeyError(f"Unknown job id: {job_id}")
        return record

    def mark_running(self, job_id: str) -> JobRecord:
        with self._lock:
            current = self._must_get_unlocked(job_id)
            started_at = current.started_at or utc_now()
            updated = JobRecord(
                job_id=current.job_id,
                source_type=current.source_type,
                state=JobState.RUNNING,
                checkpoint=current.checkpoint,
                retry_count=current.retry_count,
                last_error=None,
                started_at=started_at,
                finished_at=None,
            )
            self._records[job_id] = updated
            return updated

    def mark_progress(self, job_id: str, *, checkpoint: int) -> JobRecord:
        with self._lock:
            current = self._must_get_unlocked(job_id)
            updated = JobRecord(
                job_id=current.job_id,
                source_type=current.source_type,
                state=current.state,
                checkpoint=checkpoint,
                retry_count=current.retry_count,
                last_error=current.last_error,
                started_at=current.started_at,
                finished_at=current.finished_at,
            )
            self._records[job_id] = updated
            return updated

    def mark_failed(self, job_id: str, *, error: str) -> JobRecord:
        with self._lock:
            current = self._must_get_unlocked(job_id)
            updated = JobRecord(
                job_id=current.job_id,
                source_type=current.source_type,
                state=JobState.FAILED,
                checkpoint=current.checkpoint,
                retry_count=current.retry_count + 1,
                last_error=error,
                started_at=current.started_at,
                finished_at=None,
            )
            self._records[job_id] = updated
            return updated

    def mark_finished(self, job_id: str) -> JobRecord:
        with self._lock:
            current = self._must_get_unlocked(job_id)
            updated = JobRecord(
                job_id=current.job_id,
                source_type=current.source_type,
                state=JobState.FINISHED,
                checkpoint=current.checkpoint,
                retry_count=current.retry_count,
                last_error=None,
                started_at=current.started_at,
                finished_at=utc_now(),
            )
            self._records[job_id] = updated
            return updated
