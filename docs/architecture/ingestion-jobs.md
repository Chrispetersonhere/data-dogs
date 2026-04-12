# Ingestion Jobs Architecture (Day 8)

## Scope
This document defines a local, generic ingestion job framework for `services/ingest-sec`.

Included in scope:
- job identity (`job_id`)
- source classification (`source_type`)
- lifecycle state (`pending`, `running`, `failed`, `finished`)
- checkpoint progress (`checkpoint` as next unit index)
- retry accounting (`retry_count`)
- error tracking (`last_error`)
- execution timestamps (`started_at`, `finished_at`)
- explicit idempotent execution semantics
- resume-after-failure semantics

Out of scope:
- distributed queueing
- Celery
- orchestration systems beyond local process execution

## Core model
`JobRecord` is the canonical local state object with the following fields:
- `job_id`
- `source_type`
- `state`
- `checkpoint`
- `retry_count`
- `last_error`
- `started_at`
- `finished_at`

## Storage contract
`InMemoryJobStore` is the Day 8 local storage implementation.

Key transitions:
1. `create_or_get` initializes a new job at `pending` with checkpoint `0`.
2. `mark_running` sets state to `running` and captures first `started_at`.
3. `mark_progress` advances checkpoint after each successful unit write.
4. `mark_failed` sets `failed`, increments `retry_count`, and stores `last_error`.
5. `mark_finished` sets `finished`, clears `last_error`, and sets `finished_at`.

## Idempotency and resume semantics
- **Idempotent rerun:** if a job is already `finished`, `run()` returns immediately and performs no additional writes.
- **Resume after failure:** `run()` restarts from `checkpoint` (next unit index), so previously completed units are not reprocessed.
- **Duplicate-write protection:** because checkpoint advances only after successful unit processing, resumed jobs skip already-committed units under the framework contract.

## Testing contract
Day 8 acceptance test coverage in `test_jobs_base.py` verifies:
- lifecycle fields are populated as required,
- failed jobs can resume from checkpoint,
- resumed jobs do not duplicate writes,
- finished jobs are idempotent no-op on rerun.
