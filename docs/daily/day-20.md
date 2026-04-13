# Day 20 - Golden Validation Dataset

## Scope completed
- Created a golden validation dataset seed for issuer/security identity regression.
- Added explicit coverage for name changes, multiple securities, amended filings, complex histories, and identity ambiguity edge cases.
- Added QA documentation explaining why each case family exists.
- Added acceptance tests that enforce required coverage and non-trivial dataset size.

## Files touched
- `packages/db/seeds/golden_companies.sql`
- `docs/qa/golden-dataset.md`
- `services/id-master/tests/test_golden_cases.py`
- `docs/daily/day-20.md`

## Acceptance test
- `pytest services/id-master/tests/test_golden_cases.py -q`

## Guardrails respected
- No app routes changed.
- No chart work changed.
- Dataset includes all five required case families and is non-trivial (10 baseline rows).
