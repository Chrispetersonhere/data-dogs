# Day 4 — Initial Database Schema

## Scope completed
- Created initial SQL schema with required tables only: `issuer`, `filing`, `filing_document`, `raw_artifact`, `ingestion_job`, `parser_run`.
- Added ordered migration `001_initial.sql` under `packages/db/migrations`.
- Added `packages/db/src/index.ts` with schema/version and provenance field constants.
- Added ERD documentation describing relationships and lineage fields.
- Kept scope tight: no fact/compensation/market-price tables; no app/service/auth changes.

## Provenance and lineage coverage
- Source URL + access/fetch time captured across filing/document/artifact boundaries.
- Accession lineage captured at filing level and carried to raw artifact where useful.
- Raw artifact integrity preserved via SHA-256 checksum with uniqueness.
- Parser execution lineage captured using parser name/version/job id and artifact/job links.
- Ingestion job linkage added to filing/raw artifact/parser run.

## Files touched
- `packages/db/schema/001_initial.sql`
- `packages/db/migrations/001_initial.sql`
- `packages/db/src/index.ts`
- `docs/architecture/erd-v1.md`
- `docs/daily/day-4.md`

## Validation commands run
- `git diff -- packages/db docs/architecture/erd-v1.md`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/parse-proxy/tests -q`
- `pytest services/id-master/tests -q`
- `pytest services/market-data/tests -q`

## Risks / follow-ups
- Repo currently lacks Python service test directories, so the default Day 4 pytest palette may fail in this bootstrap state.
- When DB runtime tooling is introduced, wire this migration into the project’s migration runner and add migration smoke tests in CI.
