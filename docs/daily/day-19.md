# Day 19 — Point-in-Time Query Primitives

## Scope completed
- Added point-in-time resolution primitives for identifier mappings.
- Added point-in-time listing lookup primitives for listing history.
- Added anti-lookahead coverage that enforces `knowledge_as_of` cutoffs.

## Files touched
- `services/id-master/src/identifier_map.py`
- `services/id-master/src/listing_history.py`
- `services/id-master/tests/test_point_in_time_queries.py`
- `docs/daily/day-19.md`

## Required behavior coverage
- External and internal identifier queries can be resolved as of a target timestamp.
- Listing history can be resolved to the active listing as of a target timestamp.
- Future-observed backfills are excluded when `knowledge_as_of` is earlier than `observed_at`/`recorded_at`.

## Verification commands
- `pytest services/id-master/tests/test_identifier_map.py -q`
- `pytest services/id-master/tests/test_listing_history.py -q`
- `pytest services/id-master/tests/test_point_in_time_queries.py -q`

## Guardrails respected
- No lookahead leakage was introduced in point-in-time reads.
- Historical windows remain effective-dated and append-only.
