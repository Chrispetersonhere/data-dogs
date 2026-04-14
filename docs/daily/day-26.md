# Day 26 - Company Overview Page

## Scope completed
- Added first real company overview page at `/company/[companyId]`.
- Added live backend data adapter that fetches SEC submissions JSON (no mock payloads).
- Page sections now include:
  - issuer metadata
  - identity history summary
  - filing count summary
  - latest filings summary
  - premium layout treatment
- Mapping/rules logic remains out of scope.

## Files touched
- `apps/web/app/company/[companyId]/page.tsx`
- `apps/web/lib/api/company.ts`
- `apps/web/tests/company-overview.spec.ts`
- `docs/daily/day-26.md`

## Acceptance tests
- `pnpm --filter web build`
- `pnpm --filter web test -- company-overview.spec.ts || pnpm --filter web test`
  - Note: current web test script uses `tests/*.spec.ts`, so targeted invocation still executes the suite.

## Guardrails respected
- No compensation UI changes.
- No screener UI changes.
- Uses live SEC backend fetch path and avoids placeholder/mock company payloads.
