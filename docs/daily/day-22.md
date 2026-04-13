# Day 22 - Bulk Submissions Backfill

## Scope completed
- Added `SubmissionsBulkBackfillJob` for SEC submissions with archive-aware ingestion by processing both issuer-level recent payloads and `filings.files` archive payloads for each partitioned issuer unit.
- Implemented work partitioning for bulk runs using deterministic issuer partition assignment (`int(cik) % partition_count`) to support multi-worker fan-out without overlapping work.
- Preserved immutable raw storage semantics by storing each fetched payload as a content-addressed raw artifact and staging only parsed headers.
- Kept progress tracking via per-issuer checkpoints and base job checkpoint advancement so failed runs can safely resume.
- Enforced duplicate protection by relying on checksum-based raw artifact deduplication and `(cik, accession_number)` staging deduplication.

## Files touched
- `services/ingest-sec/src/jobs/submissions_bulk_backfill.py`
- `services/ingest-sec/tests/test_submissions_bulk.py`
- `docs/daily/day-22.md`

## Acceptance tests
- `pytest services/ingest-sec/tests/test_submissions_bulk.py -q`

## Guardrails respected
- No financial normalization changes.
- No public UI work.
- Bulk path remains at least as safe as single-issuer ingestion by using the same parser/raw-store primitives and idempotent checkpointing/deduplication behavior.
