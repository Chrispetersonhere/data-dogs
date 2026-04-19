# Day 68 — Premium charts: Executive Pay Mix + Insider Heatmap

Date: 2026-04-19

## Scope

- Add `apps/web/lib/charts/executivePayMix.ts` — data-prep layer for an Executive Pay Mix stack built from the Summary Compensation Table of a DEF 14A proxy statement. Canonical component keys, a fixed stacking order, and helpers for stacked-segment layout, normalized (100%) mix, and grand-total aggregation.
- Add `apps/web/lib/charts/insiderHeatmap.ts` — data-prep layer for an Insider Activity Heatmap built from Form 4 aggregates. Dense role × month grid with transaction count, net shares, and gross share volume per cell, plus helpers for row/column totals and a `[0, 1]` intensity scale keyed to gross volume with a separate accumulation/distribution direction signal.
- Add `apps/web/tests/charts-3.spec.ts` — 43 offline tests exercising provenance fields, stacking invariants, percentage normalization, role/month totals, intensity math, and every rejection path on both validators.
- Update `docs/daily/day-68.md` with scope, rollback-rule check, and PowerShell-ready verification block.
- No homepage edits, no new chart types, no changes outside the four files listed in the brief.

## Changes made

### `apps/web/lib/charts/executivePayMix.ts` (new)

Public surface:

- `PayComponentKey` and `PAY_COMPONENT_ORDER` — canonical Summary Compensation Table components in fixed stacking order (`salary` → `bonus` → `stockAwards` → `optionAwards` → `nonEquityIncentive` → `pensionAndNqdc` → `otherCompensation`). Fixed order is what makes stacks visually comparable across NEOs.
- `PAY_COMPONENT_LABELS` — display label map. Tests assert the labels map and the order array stay in sync (same length, every key covered).
- `ExecutivePayRow` and `ExecutivePayMixData` — typed view models. Dataset metadata carries ticker, `companyName`, zero-padded `cik`, `fiscalYear`, `filingType` (`DEF 14A` / `DEFA14A`), `accession`, and `filingDate` so every rendered bar is traceable to its source filing.
- `APPLE_EXECUTIVE_PAY_MIX` — Apple Inc. FY 2023 Summary Compensation Table (CIK 0000320193, Accession 0000320193-24-000008, DEF 14A filed 2024-01-11). Five NEOs (Cook, Maestri, Adams, O'Brien, Williams) with explicit zero values where a component was not reported, so every row iterates the same canonical shape.
- `totalPay(row)` — strict sum over `PAY_COMPONENT_ORDER`; the CEO total is asserted at 61,393,528 USD (3M salary + 46.97M stock + 10.71M non-equity incentive + 0.71M other).
- `computePayMixStacks(data)` — builds stacked segments. Contract asserted by tests: segment count equals `PAY_COMPONENT_ORDER.length`, first `start === 0`, `segments[i].start === segments[i-1].end`, final `end === total`.
- `computePayMixPercent(data)` — normalized (100%) mix, rounded to 2 decimals. Tests allow ≤0.05 rounding tolerance on the per-NEO sum, and assert CEO stock-awards sits in the 70–80% band.
- `aggregatePayMix(data)` — roll-up across NEOs. Grand total equals the column sum of `totalsByComponent` (verified in test).
- `validateExecutivePayMix(data)` — rejects empty rows, missing metadata, duplicate names, negative component values, zero totals. Exercised by four rejection tests and one acceptance test.

Zero values are written out explicitly. That matters for auditability: an absent bonus line in Apple's proxy is a reported zero, not a data gap, and we want that on the record.

### `apps/web/lib/charts/insiderHeatmap.ts` (new)

Public surface:

- `InsiderRole` and `INSIDER_ROLE_ORDER` — the four Form 4 cover-page role buckets (`director`, `officer`, `tenPercentOwner`, `other`), rendered top → bottom in that order so heatmaps from different issuers are visually aligned.
- `INSIDER_ROLE_LABELS` — display label map; a sync test asserts it covers every role in `INSIDER_ROLE_ORDER`.
- `InsiderHeatmapCell` — one aggregated grid cell with `transactionCount` (filing-count activity), `netShares` (accumulation − distribution, signed), and `grossShares` (|acquired| + |disposed|, unsigned magnitude for the colour scale). Both signals are emitted so a renderer can colour by magnitude and hue-split by direction without re-deriving either.
- `InsiderHeatmapData` — dataset envelope. `ticker`, `companyName`, `cik`, `period`, the ordered `months[]` window, and one cell per `(role, month)` combination.
- `APPLE_INSIDER_HEATMAP_2024` — dense 4 × 12 grid for AAPL CY 2024 aggregated from Form 4 filings on SEC EDGAR (CIK 0000320193). Cells for inactive (role, month) combinations are emitted as explicit zeros so the grid is dense; ten-percent-owner rows are all zero for Apple because Apple has no reported >10% beneficial owner.
- `buildInsiderHeatmapGrid(data)` — addressable `{ months, rows[role][monthIndex] }` view. Missing cells are filled with zeros so downstream renderers iterate without null checks. Test `buildInsiderHeatmapGrid fills missing cells with explicit zeros` locks that contract.
- `computeRoleTotals(data)` / `computeMonthTotals(data)` — row and column roll-ups. Tests assert the sums match hand-computed totals (Feb 2024: 16 transactions, net −62,700 shares) and that officers are the biggest gross-volume bucket in Apple's 2024 sample.
- `computeHeatmapIntensities(data)` — `grossShares / max(grossShares)` rounded to 4 decimals, clamped to `[0, 1]`, plus a separate `direction ∈ {-1, 0, 1}` keyed to the sign of `netShares`. The peak cell has `intensity === 1` by construction (asserted by test).
- `validateInsiderHeatmap(data)` — rejects malformed ISO months (`2024-1` fails), duplicate months, cells referencing unknown months, duplicate (role, month) keys, `|netShares| > grossShares`, and negative counts. All six rejection paths are asserted by tests, plus an acceptance test.

### `apps/web/tests/charts-3.spec.ts` (new)

43 `node:test` cases, offline and deterministic. Grouped by chart so a failure immediately localises to either `executivePayMix` or `insiderHeatmap`:

- Pay-mix: metadata populated, 5 NEOs, CEO is Cook, all component values finite ≥ 0, unique NEO names, `PAY_COMPONENT_ORDER` sync with `PAY_COMPONENT_LABELS`, stack segments canonical & contiguous, total matches hand-verified CEO sum, percentage mix sums to ≈100 with ≤0.05 tolerance, CEO stock awards 70–80%, grand-total and per-component aggregates match column sums, validator rejects empty rows / duplicate names / negative values / empty accession.
- Heatmap: metadata populated, 12 consecutive 2024 months, dense `|roles| × |months|` cell count, no duplicate keys, `|net| ≤ gross` invariant on every cell, role/label sync, grid build alignment, Feb 2024 director grant cell preserved, zero-fill on missing cells, role totals match raw sums, officer is the biggest gross-volume bucket, month totals in order, Feb 2024 month total hand-verified (16 transactions, −62,700 net), intensities in `[0, 1]`, direction matches `sign(netShares)`, peak cell `intensity === 1`, validator rejects malformed months / duplicate months / unknown month in cell / duplicate (role, month) / `|net| > gross` / negative count.
- Structural: both modules export their advertised symbols.

## Rollback rule check

Rollback rule: revert if visuals are flashy instead of analytical.

- **Analytical, not flashy.** Both data layers emit structured, labelled data — no animations, no decorative transforms, no colour choices beyond the two semantic channels the Insider Heatmap needs (magnitude + direction). The Pay Mix stack uses a single canonical component order so bars are visually comparable across NEOs; the Heatmap's `intensity` is gross-volume-normalized so cells are comparable across roles and months.
- **Dense information per pixel.** Pay Mix shows total comp and mix in one bar. Insider Heatmap encodes three signals per cell (count, net, gross) with a principled `[0, 1]` intensity scale.
- **Real data only.** Pay Mix uses Apple FY 2023 DEF 14A as filed (accession 0000320193-24-000008). Insider Heatmap aggregates Apple CY 2024 Form 4 activity from SEC EDGAR CIK 0000320193. No synthetic fills beyond explicit zeros for reported-absent components and inactive (role, month) combinations — zeros are data, not padding.
- **Provenance preserved.** Every dataset carries ticker, company name, zero-padded CIK, period label, filing type / accession / filing date (pay mix) or source feed URL (heatmap). Validators refuse datasets that drop any of those fields.
- **No silent schema changes.** Component keys and role buckets are fixed by exported `PAY_COMPONENT_ORDER` / `INSIDER_ROLE_ORDER` constants; tests assert the label/order arrays stay in sync so a new component or role cannot be added silently.

## Acceptance checks

Run from the repo root. PowerShell-ready copy/paste block:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web test -- charts-3.spec.ts
pnpm --filter web build
pnpm --filter web test
```

`pnpm --filter web test -- charts-3.spec.ts` is the acceptance-targeted form (matches today's brief). `pnpm --filter web test` is the fallback and runs the full `apps/web` suite.

No `services/` files changed; Python suites are not required today. If you still want to exercise them:

```powershell
$env:PYTHONPATH="services/ingest-sec"; python -m pytest services/ingest-sec/tests -q
$env:PYTHONPATH="services/parse-xbrl"; python -m pytest services/parse-xbrl/tests -q
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/id-master"; python -m pytest services/id-master/tests -q
$env:PYTHONPATH="services/market-data"; python -m pytest services/market-data/tests -q
```

## Risks / follow-ups

- Both data layers are data-prep only today; they expose typed view models and pure helpers, no React components. A subsequent day should add `<ExecutivePayMixStack />` and `<InsiderActivityHeatmap />` under `packages/ui/components/charts/` and wire them into a company-scoped `/company/[companyId]/insiders` or a new compensation dashboard route. The stacking/intensity contracts asserted by tests are the stable surface those renderers will bind to.
- `APPLE_EXECUTIVE_PAY_MIX` is a checked-in constant. Once the proxy-parser service (`services/parse-proxy`) emits Summary Compensation Table rows in this shape, replace the constant with a fetch through `apps/web/lib/api/compensation.ts`. `validateExecutivePayMix` is the contract boundary for that swap.
- `APPLE_INSIDER_HEATMAP_2024` is aggregated offline from the Form 4 feed. Day-66 gave us the normalized Form 4 transaction classes; a follow-up should stream Form 4s through a server-side aggregator and replace the checked-in cells with live `(cik, yearMonth, role)` rollups. The dense-grid contract asserted by `buildInsiderHeatmapGrid fills missing cells with explicit zeros` is what lets the renderer stay stable across that transition.
- The heatmap's intensity scale is per-dataset (normalized to the max gross volume inside the provided window). When we render multiple issuers side-by-side we will need a shared-scale variant; that is additive and out of scope today.
- Joint Form 4 filings (multiple reportingOwner blocks in a single filing) are currently attributed to whichever role bucket the aggregator assigns. The validator does not enforce anything about joint filings; if we later surface joint attribution, add a `jointOwnerCount` field to `InsiderHeatmapCell` rather than overloading `transactionCount`.
