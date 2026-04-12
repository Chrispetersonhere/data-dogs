# Day 14 — Week-2 Stabilization

## Scope completed
- Inspected ingestion and admin tooling from days 8–13.
- Fixed naming confusion in admin parser filter typing and query parsing.
- Hardened fragile malformed-payload parsing path in submissions parser.
- Added malformed payload regression test for non-list `recent` fields.
- Wrote week-2 review summary.

## Files touched
- `apps/web/lib/api/admin.ts`
- `apps/web/app/admin/qa/page.tsx`
- `services/ingest-sec/src/parsers/submissions_parser.py`
- `services/ingest-sec/tests/test_malformed_payloads.py`
- `docs/weekly/week-2-review.md`
- `docs/daily/day-14.md`

## Verification commands
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`

## Notes
- No new product features or schema domains were added.
- Changes are cleanup/clarification and resilience hardening only.
