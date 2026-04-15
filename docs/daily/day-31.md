# Day 31

## Scope
- Added amended filing/restatement resolution logic with explicit supersession links.
- Preserved prior truth as append-only version history for each issuer-period-concept tuple.
- Represented currently resolved truth in a separate structure from historical versions.
- Enforced non-destructive behavior: reruns of identical filing facts are idempotent and do not rewrite history.

## Files touched
- `services/parse-xbrl/src/restatement_resolution.py`
- `services/parse-xbrl/tests/test_restatement_resolution.py`
- `packages/db/schema/010_restatements.sql`
- `docs/daily/day-31.md`

## Acceptance
```bash
pytest services/parse-xbrl/tests/test_restatement_resolution.py -q
```
