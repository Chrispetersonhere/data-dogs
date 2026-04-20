# Day 71 — Financial Statement Dashboard (trend, YoY, common-size)

Date: 2026-04-19

## Scope

- Extend `apps/web/app/company/[companyId]/financials` so each of the three annual statements renders a per-row trend sparkline, a year-over-year delta subscript in every value cell, and supports a `?view=absolute|common-size` URL toggle.
- Factor the view math into a pure, testable analytics module (`apps/web/lib/financials/analytics.ts`) that operates on the existing XBRL-derived row shape with no fetching and no React.
- Ship a reusable `TrendSparkline` in `@data-dogs/ui` (`packages/ui/src/components/charts/TrendSparkline.tsx`) and export it through the existing `./components/charts` subpath.
- Surface XBRL provenance on the page header: the exact SEC companyfacts URL and the fetch timestamp for the current request.
- No schema migrations, no new services, no new ingestion jobs. The XBRL fact staging tables (`packages/db/schema/007_fs_staging.sql`, `009_facts.sql`) already exist and are out of scope for this pass.

## Files touched

- `apps/web/app/company/[companyId]/financials/page.tsx` — wire in `parseFinancialsView`, the three analytics helpers, the "View" toggle, a new `Trend` column with `TrendSparkline`, and a YoY Δ subscript per value cell. Surface `sourceUrl` + `fetchedAt` on the hero card.
- `apps/web/lib/financials/analytics.ts` — new. Pure helpers: `computeRowYoYDeltas`, `computeYoYDeltas`, `computeCommonSize`, `buildTrendSeries`, `parseFinancialsView`, plus `COMMON_SIZE_DENOMINATOR`.
- `packages/ui/src/components/charts/TrendSparkline.tsx` — new. Pure-SVG sparkline for RSC. Pure geometry helper `buildTrendSparklineGeometry` is exported alongside so the math is unit-testable without rendering.
- `packages/ui/src/components/charts/index.ts` — re-export `TrendSparkline`.
- `apps/web/tests/financials-analytics.spec.ts` — new. 12 tests covering YoY deltas (including missing-year and zero-denominator cases), common-size (including missing and zero denominators), trend-series ordering, and `?view=` parsing.
- `apps/web/tests/trend-sparkline.spec.ts` — new. 8 tests covering empty input, single-point centering, path-command emission, even x-spacing, y-inversion, and direction classification.
- `docs/daily/day-71.md` — this file.

## Changes made

### `apps/web/lib/financials/analytics.ts` (new)

Pure module, no React, no fetch. Operates on `StatementRow` = `{ label, valuesByYear }`, which is a subset of the page's existing `StatementMetricRow` type — deliberately narrower so the analytics module does not depend on `conceptUsed` or other view-layer fields.

- **`computeRowYoYDeltas(row, years)`** — `years` is descending (most-recent-first, matching the page's column order). Emits a delta for every year that has both a current and an immediately-prior value. Returns `percentChange: null` when the prior value is zero (division undefined); `absoluteChange` is always the raw subtraction. Missing years (either side) produce no entry for that year rather than a sentinel, so callers can safely iterate `Object.keys`.
- **`computeCommonSize(statementId, rows)`** — divides each row by the statement-specific denominator (`Revenue` for income, `Total assets` for balance, `Cash from operations` for cashflow). If the denominator row is absent, every returned row carries an empty `percentByYear` map instead of throwing, so the page can render `—` placeholders instead of erroring. If the denominator is present but the year's denominator value is zero or missing, the specific cell is `null`. The denominator anchor is exported as `COMMON_SIZE_DENOMINATOR` so the page's description copy can reference the same source of truth.
- **`buildTrendSeries(rows, years)`** — builds ascending-year point arrays (leftmost = oldest). Non-finite values are filtered out, which drops rows with missing facts cleanly. A row with no numeric values returns an empty `points` array; the sparkline renderer treats that as "trend unavailable" and emits a `No trend` placeholder with an `aria-label` explaining why.
- **`parseFinancialsView(raw)`** — collapses anything other than the literal string `common-size` to `absolute`, matching the conservative default behavior for unknown/typo'd query strings.

### `apps/web/app/company/[companyId]/financials/page.tsx`

- **Provenance on the hero card.** Added a new paragraph on the hero card listing the full SEC companyfacts URL and the request-time `fetchedAt` ISO timestamp captured immediately after the fetch resolves. Every rendered row is still traceable to the SEC source via the "Source concept" column already present; the header footer now makes the fetch itself traceable too. No persistence is introduced — the page still fetches on request with Next.js's `revalidate: 300` cache.
- **View toggle.** New `<section>` between the existing "Period toggle" and the first statement, labeled `View`, holding two anchor-styled buttons inside a `role="group"` container. The active view uses `aria-current="page"` (`aria-pressed` would fail `jsx-a11y/role-supports-aria-props` on `<a>` elements). Switching views drops any `?note=` query string — we treat a view change as a navigation that closes the notes panel.
- **`buildLinkHref` helper.** Small URL builder for the view-toggle anchors. Uses `URLSearchParams` to avoid `?&` concatenation bugs. The note-icon anchors keep their original inline template literals so the literal substring `?note=` remains in the page source, which `apps/web/tests/notes-panel.spec.ts` asserts.
- **Trend column.** Added a `Trend` header between the last year column and `Source concept`. Each row's trend cell renders `<TrendSparkline>` with the row label for the `aria-label`. Tables now have `minWidth: '720px'` (was `600px`) to accommodate the extra column; narrow viewports already scroll horizontally via the existing `FinancialsTableShell`.
- **YoY Δ in value cells.** Each value cell now renders the absolute/common-size value on the first line and a second `<span>` underneath with the year-over-year percent, formatted as `+X.X% Y/Y` or `−X.X% Y/Y` (U+2212 minus) with a semantic color drawn from `colorTokens.signal.up|down|flat`. The oldest year (no prior) simply omits the subscript. Both lines carry `data-testid="yoy-<row-label>-<year>"` for downstream acceptance tests. Values the page cannot compute (row missing, prior-year missing, prior-year zero) omit the subscript rather than emit `—` — the subscript is secondary and clutter-free takes priority.
- **Common-size formatting.** New `formatCommonSizePercent(value)` emits `45.2%` format or `—` for `null|undefined|non-finite`, mirroring the existing `formatMoney` shape.

### `packages/ui/src/components/charts/TrendSparkline.tsx` (new)

- **Pure SVG, server-renderable.** No `'use client'`, no hooks, no event handlers. Works inside the RSC boundary the financials page sits in.
- **`buildTrendSparklineGeometry(points, width?, height?)`.** Exported alongside the component so the math is unit-testable. Returns `null` for empty input so the component can render a `No trend` placeholder with an appropriate `aria-label`. Y axis is inverted (larger values render higher on screen) via `PADDING + plotH - ((value - min) / range) * plotH`. When all values are equal, `range = 0` collapses every y to the vertical midline rather than dividing by zero.
- **Direction classification.** Compares last and first point values. `up`/`down`/`flat` drives the stroke color via `colorTokens.signal` and is also emitted as `data-trend-direction` on the root `<svg>` so downstream tests can assert without color inspection.

## Provenance posture

- Raw XBRL facts are still fetched at render time from `https://data.sec.gov/api/xbrl/companyfacts/CIK{padded}.json` with the existing `SEC_USER_AGENT` header. The URL and a request-time `fetchedAt` ISO timestamp are surfaced on the hero card; no row is displayed whose upstream concept cannot be shown in the `Source concept` column.
- The analytics module is deterministic over `(rows, years)` — no timestamps, no random sampling — so the same raw facts always produce the same YoY, common-size, and trend outputs.
- No new raw artifacts, no new persistence, no new ingestion jobs. The existing `sec_fs_dataset_raw` / `xbrl_fact_raw` tables remain the correct place for future persistence work; this pass does not use them.
- No mixing of quarterly into annual: `ANNUAL_FORMS` + `point.fp === 'FY'` gating is unchanged.

## Verification

From a clean checkout, on Windows PowerShell:

```powershell
pnpm install
pnpm --filter web typecheck
pnpm --filter "@data-dogs/ui" typecheck
pnpm lint
pnpm --filter web test
pnpm --filter web build
```

At time of writing on this worktree: `pnpm --filter web test` reports 354 tests, 0 failures (including the 20 new tests shipped today). `pnpm lint` reports 0 warnings across `web`, `@data-dogs/ui`, and `@data-dogs/db`. `pnpm --filter web build` emits 14 static/dynamic routes with no errors, including `/company/[companyId]/financials`.

## Risks / follow-ups

- **No persisted XBRL staging.** The page still hits SEC on every miss of the 5-minute Next.js data cache. When traffic scales, route this through the existing `sec_fs_statement_staging` (schema `007`) with a daily ingest job, and surface the `raw_checksum_sha256` on the hero alongside the source URL.
- **Common-size denominators are hard-coded.** `Revenue`, `Total assets`, `Cash from operations` are string-matched against `STATEMENT_SPECS` labels. A label rename on the page would silently break common-size math — `COMMON_SIZE_DENOMINATOR` is exported specifically so a single future refactor can move both the label and the anchor in one edit.
- **Trend column widens tables.** `minWidth: '720px'` is 120px wider than before. Viewports under ~768px now scroll horizontally inside `FinancialsTableShell` (they already did at 600px on the smallest phones). No layout change was needed in the shell.
- **No quarterly / TTM integration yet.** The `Period toggle` still shows `Quarterly` as a non-navigable label. Wiring the toggle to a live route is the natural follow-up (separate day — see the 8-feature backlog).

---

# Day 71 (second pass) — Public API read models

Date: 2026-04-20

The first Day 71 pass (above) shipped the financial statement dashboard on 2026-04-19. This second pass adds a disjoint Day 71 deliverable: the stable public API read-model contracts. The two passes touch disjoint file sets and the first pass's work is not modified.

## Scope

- Define stable public API read-model contracts under `packages/schemas/src/api/` for five endpoints: companies, filings, financials, compensation, insiders.
- Stamp each contract with a per-module `API_VERSION` literal so clients can detect version drift on the envelope, not the URL.
- Design fields conservatively and do not leak internal raw-storage provenance — no checksum, parser version, ingest job id, internal fetch timestamp, or DB surrogate key escapes into the public surface.
- Preserve point-in-time SEC traceability — every row carries public `accession`, `filingDate`, and a source URL that resolves back to the original SEC document.
- No route handlers, no auth, no runtime code. Pure TypeScript types; acceptance is type-checks clean.

## Files created / updated (second pass)

- **Created** `packages/schemas/src/api/companies.ts`
- **Updated** `packages/schemas/src/api/filings.ts` (re-shaped to the versioned envelope; no prior consumers in-tree)
- **Created** `packages/schemas/src/api/financials.ts`
- **Created** `packages/schemas/src/api/compensation.ts`
- **Created** `packages/schemas/src/api/insiders.ts`
- **Updated** `docs/daily/day-71.md` (this appended section)

No other files were touched. `packages/schemas/src/api/screener.ts` and the `packages/schemas/src/domain/*` files are intentionally left alone — not in today's allow-list.

## Design principles

### Versioning

Each module exports a local `API_VERSION` literal and a `typeof`-derived alias:

```ts
export const FINANCIALS_API_VERSION = '1' as const;
export type FinancialsApiVersion = typeof FINANCIALS_API_VERSION;
```

The top-level response envelope for each endpoint carries `apiVersion: <ModuleApiVersion>`. This lets clients discriminate on the envelope without parsing the URL, and lets each contract evolve at its own cadence — a v2 `insiders` response can ship before a v2 `financials` response.

### Conservative field design

- Every response is an explicit object envelope, never a bare array. Envelopes carry `apiVersion`, `generatedAt`, and the primary payload plus any auditing echoes (`filtersApplied`, `sources`). A bare array shape would leave no room to add paging, error summaries, or schema metadata without a breaking change.
- Nullable (`T | null`) is used for fields the underlying SEC feed legitimately omits (ticker, exchange, SIC description, share count on a grant-only Form 4 row). Optional (`T | undefined`) is reserved for inputs where the client may or may not supply a filter, not for outputs.
- Unions are stable enums, not open strings. Where the upstream SEC form string has a long tail we do not want to enumerate exhaustively (e.g. `form` on insider rows), we use the `Type | (string & {})` idiom to keep editor autocomplete while admitting future form codes.
- Units and currency are declared on the envelope (`currency: 'USD'`, `units: 'currency'`) rather than on each row, so rows stay lean and so a future v2 currency expansion forces the caller to notice.

### No leaking internal raw-storage implementation details

The following internal fields exist in the ingestion / normalizer layer (`services/market-data/src/insider_ingest.py`, `services/market-data/src/normalize_insiders.py`, and the planned `services/parse-proxy` compensation parser) but are intentionally absent from every public response:

- `raw_insider_artifact_id`, `raw_artifact_id`, `rawArtifactId`
- `source_checksum`, `checksum_sha256`, `sourceChecksum`
- `parser_version`, `parserVersion`, `normalizer_version`, `normalizerVersion`
- `ingest_job_id`, `ingestJobId`
- `source_fetched_at`, `sourceFetchedAt` (that is the internal HTTP fetch time, not the SEC-public timestamp)
- `recorded_at`, `recordedAt`, `normalized_at` (internal DB write times)
- Internal surrogate keys: `insider_id`, `executive_id`, `comp_summary_id`, `comp_award_id`, `executive_role_history_id`, `governance_fact_id`
- Raw XBRL concept keys (`us-gaap:Revenues`, `us-gaap:ProfitLoss`) and per-concept `FactPoint` trees; the financials contract publishes stable labels and a year map only.
- Parser heuristics state (which regex matched, how many rows were rejected, which table shape was chosen).

### Public provenance that IS preserved

Every transformed fact remains traceable to its raw source via the public projection of provenance:

| Contract       | Public provenance on each row                                           |
| -------------- | ----------------------------------------------------------------------- |
| `companies`    | `accession`, `filingDate`, `form`, `primaryDocument` on recent filings  |
| `filings`      | `accession`, `filingDate`, `formType`, `primaryDocUrl`, `filingIndexUrl` |
| `financials`   | envelope-level `sourceUrl` (SEC companyfacts), `fetchedAt`, `years[]`   |
| `compensation` | `accession`, `filingDate`, `form`, `sourceUrl`                          |
| `insiders`     | `accession`, `filingDate`, `form`, `primaryDocUrl`, `filingIndexUrl`    |

All five contracts carry `generatedAt` on the envelope so a consumer can tell how fresh the server-side view is, distinct from the filing age.

## Contract summary

### `companies.ts`

Exports:

- `COMPANIES_API_VERSION`, `CompaniesApiVersion`
- `CompanyIdentifiers` — `cik` (zero-padded) + `companyId` (digits-only)
- `CompanyProfile` — public descriptive fields
- `CompanyIdentityHistoryEntry` — former names with `from`/`to`
- `CompanyFilingFootprint` — filing-count rollups
- `CompanyRecentFilingSummary` — lightweight filing handle for lists
- `CompanyProfileResponse` — envelope

### `filings.ts`

Exports:

- `FILINGS_API_VERSION`, `FilingsApiVersion`
- `FilingRecord` — one filing, including canonical `primaryDocUrl` and `filingIndexUrl` so callers never reconstruct SEC URLs
- `FilingsQuery` — external query parameters
- `FilingsFiltersApplied` — server-side echo of normalized filters
- `FilingsListResponse` — envelope

### `financials.ts`

Exports:

- `FINANCIALS_API_VERSION`, `FinancialsApiVersion`
- `FinancialsStatementId` = `'income' | 'balance' | 'cashflow'`
- `FinancialsMetricRow` — label + sparse `valuesByYear`
- `FinancialsStatement` — ordered rows for one statement
- `FinancialsProvenance` — `sourceUrl` + `fetchedAt`
- `FinancialsConsistencyStatus`, `FinancialsConsistency` — cheap balance-sheet sanity-check projection
- `CompanyFinancialsResponse` — envelope with envelope-level `currency`, `units`, `years[]`

### `compensation.ts`

Exports:

- `COMPENSATION_API_VERSION`, `CompensationApiVersion`
- `CompensationFilingForm` = `'DEF 14A' | 'DEFA14A'`
- `CompensationRowProvenance` — public-safe provenance projection
- `CompensationRow` — one SCT row with top-line `totalCompensationUsd`
- `CompensationHistoryPoint` — (executive, fiscalYear) rollup + latest-filing back-link
- `CompensationSource` — one filing the response consulted
- `CompanyCompensationResponse` — envelope

v1 publishes only the Summary-Compensation-Table total, not per-component breakdowns. Expanding to salary / bonus / stock / option / non-equity / pension / all-other components is a v2 candidate once the parser stabilises across irregular issuer layouts (see `docs/daily/day-70.md` risks).

### `insiders.ts`

Exports:

- `INSIDERS_API_VERSION`, `InsidersApiVersion`
- `InsiderRoleFilter`, `INSIDER_ROLE_FILTERS` (readonly tuple)
- `InsiderRoleFlags` — all four `<reportingOwnerRelationship>` booleans
- `InsiderAcquiredOrDisposed` = `'A' | 'D'`
- `InsiderTransactionClass` = `'buy' | 'sell' | 'grant' | 'derivative_event' | 'holdings_change' | 'ambiguous'` — stable projection of the Day 66 normalizer; the free-text `reason` is internal and not exposed.
- `InsiderRowProvenance` — public-safe provenance projection
- `InsiderActivityRow` — includes `transactionClass`; `shares`, `pricePerShare`, `sharesOwnedAfter` are nullable to preserve SEC-reported nulls without synthesising values
- `InsiderFilingSource` — one filing the response considered
- `CompanyInsidersResponse` — envelope

## Rollback rule check

Rollback rule: **revert if read models expose unstable internals.**

- Walked the ingestion data classes (`services/market-data/src/insider_ingest.py`) and confirmed none of `raw_insider_artifact_id`, `checksum_sha256`, `parser_version`, `ingest_job_id`, `source_fetched_at`, `recorded_at` are present on any exported type.
- Confirmed no internal surrogate ID (`insider_id`, `executive_id`, `comp_summary_id`, `comp_award_id`, `executive_role_history_id`, `governance_fact_id`) is present.
- Confirmed no raw XBRL concept key (`us-gaap:*`) or raw `FactPoint` shape is exposed on the financials response.
- Confirmed no normalizer free-text `reason` is exposed on insider rows.
- No route handler was added, no auth code was added, no runtime behavior changed.

If a future change proposes to surface any of the fields on the "intentionally absent" list above, the right place is a new v2 envelope or an explicit admin-only contract, not the public v1 surface.

## Explicit non-goals

- **No route handlers.** These contracts describe the shape of future `/api/v1/*` responses, but the endpoints themselves are out of scope.
- **No auth.** Not in today's list.
- **No `packages/schemas/package.json` or `tsconfig.json`.** The package has no workspace manifest today; adding one would expand scope beyond the listed files. The contract files still type-check cleanly under the root `tsconfig.base.json` settings (verified with `tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck` against the five files).
- **No change to `packages/schemas/src/api/screener.ts` or `packages/schemas/src/domain/*`.** Not in today's list; they pre-date the versioned envelope pattern and will be reconciled on a later day.
- **No change to any `apps/web/lib/api/*.ts` runtime module.** The web wrappers keep their current, implementation-coupled types; adapting them to the new contracts (or swapping the web shell to consume `@data-dogs/schemas/api/*`) is a separate Week 11 task.

## Acceptance checks (PowerShell — copy-pasteable block)

Run from the repo root in Windows PowerShell:

```powershell
git fetch origin
git checkout claude/setup-monorepo-inspection-nMpnG
git pull origin claude/setup-monorepo-inspection-nMpnG

pnpm install

pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# The contract files live outside any current workspace manifest,
# so verify them standalone too:
npx tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck `
  packages/schemas/src/api/companies.ts `
  packages/schemas/src/api/filings.ts `
  packages/schemas/src/api/financials.ts `
  packages/schemas/src/api/compensation.ts `
  packages/schemas/src/api/insiders.ts

$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/market-data"; python -m pytest services/market-data/tests -q
```

The brief's acceptance test is "all response contracts exist and are type-checked"; the standalone `npx tsc` invocation above is the one that directly exercises that against the five new files. The rest of the palette is the standard Day 71 acceptance set and confirms nothing else in the monorepo regressed.

## Risks / follow-ups (second pass)

- **Schemas package is not yet a workspace.** `packages/schemas` has no `package.json` or `tsconfig.json`, so `pnpm typecheck` does not cover these files. The standalone `npx tsc` command above is the authoritative check today. Wiring `packages/schemas` as a first-class workspace (`@data-dogs/schemas`) with `typecheck` + `lint` scripts, and exporting the five `./api/*` subpaths the way `@data-dogs/ui` does, is a Week 11 candidate.
- **No web wrappers have been migrated.** `apps/web/lib/api/*.ts` still declares its own ad-hoc types that partially overlap with the new contracts (e.g. `CompensationRow`, `InsiderActivityRow`). Migrating the web wrappers to re-export from `@data-dogs/schemas/api/*` will surface any mismatches; that migration should be staged endpoint-by-endpoint, not as a single sweep.
- **`transactionClass` is not yet on the live insiders wrapper.** `apps/web/lib/api/insiders.ts` does not populate a `transactionClass` on its `InsiderActivityRow` today. The public contract includes it because the Day 66 normalizer can compute it; the web wrapper will need to invoke that normalizer (or its TypeScript port) before it can satisfy the v1 insiders response shape.
- **Compensation component breakdowns are out of v1.** If analyst feedback demands salary / bonus / stock / option breakouts before the parser stabilises, we should add them behind a v2 envelope rather than loosening the v1 total-only contract.
