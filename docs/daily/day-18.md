# Day 18 — Listing and Exchange History

## Scope completed
- Modeled listing and exchange history with effective-dated records.
- Preserved historical transitions for exchange moves and symbol changes.
- Added tests validating listing moves and listing changes without overwriting historical truth.

## Files touched
- `services/id-master/src/listing_history.py`
- `services/id-master/tests/test_listing_history.py`
- `packages/db/schema/006_listing_history.sql`
- `docs/daily/day-18.md`

## Required behavior coverage
- Effective-dated listing records are represented with `effective_from` and `effective_to`.
- Historical transitions are appended and preserved.
- Listing moves and listing symbol changes are covered by explicit tests.

## Verification commands
- `pytest services/id-master/tests/test_listing_history.py -q`

## Guardrails respected
- No current-state overwrite-only logic was introduced.
- Historical listing truth is preserved through transitions.
