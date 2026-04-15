# Day 37

## Filing explorer UI

Implemented the filing explorer page with real SEC submissions data and no placeholder rows.

### Delivered
- Added `/filings` explorer page with:
  - search filters (`issuer`, `formType`, `dateFrom`, `dateTo`, `accession`)
  - quiet premium filings table
  - per-row drilldown links (filing index + primary document)
  - responsive layout behavior for filters and table overflow
- Added dedicated filings UI components under `packages/ui/src/components/filings`.
- Added filings explorer acceptance test coverage in `apps/web/tests/filings-page.spec.ts`.

### Data integrity
- Uses `queryFilings` from SEC submissions API (`data.sec.gov`) only.
- No mock or placeholder data used in the explorer output.

### Rollback rule check
- Explorer remains compact and uncluttered.
- No placeholder data added.
