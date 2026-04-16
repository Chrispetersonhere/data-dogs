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

### Windows PowerShell verification

> **Important:** All commands must run from the repository root (the folder
> containing `package.json`, `pnpm-workspace.yaml`, and `turbo.json`).
> If you already have the repo cloned, do **not** `cd` into a nested
> `data-dogs` subdirectory — that puts you one level too deep and
> `pnpm lint` will fail with `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`.

```powershell
# Navigate to your existing clone (adjust path as needed)
cd "$HOME\Documents\GitHub\data-dogs"

# Pull the latest branch
git checkout copilot/update-docs-for-fix
git pull origin copilot/update-docs-for-fix

# Install deps
pnpm install

# Screener-specific tests (Day 43 acceptance)
pnpm --filter web test -- screener-api.spec.ts

# Full web test suite
pnpm --filter web test

# Typecheck
pnpm --filter web typecheck

# Build
pnpm --filter web build

# Lint (must be run from repo root)
pnpm lint
```

## Risks / follow-ups

- The query layer is pure-function only; a future day will wire it to a route handler and the screener page UI.
- `ScreenerRow` values are expected to be pre-computed by upstream data pipelines; no SEC API calls are made by the screener layer itself.
- The 200-row cap is a safety net; pagination can be added when the screener page is connected.
