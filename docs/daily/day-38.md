# Day 38

## Filing detail page

Built the filing detail page at `/filings/[accession]` with full source traceability.

### Delivered
- Added `apps/web/lib/api/filing-detail.ts`:
  - `getFilingDetail(accession)` fetches filing metadata from SEC submissions API
  - Resolves linked documents from the EDGAR filing index JSON
  - Infers available sections for 10-K / 10-Q / 20-F form types
  - Returns a provenance summary with source URL, fetch method, and filing index link
- Added `apps/web/app/filings/[accession]/page.tsx`:
  - Filing metadata (accession, form type, filing date, acceptance date/time, issuer, CIK, primary document)
  - Linked documents table (filename, description, type, size, view-source link)
  - Provenance summary (source URL, fetched via, filing index raw-source link)
  - Available sections (inferred from form type when applicable)
  - Raw-source drilldown section with filing index and submissions JSON links
  - Error fallback with back-to-explorer link
- Added `apps/web/tests/filing-detail.spec.ts`:
  - Unit tests for `normalizeAccession` and `buildDocumentsFromIndex`
  - Markup acceptance tests for required text fragments
  - Negative tests for missing provenance, missing drilldown, and placeholder leakage

### Source traceability
- Every detail page links directly to the SEC filing index page and submissions JSON.
- Provenance summary section makes the data lineage explicit.
- Raw-source drilldown section preserved as a dedicated UI section.

### Data integrity
- All data sourced from SEC EDGAR APIs only (submissions + filing index).
- No mock or placeholder data in the rendered output.

### Rollback rule check
- Raw-source drilldown links remain present and functional.
- No compensation UI or screener UI touched.
