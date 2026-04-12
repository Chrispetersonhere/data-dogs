# Day 9 — Submissions Backfill

## Scope completed
- Implemented submissions backfill job for supplied issuers.
- Added SEC submissions parser for filing-header staging extraction.
- Added raw artifact storage that keeps raw JSON immutable and separate from parsed staging rows.
- Added checkpoint persistence for processed issuers.
- Added idempotency coverage ensuring reruns do not duplicate records.

## Files touched
- `services/ingest-sec/src/jobs/submissions_backfill.py`
- `services/ingest-sec/src/parsers/submissions_parser.py`
- `services/ingest-sec/src/storage/raw_store.py`
- `services/ingest-sec/tests/test_submissions_backfill.py`
- `docs/daily/day-9.md`

## Verification commands
- `python -m pytest services/ingest-sec/tests/test_submissions_backfill.py -q`

## Notes
- Raw and parsed layers are intentionally separated.
- No fact normalization or financial-table additions were introduced.
- Raw artifacts are stored immutably by checksum key to avoid overwrite on reruns.
