# Day 65 — Insider dataset ingest

Date: 2026-04-19

## Scope
- Stand up the `services/market-data` Python service with an insider dataset ingest module (`src/insider_ingest.py`).
- Enforce raw + normalized layer separation for insider payloads (Forms 3/4/5 style data).
- Preserve full source provenance on every staged row (source url, accession, fetched_at, checksum, parser version, ingest job id, raw artifact id).
- Link rows to issuer (by CIK) and security (by title + ticker) where possible; normalize issuer CIK to 10 digits for consistent linkage.
- Add DB schema `packages/db/schema/012_insiders.sql` with raw + normalized tables and provenance columns; add unit tests under `services/market-data/tests/`.
- No public page today.

## Changes made

### `packages/db/schema/012_insiders.sql`
New tables:
- `raw_insider_artifact` — immutable raw payload per insider filing, keyed by SHA-256 checksum, with `source_url`, `source_accession`, `issuer_cik`, `fetched_at`, `parser_version`, `ingest_job_id`, and `payload_json`.
- `insider` — normalized reporting-person identity scoped to an issuer (issuer_cik + full_name + optional insider_cik unique key). Role flags: `is_director`, `is_officer`, `is_ten_percent_owner`, `is_other_reporter`, plus `officer_title`.
- `insider_transaction` — staged transaction rows linked to `insider` and `raw_insider_artifact`. Carries security linkage (`security_title`, `security_ticker`), transaction attributes (`transaction_date`, `transaction_code`, `acquired_or_disposed` ∈ {A,D}, `shares`, `price_per_share`, `shares_owned_after`, `ownership_form` ∈ {D,I}), and full provenance columns.
- `insider_holding` — staged holding snapshots keyed on `insider_id + security_title + as_of_date + ownership_form + source_accession` with the same provenance columns.
- Indexes on issuer CIK, accession, transaction date, ticker/date, and holding as-of date.

### `services/market-data/src/insider_ingest.py`
New module (no prior files in this service). Public surface:
- `PARSER_VERSION = "market-data.insider_ingest.v1"` — embedded in raw artifacts and every staged row.
- `RawInsiderArtifact`, `InsiderRecord`, `InsiderTransactionRow`, `InsiderHoldingRow`, `InsiderIngestResult` — frozen dataclasses mirroring the SQL model.
- `InMemoryInsiderStore` — thread-safe store with:
  - `store_raw(...)` — content-addressed raw storage; checksum material includes dataset, source url, accession, issuer CIK, parser version, and the full payload, so a metadata change cannot collapse onto an existing checksum.
  - `upsert_insider(...)` — deterministic `insider_id` derived from `(issuer_cik, insider_full_name, insider_cik)`; subsequent ingests for the same insider reuse the id.
  - `stage_transaction(...)` / `stage_holding(...)` — natural-key deduplicated staging keyed by source accession so a rerun is idempotent but two distinct filings remain distinct rows.
- `ingest_insider_dataset(...)` — top-level entry point for one filing / one reporting person. Normalizes issuer CIK to 10 digits, validates every field (ISO date, A/D enum, D/I enum, numeric shares/price), and returns an `InsiderIngestResult` carrying the raw artifact id, checksum, insider id, staged counts, and source url/accession/fetched_at/parser_version/ingest_job_id.

### `services/market-data/tests/test_insider_ingest.py`
Nine tests covering:
1. Raw + normalized layer separation and full source provenance on every staged row.
2. Idempotent rerun (same inputs → zero new staged rows, same checksum, same ids).
3. A second filing for the same insider produces a distinct raw artifact while reusing the same `insider_id`; each row is still linked back to its own raw artifact and accession.
4. Security linkage: `security_ticker` is optional, `security_title` is required; missing `security_title` raises `ValueError` at the insider/security boundary.
5. Invalid `acquired_or_disposed` code rejected.
6. Invalid `transaction_date` format rejected.
7. Issuer CIK normalization to 10 digits.
8. Non-digit issuer CIK rejected.
9. Same insider across two accessions yields two distinct transaction rows (both carrying their own accession-level provenance) but a single `insider_id`.

### `docs/daily/day-65.md`
This file.

## Rollback rule check
Rollback rule: revert if insider ingest loses source traceability.
- Every staged transaction and holding row carries `raw_insider_artifact_id`, `source_url`, `source_accession`, `source_fetched_at`, `source_checksum`, `parser_version`, and `ingest_job_id`.
- The raw artifact is content-addressed by SHA-256 over dataset + source url + accession + issuer CIK + parser version + payload, so any silent drift would change the checksum and surface as a new artifact.
- Tests explicitly assert that every staged row's provenance columns match its raw artifact (`test_ingest_separates_raw_from_normalized_and_preserves_full_source_provenance`, `test_different_filing_produces_distinct_raw_artifact_and_preserves_linkage`).

## Acceptance checks
- ✅ `PYTHONPATH=services/market-data python -m pytest services/market-data/tests/test_insider_ingest.py -q` → 9 passed.

## Additional verification (requested palette)
- ⚠️ `pnpm lint` — pnpm/Corepack is not available in this sandbox; no JS/TS files changed today, so lint scope is unaffected.
- ⚠️ `pnpm typecheck` — same as above; no TS files changed.
- ⚠️ `pnpm --filter web test` — no web files changed.
- ⚠️ `pnpm --filter web build` — no web files changed.
- ✅ `PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q`
- ✅ `PYTHONPATH=services/parse-xbrl python -m pytest services/parse-xbrl/tests -q`
- ✅ `PYTHONPATH=services/parse-proxy python -m pytest services/parse-proxy/tests -q`
- ✅ `PYTHONPATH=services/id-master python -m pytest services/id-master/tests -q`
- ✅ `PYTHONPATH=services/market-data python -m pytest services/market-data/tests -q`

(The CI `ci.yml` block that runs `services/market-data/tests` when present will now start executing on push.)

## Risks / follow-ups
- This module is in-memory and does not yet persist to Postgres. A follow-up day should wire `InMemoryInsiderStore` semantics to the `012_insiders.sql` tables (insert raw artifact, upsert insider, insert transactions/holdings).
- Security linkage is currently by `security_title` + optional `security_ticker`. Once `security_master` has a stable CUSIP/FIGI identifier for insider-reported securities, `insider_transaction` and `insider_holding` should also carry a `security_id` foreign key.
- A fetching layer that actually downloads Form 3/4/5 XML from EDGAR via the shared SEC client (`services/ingest-sec/src/client.py`) is still needed; today's scope is the raw + normalized ingest contract only.
