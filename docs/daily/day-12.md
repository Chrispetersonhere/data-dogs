# Day 12 — Admin QA Dashboard

## Scope completed
- Added internal admin jobs page listing job state and linking directly to QA failures for each job.
- Added internal admin QA dashboard with filter controls for `jobId` and parser, backed by provenance ledger rows.
- Added failed artifact table and parser failure summary for operational triage.
- Added direct link from each failure row to artifact inspection path on `/admin/artifacts`.
- Added a QA page spec helper that asserts core dashboard markup and artifact-link presence.

## Files touched
- `apps/web/app/admin/jobs/page.tsx`
- `apps/web/app/admin/qa/page.tsx`
- `apps/web/lib/api/admin.ts`
- `apps/web/tests/admin-qa.spec.ts`
- `docs/daily/day-12.md`

## Verification commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test -- admin-qa.spec.ts || pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/parse-proxy/tests -q`
- `pytest services/id-master/tests -q`
- `pytest services/market-data/tests -q`

## Notes
- Admin flow remains internal-only via `ADMIN_ENABLED=true` gate.
- QA dashboard intentionally exposes parser errors and artifact paths without suppressing failure detail.
- Admin API now derives jobs/failures from provenance ledger rows to avoid detached mock datasets while preserving fields (`sourceUrl`, `accession`, `fetchTimestamp`, `checksum`, `parserVersion`, `jobId`).
