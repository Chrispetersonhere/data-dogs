# Day 21 - Issuer/Security/PIT Stabilization

## Scope completed
- Inspected id-master schema primitives in source models and the Day 15–20 test suite before making changes.
- Fixed naming consistency by centralizing shared normalization/time-window helpers used across issuer, security, listing history, and identifier mapping layers.
- Tightened relationship handling by keeping issuer/security identity semantics unchanged while deduplicating repeated input handling and PIT interval checks.
- Removed duplicate logic across modules without adding routes, domains, or features.
- Wrote Week 3 review summary.

## Files touched
- `services/id-master/src/_shared.py`
- `services/id-master/src/issuer_master.py`
- `services/id-master/src/security_master.py`
- `services/id-master/src/listing_history.py`
- `services/id-master/src/identifier_map.py`
- `docs/weekly/week-3-review.md`
- `docs/daily/day-21.md`

## Acceptance tests
- `pytest services/id-master/tests -q`
- `pnpm typecheck` *(environment could not fetch pnpm artifact via proxy, so this check could not complete in-container)*

## Guardrails respected
- No new routes.
- No new domains.
- Cleanup-only refactor; no feature expansion.
