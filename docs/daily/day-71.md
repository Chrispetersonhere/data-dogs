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
