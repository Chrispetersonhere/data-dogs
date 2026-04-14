# Day 30

## Scope
- Built deterministic XBRL raw-to-canonical mapper with explicit rule table.
- Added auditable mapping output including rule id, rule source, confidence, and input snapshot.
- Enforced rollback behavior: no mapping emitted when no explainable deterministic rule matches.

## Files touched
- `packages/parser-rules/src/xbrl_rules.ts`
- `services/parse-xbrl/src/mapper.py`
- `services/parse-xbrl/tests/test_mapper.py`
- `docs/daily/day-30.md`

## Acceptance
```bash
pytest services/parse-xbrl/tests/test_mapper.py -q
```
