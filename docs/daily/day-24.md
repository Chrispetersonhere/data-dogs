# Day 24 - Note/Disclosure Artifact Ingest Stubs

## Scope completed
- Added note/disclosure artifact ingest scaffolding that stores source-shaped note artifacts in an immutable raw layer.
- Added explicit linkage capture so every stored note artifact is connected to both a source filing accession and issuer CIK.
- Preserved auditability by recording parser version, source URI, discovery/link timestamps, and checksum identities.
- Enforced linkage guardrails in ingest validation: artifact storage is rejected if filing or issuer linkage is missing.
- Clarified ingest result semantics so `stored_count`/`linked_count` represent newly added records while `processed_count` represents artifacts seen in the request.
- Kept scope ingest-only (no note UX work).

## Files touched
- `services/parse-xbrl/src/notes_ingest.py`
- `services/parse-xbrl/tests/test_notes_ingest.py`
- `packages/db/schema/008_notes_staging.sql`
- `docs/daily/day-24.md`

## Acceptance tests
- Preferred (cross-platform): `python -m pytest services/parse-xbrl/tests/test_notes_ingest.py -q`
- If `pytest` is not installed in your active environment:
  - `python -m pip install pytest`
  - re-run `python -m pytest services/parse-xbrl/tests/test_notes_ingest.py -q`

## Guardrails respected
- No public note panel changes.
- No statement renderer changes.
- Rollback rule addressed by hard validation that prevents storing note artifacts without filing/issuer linkage.
