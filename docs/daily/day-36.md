# Day 36

## Scope
- Built filings explorer backend query layer with stable/minimal filter contract.
- Implemented required filters:
  - issuer
  - form type
  - date range
  - accession
- Added focused API-level tests for normalization and combined-filter behavior.

## Files touched
- `apps/web/lib/api/filings.ts`
- `packages/schemas/src/api/filings.ts`
- `apps/web/tests/filings-api.spec.ts`
- `docs/daily/day-36.md`

## Contract notes
- Filter contract is strict and explicit (`dateFrom/dateTo` must be YYYY-MM-DD).
- Query layer returns normalized filter metadata and filtered filing rows.
- No UI route or statement rendering changes.

## Acceptance
```bash
pnpm --filter web test -- filings-api.spec.ts || pnpm --filter web test
pnpm --filter web build
```
