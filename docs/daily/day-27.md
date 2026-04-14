# Day 27 - Fact Reconciliation QA View

## Scope completed
- Added admin-only fact reconciliation QA view under `/admin/qa`.
- Added API adapter that fetches live SEC companyfacts data and prepares:
  - raw fact rows
  - normalized candidates
  - discrepancy rows
- Made ambiguity explicit by tagging multi-unit concepts as `ambiguous` and surfacing `unit_conflict` discrepancies.
- Kept scope strictly admin QA (no public route changes, no styling experiments).

## Files touched
- `apps/web/app/admin/qa/page.tsx`
- `apps/web/lib/api/qa.ts`
- `apps/web/tests/qa-facts.spec.ts`
- `docs/daily/day-27.md`

## Acceptance tests
- `pnpm --filter web build`
- `pnpm --filter web test -- qa-facts.spec.ts || pnpm --filter web test`
  - Note: current web test script uses `tests/*.spec.ts`, so targeted invocation still executes the suite.

## Guardrails respected
- Admin-only gate remains in place.
- QA view surfaces discrepancies and ambiguity rather than collapsing them into a single definitive mapping.
