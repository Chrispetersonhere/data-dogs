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

## Validation commands run (PowerShell)
- `git diff -- packages/db docs/architecture/erd-v1.md`
- `pnpm lint` (completed; Turbo reported no lint tasks configured yet)
- `pnpm typecheck` (passed for `web` and `@data-dogs/ui`)
- `pnpm --filter web test` (completed; package currently prints "no automated tests configured yet")
- `pnpm --filter web build` (passed with successful Next.js production build)
- `py -m pytest services/ingest-sec/tests -q`
- `py -m pytest services/parse-xbrl/tests -q`
- `py -m pytest services/parse-proxy/tests -q`
- `py -m pytest services/id-master/tests -q`
- `py -m pytest services/market-data/tests -q`

## Risks / follow-ups
- Python test command is available, but the referenced service test directories are currently absent from this repository snapshot.
- `pnpm --filter web build` generates local workspace artifacts (`apps/web/next-env.d.ts`, `apps/web/tsconfig.tsbuildinfo`) that should not be treated as Day 4 schema changes.
- When DB runtime tooling is introduced, wire this migration into the project’s migration runner and add migration smoke tests in CI.
