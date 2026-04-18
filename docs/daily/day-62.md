# Day 62 - Compensation QA Interface

## Scope
- Added an internal-only admin compensation QA interface at `/admin/qa`.
- Added side-by-side raw proxy compensation table and parsed structured output table.
- Added discrepancy highlights to explicitly surface parse/total mismatches.
- Preserved provenance visibility: source URL, accession, fetch timestamp, checksum, parser version, and job id.
- Added acceptance-style markup tests for required layout and discrepancy visibility.

## Files touched
- `apps/web/app/admin/qa/page.tsx`
- `apps/web/lib/api/comp-qa.ts`
- `apps/web/tests/comp-qa.spec.ts`
- `docs/daily/day-62.md`

## Notes
- This is internal-only and still gated by `ADMIN_ENABLED === 'true'`.
- Public compensation pages and homepage are unchanged.
- Rollback rule honored: discrepancy signals are explicit and visually highlighted in both side-by-side tables and in the discrepancy list.
- Raw table now visibly includes all provenance fields required for QA auditability.

## Definition of done checks for Day 62
1. `/admin/qa` is internal-only and loads under `ADMIN_ENABLED=true`.
2. Raw proxy and parsed structured output are rendered side-by-side.
3. Discrepant rows are visibly highlighted in both tables and listed in discrepancy highlights.
4. Raw rows visibly include source URL, accession, fetch timestamp, checksum, parser version, and job id.
5. Required acceptance checks pass:
   - `pnpm --filter web build`
   - `pnpm --filter web test -- comp-qa.spec.ts || pnpm --filter web test`

## Windows PowerShell verification (copy/paste)
```powershell
# from repo root
$ErrorActionPreference = 'Stop'

git pull
git log --oneline --max-count=20

# required Day 62 acceptance checks
pnpm --filter web build
pnpm --filter web test -- comp-qa.spec.ts
if ($LASTEXITCODE -ne 0) { pnpm --filter web test }

# recommended broader checks
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# optional service checks: run only when pytest is installed
$pytestCmd = Get-Command pytest -ErrorAction SilentlyContinue
if ($pytestCmd) {
  pytest services/ingest-sec/tests -q
  pytest services/parse-xbrl/tests -q
  pytest services/parse-proxy/tests -q
  pytest services/id-master/tests -q
  pytest services/market-data/tests -q
} else {
  Write-Host "Skipping Python service tests: pytest is not installed in this shell." -ForegroundColor Yellow
  Write-Host "If needed, install with: py -m pip install pytest" -ForegroundColor Yellow
}
```
