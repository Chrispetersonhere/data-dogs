# Day 25 - Normalized Fact Skeleton

## Scope completed
- Added normalized fact skeleton models for raw and normalized fact layers.
- Added support models for `units` and `periods`.
- Ensured lineage fields are present across models: source filing, source concept, and normalization status.
- Preserved rollback guardrail by enforcing normalized facts keep a direct `raw_fact_id` linkage.
- Intentionally did not implement mapping rules yet.

## Files touched
- `packages/db/schema/009_facts.sql`
- `services/parse-xbrl/src/fact_models.py`
- `services/parse-xbrl/tests/test_fact_models.py`
- `docs/daily/day-25.md`

## Acceptance tests
- `pytest services/parse-xbrl/tests/test_fact_models.py -q`

## Guardrails respected
- No ratio formula changes.
- No frontend chart changes.
- Raw fact identity remains required in normalized model.
