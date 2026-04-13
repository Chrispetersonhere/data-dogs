# Day 16 — Security Master

## Scope completed
- Created a security master model separate from issuer records.
- Added support for multiple securities per issuer.
- Added effective-dated security listing relationships.
- Kept separation explicit: security identity is not collapsed into issuer identity.

## Files touched
- `services/id-master/src/security_master.py`
- `services/id-master/tests/test_security_master.py`
- `packages/db/schema/004_security_master.sql`
- `docs/daily/day-16.md`

## Required behavior coverage
- Security and listing records are separate from issuer records.
- Multiple securities can map to a single issuer.
- Listing history is preserved with `effective_from` and `effective_to` windows.

## Verification commands
- `pytest services/id-master/tests/test_security_master.py -q`

## Guardrails respected
- No public web routes were added.
- No financial statements were changed.
- Security and issuer concepts remain separate.
