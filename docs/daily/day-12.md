# Day 12 — Admin QA Dashboard

## Scope completed
- Added internal admin jobs page listing job state and linking directly to QA failures for each job.
- Added internal admin QA dashboard with filter controls for `jobId` and parser, backed by provenance ledger rows.
- Added failed artifact table and parser failure summary for operational triage.
- Added direct link from each failure row to artifact inspection path on `/admin/artifacts`.
- Added executable QA page tests (node test runner via `tsx`) that assert core dashboard markup and artifact-link presence.

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


## Windows verification notes
- If `pnpm exec ...` fails with `'sh' is not recognized`, run `pnpm config delete script-shell`, `pnpm config delete --location=user script-shell`, and `pnpm config delete --location=global script-shell`, then reopen PowerShell before reinstalling dependencies.
- Use `powershell -ExecutionPolicy Bypass -File .\scripts\windows\reset-node-modules.ps1` for cleanup instead of raw `Remove-Item`, because pnpm trees can have long/locked paths on Windows.
- If cleanup still cannot remove `node_modules`, rerun PowerShell as Administrator and run the cleanup script again.

- web test script now runs `tsx --test tests/*.spec.ts` so `pnpm --filter web test -- admin-qa.spec.ts` executes real assertions.
