# Day 59 — Summary Compensation Table parser

## Scope
Implemented a dedicated parser for Summary Compensation Table (SCT) rows in the proxy parser service with strict missing-value handling and row-level traceability.

## What changed
- Added `services/parse-proxy/src/parse_sct.py`.
  - Parses SCT header columns into canonical required outputs:
    - salary
    - bonus
    - stock awards
    - option awards
    - non-equity
    - pension change
    - other comp
    - total
  - Preserves raw row provenance (`raw_row_text`, `raw_row_line`) for every parsed row.
  - Uses conservative parsing rules; missing markers (`--`, `-`, blank, `N/A`) remain `None`.
  - Does not infer or backfill values.

- Added `services/parse-proxy/tests/test_parse_sct.py`.
  - Verifies extraction of all required output fields.
  - Verifies raw-row references are preserved.
  - Verifies parser does not guess/fill missing values.

## Out of scope (intentionally unchanged)
- Grants parsing.
- Governance parsing.

## Verification
- `pytest services/parse-proxy/tests/test_parse_sct.py -q`

## Auditability and provenance
- Parser output keeps source metadata fields (`source_url`, `accession`) and parser version (`parse-proxy.parse_sct.v1`).
- Every transformed row keeps a direct line-level reference back to the raw text block.
