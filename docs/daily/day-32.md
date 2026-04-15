# Day 32

## Scope
- Built annual statement builder logic for parse-xbrl with a focused metric set covering income statement, balance sheet, and cash flow.
- Added a new annual financials company page route with premium table UX and real-data-only fetching from SEC Company Facts.
- Added targeted web test coverage to ensure annual renderer sections are present and quarterly/TTM leakage is blocked.

## Files touched
- `services/parse-xbrl/src/statement_builder_annual.py`
- `apps/web/app/company/[companyId]/financials/page.tsx`
- `apps/web/tests/financials-annual.spec.ts`
- `docs/daily/day-32.md`

## Acceptance
```bash
pnpm --filter web build
pnpm --filter web test -- financials-annual.spec.ts || pnpm --filter web test
pytest services/parse-xbrl/tests -q
```
