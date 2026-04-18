# Day 64 — Company compensation page

Date: 2026-04-18

## Scope
- Build `apps/web/app/company/[companyId]/compensation/page.tsx`.
- Add compensation data access layer in `apps/web/lib/api/compensation.ts`.
- Add compensation page acceptance test in `apps/web/tests/compensation-page.spec.ts`.
- Keep scope limited to Day 64 files only.
- Use live SEC source filings only (no seeded/mock compensation data).

## Changes made
- Added `getCompanyCompensation(companyId)` in `apps/web/lib/api/compensation.ts`:
  - Fetches SEC submissions (`CIK##########.json`) for the issuer.
  - Selects recent `DEF 14A` / `DEFA14A` filings.
  - Builds SEC filing source URLs from accession + primary document.
  - Fetches filing HTML and heuristically extracts executive total-compensation rows from filing text.
  - Produces normalized outputs for executive rows, total comp history, and source link list.
- Added compensation page route in `apps/web/app/company/[companyId]/compensation/page.tsx` with premium layout sections:
  - Executive table.
  - Total comp history.
  - Source links.
  - Explicit fallback rendering when no parseable rows are found while still preserving source visibility.
- Added `apps/web/tests/compensation-page.spec.ts` to assert required markup sections and reject incomplete markup.


## Post-review fix
- Replaced invalid `colorTokens.accent.primary` link color usage with `colorTokens.accent.soft` in compensation page links to satisfy `web` TypeScript token typing.

## Rollback rule check
- The page remains usable even when row extraction is sparse: source links and filing context are still rendered from real SEC data.
- If production testing shows page usability failure on real data, rollback should revert this Day 64 patch.

## Acceptance checks
- ⚠️ `pnpm --filter web build` (blocked in this environment because Corepack cannot download pnpm due proxy/tunnel 403 to `registry.npmjs.org`)
- ⚠️ `pnpm --filter web test -- compensation-page.spec.ts || pnpm --filter web test` (same pnpm/Corepack environment block)

## Additional verification (requested palette)
- ⚠️ `pnpm lint` (same pnpm/Corepack environment block)
- ⚠️ `pnpm typecheck` (same pnpm/Corepack environment block)
- ✅ `pytest services/ingest-sec/tests -q`
- ✅ `pytest services/parse-xbrl/tests -q`
- ✅ `pytest services/parse-proxy/tests -q`
- ✅ `pytest services/id-master/tests -q`
- ⚠️ `pytest services/market-data/tests -q` (path not present on this branch)
