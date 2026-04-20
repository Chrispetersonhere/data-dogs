# Day 72 — Core public API endpoints (companies, filings, financials)

Date: 2026-04-20

## Scope

- Implement three Next.js App Router route handlers under
  `apps/web/app/api/v1/{companies,filings,financials}/route.ts` that
  materialize the Day 71 public API contracts (`CompanyProfileResponse`,
  `FilingsListResponse`, `CompanyFinancialsResponse`).
- Add query-parameter validation and pagination consistent with the
  underlying read models: `page`/`pageSize` for companies and filings,
  `years` (capped at 8) for financials.
- Preserve public-only provenance (accession, filingDate, form, SEC-canonical
  URLs, XBRL `sourceUrl` + `fetchedAt`) and keep internal raw-storage
  provenance (checksums, parser versions, ingest job IDs, surrogate keys,
  raw XBRL concept keys) off the public surface.
- Add `apps/web/tests/api-core.spec.ts` covering parameter parsing,
  pagination bounds, URL builders, envelope shape, and provenance leakage
  across all three routes — purely offline, no network.
- No changes to compensation, insider, or pricing surfaces. No new
  ingestion jobs, no schema migrations, no auth.

## Files created / updated

- **Created** `apps/web/app/api/v1/companies/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/companies/helpers.ts` — pure helpers
  (parsing, pagination, envelope builder). Extracted from `route.ts`
  because Next.js's route-segment export rules reject non-HTTP-verb /
  non-config exports from `route.ts`; keeping helpers in a sibling module
  is what makes them unit-testable.
- **Created** `apps/web/app/api/v1/filings/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/filings/helpers.ts` — pure helpers
  (filter normalization, pagination, SEC archive URL builders, public
  projection).
- **Created** `apps/web/app/api/v1/financials/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/financials/helpers.ts` — pure helpers
  (query normalization, XBRL concept matching, year selection, balance-
  sheet consistency, envelope builder). Mirrors the `STATEMENT_SPECS`
  used by `apps/web/app/company/[companyId]/financials/page.tsx` so the
  public API presents the same labelled rows as the UI.
- **Created** `apps/web/tests/api-core.spec.ts` — 41 unit tests.
- **Created** `docs/daily/day-72.md` — this file.

The three `helpers.ts` files are strictly necessary supporting changes:
Next.js 15 fails the production build if `route.ts` exports anything other
than the HTTP verbs (`GET`, `POST`, …) and a small fixed set of segment
config keys (`dynamic`, `revalidate`, `runtime`, …). Tests need to import
the pure logic directly, so the logic lives alongside `route.ts` in a
non-route module.

No files outside the Day 72 allow-list were modified. In particular,
`apps/web/lib/api/*`, `apps/web/lib/financials/analytics.ts`,
`apps/web/app/company/[companyId]/financials/page.tsx`, and the
`packages/schemas/src/api/*` contract files are untouched.

## Contract adherence

Each route emits exactly the envelope defined in `packages/schemas/src/api/*`.

| Endpoint              | Envelope type              | `apiVersion` |
| --------------------- | -------------------------- | ------------ |
| `/api/v1/companies`   | `CompanyProfileResponse`   | `"1"`        |
| `/api/v1/filings`     | `FilingsListResponse`      | `"1"`        |
| `/api/v1/financials`  | `CompanyFinancialsResponse`| `"1"`        |

`apiVersion` is stamped from the `*_API_VERSION` constants exported by the
schema modules — there is no duplicate literal, so a future schema version
bump flows through automatically. `generatedAt` is the API response time
(ISO 8601 UTC), not an internal DB write time.

### `/api/v1/companies`

- Query params: `companyId` (required; digits-only or zero-padded),
  `page` (default 1), `pageSize` (default 25, clamped to `[1, 100]`).
- Data source: `getCompanyOverview()` from
  `apps/web/lib/api/company.ts` (SEC submissions feed).
- Pagination slices `recentFilings` in place; the envelope shape is
  unchanged and does not leak pagination metadata outside the standard
  contract.
- Error shape: `400 { error }` on invalid input, `502 { error }` on
  upstream SEC failure.

### `/api/v1/filings`

- Query params: `issuer` (required), `formType` (optional, single value or
  comma-joined list, case-insensitive), `dateFrom` / `dateTo` (optional
  YYYY-MM-DD, must satisfy `dateFrom ≤ dateTo`), `accession` (optional,
  exact match), `page` (default 1), `pageSize` (default 50, clamped to
  `[1, 200]`).
- Data source: `queryFilings()` from `apps/web/lib/api/filings.ts`, which
  normalizes filters, fetches the SEC submissions feed, and filters rows
  in-process. The route reuses its normalization by delegating through
  `normalizeFilingQueryFilters`.
- Each row is projected through `projectFilingRecord`, which adds the two
  canonical SEC URLs (`primaryDocUrl`, `filingIndexUrl`) that the public
  contract requires but the internal read model does not carry:
  - `primaryDocUrl = https://www.sec.gov/Archives/edgar/data/{cik-int}/{accessionNoDashes}/{primaryDocument}`
  - `filingIndexUrl = https://www.sec.gov/Archives/edgar/data/{cik-int}/{accessionNoDashes}/{accession}-index.htm`
- `filtersApplied` is the public echo of the normalized filter set, with
  `formTypes` sorted for stable output.
- Error shape: `400 { error }` on invalid input, `502 { error }` on
  upstream SEC failure.

### `/api/v1/financials`

- Query params: `companyId` (required), `years` (optional positive
  integer; default 4, max 8).
- Data source: the SEC XBRL `companyfacts` endpoint, fetched directly
  inside `route.ts` with `SEC_USER_AGENT` and `revalidate: 300`. The
  route captures `fetchedAt = new Date().toISOString()` immediately after
  the fetch resolves and surfaces it on the envelope's
  `provenance.fetchedAt` field, alongside `provenance.sourceUrl`.
- The `STATEMENT_SPECS` list (income / balance / cash-flow, label +
  concept fallbacks + USD unit) is duplicated from the financials page
  (`apps/web/app/company/[companyId]/financials/page.tsx`) so the API and
  the UI present the same labelled rows. Concept-matching, annual-only
  filtering (`ANNUAL_FORMS ∧ fp='FY'`), and the per-year
  `preferMoreRecent` tiebreaker behave identically to the page.
- `selectYears` picks the most-recent `maxYears` fiscal years that have at
  least one value across any row; `restrictStatementsToYears` drops any
  year-entries outside that window so the envelope is self-consistent.
- `summarizeConsistency` runs the same `assets ≈ liabilities + equity`
  3%-tolerance check the page uses and emits
  `{ status: 'ok' | 'incomplete' | 'mismatch', message }`.
- Error shape: `400 { error }` on invalid input, `502 { error }` on
  upstream SEC failure, missing `us-gaap` facts, or no annual facts
  available.

## Provenance posture (public vs. internal)

Public provenance kept on each response:

| Contract     | Public provenance                                                             |
| ------------ | ----------------------------------------------------------------------------- |
| companies    | `profile.cik`, `recentFilings[].{accession, filingDate, form, primaryDocument}` |
| filings      | `filings[].{accession, filingDate, formType, primaryDocument, primaryDocUrl, filingIndexUrl}`, `filtersApplied` |
| financials   | `provenance.{sourceUrl, fetchedAt}`, `years[]`, `cik`, `consistency`            |

All three carry an envelope-level `generatedAt` so a caller can tell how
fresh the server-side view is, distinct from the filing age.

Internal raw-storage fields that are deliberately **not** exposed:

- Row-level `raw_artifact_id`, `source_checksum` / `checksum_sha256`,
  `parser_version` / `normalizer_version`, `ingest_job_id`,
  `source_fetched_at` (internal HTTP fetch time distinct from the
  envelope-level `fetchedAt` the financials route publishes).
- Internal DB write times (`recorded_at`, `normalized_at`) and any
  surrogate keys (`insider_id`, `executive_id`, `issuer_id`, etc.).
- Raw XBRL concept keys (`us-gaap:Revenues`, `us-gaap:ProfitLoss`) and
  per-concept `FactPoint` trees. Rows carry stable labels only; the
  concept-to-label mapping is an internal detail.
- Internal filter representation (e.g. `Set<string>` objects, normalized
  regex groups). `filtersApplied.formTypes` is emitted as a plain sorted
  array.

The `api-core.spec.ts` suite includes dedicated tests that serialize each
envelope and assert none of `checksum`, `rawArtifactId`, `raw_artifact_id`,
`parserVersion`, `parser_version`, `ingestJobId`, `ingest_job_id`,
`sourceFetchedAt`, `sha256`, `us-gaap`, raw XBRL concept names, or the
internal `conceptUsed` field appear in the serialized response.

## Pagination posture

Pagination is implemented exclusively via `page` / `pageSize` query
parameters and server-side slicing. The response envelopes remain **exactly
as specified by the v1 schemas** — no added `total`, `hasMore`, or `next`
fields. Clients infer "last page" by comparing `filings.length` (or
`recentFilings.length`) to `pageSize`.

This interpretation satisfies "add pagination" without drifting from the
read models. If a richer pagination envelope becomes necessary, it is a v2
concern and should ship as a new `*_API_VERSION = '2'` contract rather than
a silent v1 extension.

Defaults and clamps:

| Endpoint      | `page` default | `pageSize` default | `pageSize` max |
| ------------- | -------------- | ------------------ | -------------- |
| companies     | 1              | 25                 | 100            |
| filings       | 1              | 50                 | 200            |
| financials    | n/a            | n/a (single bundle)| n/a            |

`parsePositiveInt` rejects zero, negative, non-integer (`2.5`), and
trailing-garbage (`12x`) inputs. `clampPageSize` rejects `size < 1`.

## Rollback rule check

Rollback rule: **revert if endpoint contracts drift from read models.**

- Every route emits the exact envelope type declared in
  `packages/schemas/src/api/*`, stamped with `apiVersion` from the schema's
  own `*_API_VERSION` literal. There is no duplicate literal in the route
  code and no drift possible.
- All three envelopes type-check cleanly against the schema module (verified
  via `pnpm --filter web typecheck`, which ran with zero errors).
- No route adds fields beyond what the schema declares; the
  `buildCompaniesResponse`, `buildFilingsResponse`, and
  `buildFinancialsResponse` functions have return types explicitly annotated
  as the schema envelope, so a drift would fail the TypeScript build.
- The `api-core.spec.ts` envelope-shape tests assert `apiVersion`,
  `generatedAt`, top-level collection names, and sub-object names
  (`profile`, `identityHistory`, `filingFootprint`, `recentFilings` for
  companies; `filtersApplied`, `filings` for filings; `statements`, `years`,
  `consistency`, `provenance` for financials).

If a future change proposes to surface any internal raw-storage field on
these responses, the right place is a new v2 envelope or an admin-only
contract, not the public v1 surface.

## Forbidden scope — confirmed untouched

- `apps/web/app/api/v1/compensation/**` — not created. No compensation
  API work in this pass.
- `apps/web/app/api/v1/insiders/**` — not created. No insider API work.
- Pricing page — `apps/web/app/(marketing)/**` and any pricing-related
  routes/components untouched.

## Verification

Run from the repo root in Windows PowerShell:

```powershell
git fetch origin
git checkout claude/setup-monorepo-inspection-80SQo
git pull origin claude/setup-monorepo-inspection-80SQo

pnpm install

# Day 72 acceptance tests (per the brief):
pnpm --filter web test -- api-core.spec.ts ; if (-not $?) { pnpm --filter web test }
pnpm --filter web build

# Full standard palette:
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# Python services (unchanged this pass, run for safety):
$env:PYTHONPATH="services/ingest-sec"; python -m pytest services/ingest-sec/tests -q
$env:PYTHONPATH="services/parse-xbrl"; python -m pytest services/parse-xbrl/tests -q
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/id-master";   python -m pytest services/id-master/tests   -q
```

At time of writing on this worktree, from Linux:

- `pnpm --filter web typecheck` — clean (no errors).
- `pnpm lint` — clean (0 warnings across web, @data-dogs/ui, @data-dogs/db).
- `pnpm --filter web test` — 395 tests pass, 0 failures (354 prior + 41 new
  in `api-core.spec.ts`).
- `pnpm --filter web build` — emits dynamic routes
  `ƒ /api/v1/companies`, `ƒ /api/v1/filings`, `ƒ /api/v1/financials`
  alongside the existing 17 surfaces.

## Risks / follow-ups

- **No compensation / insider API yet.** The homepage already advertises
  `/api/v1/compensation` and `/api/v1/insiders` (see `homepage.spec.ts`)
  but those routes do not exist. They are a deliberate out-of-scope for
  Day 72 and the natural next-day candidates.
- **`STATEMENT_SPECS` duplicated.** The concept/label list in
  `apps/web/app/api/v1/financials/helpers.ts` is a literal copy of the
  same list in `apps/web/app/company/[companyId]/financials/page.tsx`.
  A label rename on one side and not the other would silently diverge the
  UI and the API. Consolidating both sides onto a shared module under
  `apps/web/lib/financials/` is a clean refactor candidate but is out of
  today's allow-list.
- **Financials fetch is not shared with the page.** The page still holds
  its own `getAnnualStatements` function. Each surface will make its own
  SEC `companyfacts` request (each with its own 5-minute
  `revalidate` window). Low impact under current traffic; becomes worth
  consolidating once XBRL is persisted through `sec_fs_statement_staging`.
- **No rate limiting / auth.** These endpoints are unauthenticated and
  have no per-caller quota. Day 72 is scope-limited to the read contract;
  rate limiting, API keys, and CORS posture are downstream concerns.
- **Filings list is SEC-window capped.** `queryFilings` caps at 200 rows
  before pagination, matching the existing read model. Deep paging beyond
  that cap is not possible until the internal `filing` table (schema
  `003_filings.sql`) becomes the data source.
