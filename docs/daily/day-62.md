# Day 62 - Compensation QA Interface

## Scope
- Added an internal-only admin compensation QA interface at `/admin/qa`.
- Added side-by-side raw proxy compensation table and parsed structured output table.
- Added discrepancy highlights to explicitly surface parse/total mismatches.
- Preserved provenance visibility: source URL, accession, fetch timestamp, checksum, parser version, and job id.
- Added acceptance-style markup tests for required layout and discrepancy visibility.

## Files touched
- `apps/web/app/admin/qa/page.tsx`
- `apps/web/lib/api/comp-qa.ts`
- `apps/web/tests/comp-qa.spec.ts`
- `docs/daily/day-62.md`

## Notes
- This is internal-only and still gated by `ADMIN_ENABLED === 'true'`.
- Public compensation pages and homepage are unchanged.
- Rollback rule honored: discrepancy signals are explicit and visually highlighted rather than suppressed.

## Verification
- `pnpm --filter web build`
- `pnpm --filter web test -- comp-qa.spec.ts || pnpm --filter web test`
