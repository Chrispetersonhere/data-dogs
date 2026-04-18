# Day 57 - Executive Compensation Schema

Date: 2026-04-18

## Scope
- Create the normalized executive compensation schema in `packages/db/schema/011_compensation.sql`.
- Add compensation domain types in `packages/schemas/src/domain/compensation.ts`.
- Keep role history separate from compensation facts.
- Preserve provenance and point-in-time auditability in every compensation fact table.
- Avoid parser and public page changes.

## Changes made
- Added `packages/db/schema/011_compensation.sql` with five required entities:
  - `executive`
  - `executive_role_history`
  - `comp_summary`
  - `comp_award`
  - `governance_fact`
- Added provenance metadata columns on role and fact tables:
  - `source_url`
  - `source_accession`
  - `source_fetched_at`
  - `source_checksum`
  - `parser_version`
  - `ingest_job_id`
  - `recorded_at`
- Added `packages/schemas/src/domain/compensation.ts` with type-safe domain contracts matching the normalized schema.
- Added uniqueness constraints and point-in-time friendly indexes for issuer/executive/year and role history lookup.

## Acceptance criteria check
- **Role history separated from compensation facts:** satisfied via dedicated `executive_role_history` table.
- **No giant flat compensation table:** satisfied via split `comp_summary`, `comp_award`, and `governance_fact` tables.
- **Normalized and auditable:** satisfied via explicit entity boundaries and provenance metadata on all sourced fact tables.

## Forbidden changes check
- Parser code: not touched.
- Public compensation page: not touched.

## Rollback rule check
- Schema retains separate role-history and compensation-facts structures; rollback not required.

## Definition of done status
- Schema + domain + docs scope: complete.
- JS/TS validation palette (`pnpm`): complete.
- Python service tests in Windows PowerShell: complete via `py -m pytest` (ingest-sec, parse-xbrl, id-master); optional suites skipped when paths are absent.

## Verification commands run (agent environment)
- `git status --short`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/id-master/tests -q`
- `py -m pytest services/ingest-sec/tests -q`
- `py -m pytest services/parse-xbrl/tests -q`
- `py -m pytest services/id-master/tests -q`
- `if (Test-Path services/parse-proxy/tests) { py -m pytest services/parse-proxy/tests -q } else { Write-Host "SKIP services/parse-proxy/tests (path not present)" }`
- `if (Test-Path services/market-data/tests) { py -m pytest services/market-data/tests -q } else { Write-Host "SKIP services/market-data/tests (path not present)" }`

## Windows PowerShell verification block
Use this from repo root to validate this Day 57 PR in Windows PowerShell.
This version avoids direct `pytest` calls and handles optional/missing service test folders.

```powershell
git fetch origin
$branch = git branch --show-current
if (-not $branch) { throw "Could not determine current branch. Run this inside the repo." }
git checkout $branch
git pull --ff-only

# Confirm scope is restricted to Day 57 files
# (should be clean after pulling if you are only validating)
git status --short

# Review changed files
Get-Content packages\db\schema\011_compensation.sql
Get-Content packages\schemas\src\domain\compensation.ts
Get-Content docs\daily\day-57.md

# JS/TS validation palette
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# Python test prerequisites (Windows)
py --version
py -m pip --version

# If pytest is missing, install it in your active environment:
# py -m pip install pytest

# Python service tests (run with module form for PowerShell compatibility)
py -m pytest services/ingest-sec/tests -q
py -m pytest services/parse-xbrl/tests -q
py -m pytest services/id-master/tests -q

# Optional suites: run only if present in your checkout
if (Test-Path services/parse-proxy/tests) { py -m pytest services/parse-proxy/tests -q } else { Write-Host "SKIP services/parse-proxy/tests (path not present)" }
if (Test-Path services/market-data/tests) { py -m pytest services/market-data/tests -q } else { Write-Host "SKIP services/market-data/tests (path not present)" }
```
