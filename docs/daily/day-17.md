# Day 17 — Identifier Mapping Layer

## Scope completed
- Built an identifier mapping layer that keeps internal identities explicit.
- Added support for company, issuer, and security internal IDs (`companyId`, `issuerId`, `securityId`).
- Added external identifier mapping support for values like ticker and CIK.
- Added historical mapping support via `valid_from`/`valid_to` windows.
- Preserved the rule that a current ticker is not treated as a permanent identity.

## Files touched
- `services/id-master/src/identifier_map.py`
- `services/id-master/tests/test_identifier_map.py`
- `packages/db/schema/005_identifier_map.sql`
- `docs/daily/day-17.md`

## Required behavior coverage
- Internal identity layers are represented separately from external identifiers.
- External identifiers can map over time windows to support historical changes.
- The same ticker can map to multiple security IDs across different periods.

## Verification commands
- `pytest services/id-master/tests/test_identifier_map.py -q`

## Guardrails respected
- No OpenFIGI live integration was added.
- No public UI changes were made.
- No model assumption was introduced that current ticker equals permanent identity.
