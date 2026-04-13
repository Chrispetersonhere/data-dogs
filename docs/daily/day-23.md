# Day 23 - Financial Statement Dataset Staging

## Scope completed
- Added SEC financial statement dataset ingestion scaffolding with explicit raw/staging separation.
- Implemented immutable raw artifact storage keyed by payload checksum.
- Added staging-row writes that preserve period metadata (`period_start`, `period_end`, `period_type`) for downstream consumers.
- Kept staging intentionally non-canonical: line items are stored as source-native labels with no mapping into normalized facts.
- Added duplicate-safe behavior so reruns do not multiply raw artifacts or staged rows.

## Files touched
- `services/parse-xbrl/src/fs_dataset_ingest.py`
- `services/parse-xbrl/tests/test_fs_dataset_ingest.py`
- `packages/db/schema/007_fs_staging.sql`
- `docs/daily/day-23.md`

## Acceptance tests
- `pytest services/parse-xbrl/tests/test_fs_dataset_ingest.py -q`

## Guardrails respected
- No financials UI changes.
- No ratio engine changes.
- Staging layer remains a landing zone for source-shaped rows (not final normalized truth).
