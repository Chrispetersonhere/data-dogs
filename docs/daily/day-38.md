# Day 38

## Filing detail page

Implemented the filing detail page at `/filings/[accession]` with direct SEC source traceability.

### Delivered
- Added filing detail API module: `apps/web/lib/api/filing-detail.ts`.
  - Resolves issuer CIK and accession.
  - Fetches SEC submissions JSON (`data.sec.gov`) and matches the filing row by accession.
  - Fetches filing `index.json` from SEC archives and maps linked documents.
  - Returns:
    - filing metadata
    - linked documents
    - provenance summary
    - available sections derived from SEC `items` when present
- Added filing detail page: `apps/web/app/filings/[accession]/page.tsx`.
  - Displays required metadata and linked-document list.
  - Includes explicit provenance links to raw SEC sources.
  - Keeps raw-source drilldown obvious (submissions JSON + filing index JSON/HTML).
  - Renders available sections list, with graceful fallback when none are present.
- Added acceptance coverage: `apps/web/tests/filing-detail.spec.ts`.
  - Verifies required filing-detail markup contracts.
  - Verifies section parsing and SEC archive URL composition.

### Data integrity
- Uses SEC sources only:
  - `https://data.sec.gov/submissions/CIK{issuer}.json`
  - `https://www.sec.gov/Archives/edgar/data/{cik}/{accessionNoDashes}/index.json`
- No placeholder synthetic filing content in output.

### Rollback rule check
- Filing detail retains raw-source drilldown links and explicit extracted-field provenance.
