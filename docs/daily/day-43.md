# Day 43 — Screener backend query layer

## Scope

Build the screener backend query layer with five filter categories:

- **size** – market cap, revenue, assets band filtering
- **growth** – revenue growth, earnings growth bounds
- **margin** – gross, operating, net margin bounds
- **leverage** – liabilities-to-equity, liabilities-to-assets bounds
- **liquidity** – current ratio, quick ratio bounds

No screener page UI. No peer page UI. Contract kept simple with `NumericRange` (optional min/max) applied uniformly.

## Changes

### Schema types (`packages/schemas/src/api/screener.ts`)

- Defined `NumericRange`, five category filter types (`ScreenerSizeFilter`, `ScreenerGrowthFilter`, `ScreenerMarginFilter`, `ScreenerLeverageFilter`, `ScreenerLiquidityFilter`), the combined `ScreenerFilters`, `ScreenerRow`, and `ScreenerResult` types.

### Query layer (`apps/web/lib/api/screener.ts`)

- `normalizeScreenerFilters()` — validates every range (min ≤ max) and returns a cleaned copy.
- `matchesScreenerFilters()` — pure predicate testing one row against all active filters. Null metric values fail any active range filter.
- `filterScreenerRows()` — normalizes filters, applies them to a row array, caps output at 200, and returns `ScreenerResult` with `totalMatched`.

### Tests (`apps/web/tests/screener-api.spec.ts`)

- 12 tests covering:
  - filter normalization (passthrough, rejection of min > max, empty object)
  - individual category matching (size, growth, margin, leverage, liquidity)
  - null-value handling
  - combined multi-category filtering
  - result structure and 200-row cap

## Files touched

| File | Action |
|------|--------|
| `packages/schemas/src/api/screener.ts` | Created |
| `apps/web/lib/api/screener.ts` | Created |
| `apps/web/tests/screener-api.spec.ts` | Created |
| `docs/daily/day-43.md` | Created |

## Verification

```bash
pnpm --filter web test -- screener-api.spec.ts
pnpm --filter web test
pnpm --filter web build
pnpm lint
pnpm typecheck
```

All pass — 70 tests (12 new), build successful, zero lint warnings.

## Risks / follow-ups

- The query layer is pure-function only; a future day will wire it to a route handler and the screener page UI.
- `ScreenerRow` values are expected to be pre-computed by upstream data pipelines; no SEC API calls are made by the screener layer itself.
- The 200-row cap is a safety net; pagination can be added when the screener page is connected.
