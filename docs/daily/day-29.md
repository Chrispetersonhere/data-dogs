# Day 29 - Canonical Metric Dictionary

## Scope completed
- Defined a tight canonical metric dictionary for Month-1 scope in `packages/schemas/src/domain/canonical_metrics.ts`.
- Added data documentation in `docs/data/canonical-metrics.md`.
- Added tests to enforce:
  - exact metric key set
  - required fields (`name`, `description`, `unit`, `scopeNote`) for every metric
  - anti-bloat guardrail (no extra metrics)

## Included metrics (exact)
- revenue
- gross profit
- operating income
- net income
- assets
- liabilities
- equity
- CFO
- capex
- FCF
- shares

## Acceptance tests
- `pytest services/parse-xbrl/tests/test_canonical_metrics.py -q`

## Guardrails respected
- No mapping engine implementation changes.
- No web page changes.
- Dictionary remains tight and specific (no metric sprawl).
