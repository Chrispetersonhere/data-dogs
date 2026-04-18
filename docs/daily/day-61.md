# Day 61 — Governance fact extraction

## Scope
Implemented a dedicated governance parser in parse-proxy to extract required governance facts while keeping source linkage explicit for every emitted fact.

## What changed
- Added `services/parse-proxy/src/parse_governance.py`.
  - Introduces `parse_governance_facts` with parser version `parse-proxy.parse_governance.v1`.
  - Extracts required governance facts when explicitly present:
    - CEO/chair structure (`combined` or `separate`)
    - Compensation committee members
    - Say-on-pay result (outcome + support percent when present)
  - Source-links every extracted fact using:
    - `source_url`
    - `raw_line`
    - `raw_text`
  - Uses conservative pattern matching and avoids inference when data is not feasible to extract.

- Added `services/parse-proxy/tests/test_parse_governance.py`.
  - Verifies required fact extraction for a representative proxy text block.
  - Verifies source linking exists on all extracted fact types.
  - Verifies separate CEO/chair detection.
  - Verifies optional facts remain `None`/empty when not feasible.

## Out of scope (intentionally unchanged)
- UI/web application changes.
- New schema introduction.
- Other parse-proxy parsers.

## Verification (Linux/macOS)
- `pytest services/parse-proxy/tests/test_parse_governance.py -q`

## Verification (Windows PowerShell)
```powershell
# from repository root
cd C:\Users\lolvi\Documents\GitHub\data-dogs

# required acceptance test for day 61
py -m pytest services/parse-proxy/tests/test_parse_governance.py -q

# optional standard command palette
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
py -m pytest services/ingest-sec/tests -q
py -m pytest services/parse-xbrl/tests -q
py -m pytest services/parse-proxy/tests -q
py -m pytest services/id-master/tests -q

if (Test-Path "services/market-data/tests") {
  py -m pytest services/market-data/tests -q
} else {
  Write-Host "SKIP: services/market-data/tests not present on this branch"
}
```

## Auditability and provenance
- Parser output keeps source metadata (`source_url`, `accession`) and parser version.
- Every transformed governance fact preserves exact source linkage (`raw_line`, `raw_text`, `source_url`).
- Missing/unclear inputs do not trigger guessed outputs; parser emits only explicit facts.
