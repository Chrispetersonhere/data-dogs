# Day 60 — Grants parser

## Scope
Implemented a dedicated grants parser in parse-proxy to capture award amounts where present, link each row to executive and period fields, and keep ambiguity explicit for audit-safe downstream handling.

## What changed
- Added `services/parse-proxy/src/parse_grants.py`.
  - Introduces `parse_grants_table` with parser version `parse-proxy.parse_grants.v1`.
  - Parses grants table rows conservatively into:
    - `executive` / `executive_candidates`
    - `period` / `period_candidates`
    - `award` / `award_candidates`
  - Preserves row provenance via `raw_row_text` and `raw_row_line`.
  - Keeps ambiguity explicit:
    - If multiple executive columns are present, `executive` is `None` and all values stay in `executive_candidates`.
    - If multiple period columns are present, `period` is `None` and all values stay in `period_candidates`.
    - If multiple award-like columns are present with values, `award` is `None` and all parsed values are retained in `award_candidates`.
  - Does not infer or backfill missing award data.

- Added `services/parse-proxy/tests/test_parse_grants.py`.
  - Verifies award extraction when present.
  - Verifies links to executive and period.
  - Verifies ambiguity remains explicit and uncollapsed.
  - Verifies missing awards are not guessed.

## Out of scope (intentionally unchanged)
- SCT parser behavior.
- Public page/web application changes.
- Schema changes outside grants parser outputs.

## Verification (Linux/macOS)
- `pytest services/parse-proxy/tests/test_parse_grants.py -q`

## Verification (Windows PowerShell)
```powershell
# from repository root
cd C:\Users\lolvi\Documents\GitHub\data-dogs

# required acceptance test for day 60
py -m pytest services/parse-proxy/tests/test_parse_grants.py -q

# optional broader suite used in this repo
py -m pytest services/parse-proxy/tests -q
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
py -m pytest services/ingest-sec/tests -q
py -m pytest services/parse-xbrl/tests -q
py -m pytest services/id-master/tests -q

# market-data tests may not exist on this branch; skip safely if absent
if (Test-Path "services/market-data/tests") {
  py -m pytest services/market-data/tests -q
} else {
  Write-Host "SKIP: services/market-data/tests not present on this branch"
}
```

## Auditability and provenance
- Parser output keeps source metadata (`source_url`, `accession`) and parser version.
- Every transformed grants row keeps a direct row-text and row-line pointer back to the raw source block.
- Ambiguous row mappings are represented as explicit candidate sets, preventing non-auditable assumptions.
