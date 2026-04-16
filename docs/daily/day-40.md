# Day 40 — Flagship Charts: Fundamentals Small Multiples & Margin Bridge Waterfall

## Scope

Build two production-quality, institutional-grade chart components for the
financial data platform:

1. **Fundamentals Small Multiples** — a responsive grid of small bar charts
   showing key financial metrics (Revenue, Net Income, Diluted EPS, Free Cash
   Flow, Gross Margin, Operating Margin) across five fiscal years (FY 2020–2024).

2. **Margin Bridge Waterfall** — a waterfall chart visualizing the income-statement
   cascade from Revenue → COGS → Gross Profit → R&D → SG&A → Operating Income →
   Other/Tax → Net Income.

## Data Source

All data is sourced from **Apple Inc. (AAPL)** 10-K filings on SEC EDGAR
(CIK 0000320193).  Figures are in USD millions except Diluted EPS (USD per share)
and margin metrics (percentage).

## Files Created / Updated

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/lib/charts/fundamentalsSmallMultiples.ts` | Created | Data types, sample data, validation for small multiples |
| `apps/web/lib/charts/marginBridgeWaterfall.ts` | Created | Data types, sample data, waterfall position computation, validation |
| `packages/ui/src/components/charts/FundamentalsSmallMultiples.tsx` | Created | SVG small-multiples React component |
| `packages/ui/src/components/charts/MarginBridgeWaterfall.tsx` | Created | SVG waterfall React component |
| `packages/ui/src/components/charts/index.ts` | Created | Barrel export for charts package |
| `packages/ui/src/index.ts` | Updated | Added charts barrel export |
| `packages/ui/package.json` | Updated | Added `./components/charts` export path |
| `apps/web/tests/charts.spec.ts` | Created | 20 acceptance tests for data integrity, validation, and structural contracts |
| `docs/daily/day-40.md` | Created | This document |

## Design Decisions

- **Pure SVG** — no external charting library; keeps bundle small, renders on
  server and client, and ensures full control over styling.
- **Design tokens** — all colors, fonts, spacing, and radii use the shared
  design-token system (`@data-dogs/ui/styles/tokens`).
- **Restrained interactions** — no animations, hover tooltips, or flashy gradients.
  Bars, gridlines, and precise axis labels only.
- **Institutional palette** — muted grays and blues for absolute bars, semantic
  red for cost deltas, semantic green for positive deltas.
- **Accessible** — all SVGs have `role="img"`, `aria-label`, and `<title>`.
- **Responsive** — small-multiples grid uses CSS `auto-fill` + `minmax`;
  waterfall uses `viewBox` with 100% width.

## Verification

```bash
pnpm --filter web build
pnpm --filter web test
```

All 20 chart tests should pass alongside the existing 28 tests.

## Risks / Follow-ups

- Real-time data wiring: currently uses static sample data; future days should
  connect to the live XBRL-parsed fact store.
- Additional metrics or companies may be requested for small-multiples panels.
- Waterfall connector lines assume left-to-right reading order.
