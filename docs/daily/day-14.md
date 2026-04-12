# Day 14 — Week 2 Stabilization

## Scope completed
- Inspected ingestion and admin tooling delivered across Days 8–13.
- Removed naming confusion in ingest raw artifact storage APIs to align with non-submissions payloads.
- Hardened admin QA artifact-path derivation and parser-filter normalization to avoid fragile parsing and invalid filter values.
- Added Week 2 review document summarizing outcomes, cleanup, and follow-up focus.

## Files touched
- `services/ingest-sec/src/storage/raw_store.py`
- `services/ingest-sec/src/jobs/submissions_backfill.py`
- `services/ingest-sec/src/jobs/companyfacts_backfill.py`
- `services/ingest-sec/src/jobs/frames_backfill.py`
- `apps/web/lib/api/admin.ts`
- `apps/web/app/admin/qa/page.tsx`
- `docs/weekly/week-2-review.md`
- `docs/daily/day-14.md`

## Cleanup notes
- `store_raw_submission` was renamed to `store_raw_artifact` because the store now handles submissions, companyfacts, and frames payloads.
- `persist_checkpoint(..., cik=...)` was generalized to `persist_checkpoint(..., unit_key=...)` to match frame-key checkpoints without overloading CIK terminology.
- QA filter parsing now accepts only known parser values (`xbrl`, `proxy`, `sec`) and drops unknown input.
- Artifact path extraction now uses URL parsing first and falls back safely for malformed input.

## Verification commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
