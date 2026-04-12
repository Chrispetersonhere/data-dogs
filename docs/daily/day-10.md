# Day 10 — Companyfacts and Frames Ingestion

## Scope completed
- Implemented companyfacts backfill job with raw fetch, immutable raw storage, metadata parsing, checkpoints, and resume semantics.
- Implemented frames backfill job with raw fetch, immutable raw storage, metadata staging, checkpoints, and idempotent rerun behavior.
- Added companyfacts parser to extract lightweight metadata for later normalization stages.
- Added duplicate-protection tests for companyfacts and frames backfill flows.

## Files touched
- `services/ingest-sec/src/jobs/companyfacts_backfill.py`
- `services/ingest-sec/src/jobs/frames_backfill.py`
- `services/ingest-sec/src/parsers/companyfacts_parser.py`
- `services/ingest-sec/tests/test_companyfacts_frames.py`
- `docs/daily/day-10.md`

## Verification commands
- `python -m pytest services/ingest-sec/tests/test_companyfacts_frames.py -q`

## Notes
- Raw and parsed metadata layers remain separated.
- No canonical metric normalization was added.
- Checkpoint/resume behavior is covered by tests.
