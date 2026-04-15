# Day 33

## Scope
- Added quarterly statement builder and explicit TTM logic with deterministic rolling-4-quarter formulas.
- Enforced no mixed-period contamination: annual rows are excluded from quarterly/TTM calculations.
- Added TTM output tests and quarterly web spec coverage for explicit formula wording.

## Files touched
- `services/parse-xbrl/src/statement_builder_quarterly.py`
- `services/parse-xbrl/tests/test_ttm.py`
- `apps/web/tests/financials-quarterly.spec.ts`
- `docs/daily/day-33.md`

## TTM formula policy
- TTM is explicit and documented in output text as:
  - `TTM <metric> = FYyyyyQq + FYyyyyQq-1 + FYyyyyQq-2 + FYyyyyQq-3`
- TTM applies only to flow metrics and never to stock metrics.
- Missing quarterly components do not fall back to annual rows.

## Acceptance
```bash
pytest services/parse-xbrl/tests/test_ttm.py -q
pnpm --filter web test -- financials-quarterly.spec.ts || pnpm --filter web test
```
