# Day 15 — Issuer Master

## Scope completed
- Created canonical issuer-master model for stable issuer identity.
- Added current-name plus historical-name tracking in the issuer master service.
- Ensured issuer identity remains stable across display-name changes.
- Kept scope intentionally limited: no security master and no ticker-specific logic.

## Files touched
- `services/id-master/src/issuer_master.py`
- `services/id-master/tests/test_issuer_master.py`
- `packages/db/schema/003_issuer_master.sql`
- `docs/daily/day-15.md`

## Required behavior coverage
- Canonical issuer records are keyed by stable `issuer_key` and assigned immutable `issuer_id`.
- `current_name` is updated when display name changes.
- Prior names are preserved with validity windows in name history.

## Verification commands
- `pytest services/id-master/tests/test_issuer_master.py -q`

## Guardrails respected
- No security records were added.
- No ticker-specific logic was introduced.
- Issuer identity does not depend on current display name.
