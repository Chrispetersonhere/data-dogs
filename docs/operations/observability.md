# Observability Operations Baseline

_Last updated: 2026-04-17 (Day 53)_

This baseline keeps observability lightweight and production-safe while preserving traceability requirements.

## Scope

- Structured logging for web + Python services.
- Request and job identifiers in log entries.
- Health-check path contract for web (`/healthz`).
- Error-boundary helper primitives for the web app.

## Structured log contract

Required fields:

- `timestamp`
- `event`
- `level`
- `logger` (Python services)
- `request_id` (Python) / `requestId` (web)
- `job_id` (Python) / `jobId` (web) when a job context exists

## Identifier propagation

### Web

Web helpers live in `apps/web/lib/observability/`:

- `buildObservabilityContext(headers)` reads:
  - `x-request-id`
  - `x-job-id`
- Missing request id is synthesized via `crypto.randomUUID()`.

### Services

`services/ingest-sec/src/logging.py` supports context binding:

- `bind_log_context(request_id=..., job_id=...)`
- `clear_log_context()`

Context ids are injected into every structured log line.

`id-master` and `parse-xbrl` now expose matching JSON formatter utilities so new service entrypoints can emit the same structured shape.

## Health checks

- Canonical web health-check path: `/healthz`.
- Monitoring baseline file: `infra/monitoring/healthchecks.yaml`.

## Error boundaries

Web error-boundary helpers:

- `toErrorBoundaryPayload(...)`
- `buildErrorBoundaryLog(...)`

These provide a user-safe payload and machine-parsable error event with request/job ids.

## Rollback rule

Revert observability changes if logs become noisy or unreadable.
