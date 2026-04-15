# Week 5 Review — Fundamentals Layer Stabilization

## Week window
- Week 5 covers Days 29 through 35.

## What shipped
### Deterministic statement + truth-resolver foundation (Days 29–34)
- Delivered deterministic mapper, restatement resolver, annual/quarterly statement builders, and explicit TTM outputs.
- Added ratio engine with explicit formulas across margins, leverage, liquidity, efficiency, and valuation-support metrics.
- Added domain/schema and day docs so formulas and behaviors remain inspectable and auditable.

### Stabilization pass (Day 35)
- Reviewed mapping, restatement, statement, and ratio modules for fundamentals-layer cohesion.
- Removed duplicated numeric parsing paths in statement builders by converging on one shared parser.
- Tightened documentation around stabilization scope and explicit formula behavior.

## Risks reduced
- Lower risk of parser drift between annual and quarterly statement flows.
- Lower maintenance overhead from repeated conversion logic.
- Stronger auditability due explicit formulas and test-covered deterministic outputs.

## Deferred items (intentionally out of scope)
- No new routes.
- No compensation work.
- No metric-set expansion disguised as refactor.

## Quality gates
- `pytest services/parse-xbrl/tests -q`
- `pnpm --filter web build`

## Recommendation for next week
- Keep refactors narrow and test-led.
- Continue reducing duplicated primitives only where behavior is already covered by tests.
- Avoid feature expansion until fundamentals remain stable for multiple cycles.
