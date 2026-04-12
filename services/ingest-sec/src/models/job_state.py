from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class JobState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    FINISHED = "finished"


@dataclass(frozen=True)
class JobRecord:
    job_id: str
    source_type: str
    state: JobState
    checkpoint: int
    retry_count: int
    last_error: str | None
    started_at: datetime | None
    finished_at: datetime | None
