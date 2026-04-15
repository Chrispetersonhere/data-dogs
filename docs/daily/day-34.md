# Day 34

## Scope
- Added a ratio engine with explicit formula coverage across five required groups:
  - margins
  - leverage
  - liquidity
  - efficiency
  - simple valuation-ready support metrics
- Added known-input/output unit tests for deterministic ratio validation.
- Documented formulas in both runtime engine and schema definitions.

## Files touched
- `services/parse-xbrl/src/ratios.py`
- `services/parse-xbrl/tests/test_ratios.py`
- `packages/schemas/src/domain/ratios.ts`
- `docs/daily/day-34.md`

## Formula policy
- Every computed field maps to an explicit formula string.
- Division-by-zero and missing denominator inputs return `None` instead of implicit fallbacks.

## Acceptance
```bash
pytest services/parse-xbrl/tests/test_ratios.py -q
```
