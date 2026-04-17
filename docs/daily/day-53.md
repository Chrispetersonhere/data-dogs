# Day 53 - Observability Foundation

Date: 2026-04-17

## What changed

- Added web observability foundation module under `apps/web/lib/observability/`:
  - request/job id context helpers
  - structured log entry builder/serializer
  - health-check path + health payload helper
  - error-boundary payload/log helpers
- Added monitoring baseline artifacts in `infra/monitoring/`.
- Upgraded `ingest-sec` logging to include bound request/job ids automatically.
- Added service-level logging modules for `id-master` and `parse-xbrl` with the same structured JSON shape.

## Acceptance criteria mapping

- **Health check path exists**: `HEALTHCHECK_PATH` constant is set to `/healthz` and monitored in `infra/monitoring/healthchecks.yaml`.
- **Logs include ids**: structured logging helpers include request id and optional job id fields; `ingest-sec` binds ids via context.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/id-master/tests -q`

## Risk / rollback

- If logging volume or readability degrades, revert this day’s observability commit.
