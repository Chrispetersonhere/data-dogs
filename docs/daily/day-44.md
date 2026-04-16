# Day 44 — Screener page

## Scope

Build the screener page with four required features:

- **Filter chips** – category-level filter indicators (size, growth, margin, leverage, liquidity)
- **Query summary** – displays active filters and result count
- **Premium results table** – company data with financial metrics
- **Responsive layout** – chip wrapping and horizontal table scroll on narrow viewports

## Changes

### Screener UI components (`packages/ui/src/components/screener/`)

- **`ScreenerFilterChips.tsx`** – renders five category chips with `aria-pressed` state, uses design tokens for styling.
- **`ScreenerQuerySummary.tsx`** – shows active filter tags and result count. Empty-state message when no filters active.
- **`ScreenerResultsTable.tsx`** – premium table with formatted market cap, revenue, margins, growth, and current ratio. Horizontal scroll wrapper for responsive behavior. Empty-state fallback when no rows match.
- **`index.ts`** – barrel export.

### Package registration (`packages/ui/package.json`, `packages/ui/src/index.ts`)

- Added `./components/screener` export path.
- Re-exported screener components from root barrel.

### Screener page (`apps/web/app/screener/page.tsx`)

- Server component consuming `filterScreenerRows` from the Day 43 query layer.
- Reads optional query params (`minMarketCap`, `minRevenue`, `minRevenueGrowth`, `minGrossMargin`, `minNetMargin`, `maxLiabilitiesToEquity`, `minCurrentRatio`) to apply filters.
- Renders all four required sections: filter chips, query summary, premium results table, responsive layout note.
- Uses static sample data representing five large-cap companies (AAPL, MSFT, AMZN, GOOGL, META).

### Tests (`apps/web/tests/screener-page.spec.ts`)

- 8 tests covering:
  - Acceptance of complete screener page markup
  - Rejection of placeholder leakage
  - Rejection of missing filter chips, query summary, and premium results table sections
  - Design token import validation for all three screener components

## Files touched

| File | Action |
|------|--------|
| `packages/ui/src/components/screener/ScreenerFilterChips.tsx` | Created |
| `packages/ui/src/components/screener/ScreenerQuerySummary.tsx` | Created |
| `packages/ui/src/components/screener/ScreenerResultsTable.tsx` | Created |
| `packages/ui/src/components/screener/index.ts` | Created |
| `packages/ui/package.json` | Updated (added screener export) |
| `packages/ui/src/index.ts` | Updated (added screener re-export) |
| `apps/web/app/screener/page.tsx` | Created |
| `apps/web/tests/screener-page.spec.ts` | Created |
| `docs/daily/day-44.md` | Created |

## Verification

```bash
pnpm --filter web test -- screener-page.spec.ts
pnpm --filter web test
pnpm --filter web build
pnpm lint
pnpm typecheck
```

All pass — 78 tests (8 new), build successful, zero lint warnings, typecheck clean.

### Windows PowerShell verification

> **Important:** All commands must run from the repository root (the folder
> containing `package.json`, `pnpm-workspace.yaml`, and `turbo.json`).

```powershell
# Navigate to your existing clone (adjust path as needed)
cd "$HOME\Documents\GitHub\data-dogs"

# Pull the latest branch
git fetch origin
git checkout copilot/update-documentation-for-changes-again
git pull origin copilot/update-documentation-for-changes-again

# Install deps
pnpm install

# Screener-specific tests (Day 44 acceptance)
pnpm --filter web test -- screener-page.spec.ts

# Full web test suite
pnpm --filter web test

# Build
pnpm --filter web build

# Typecheck
pnpm --filter web typecheck

# Lint (must be run from repo root)
pnpm lint
```

## Risks / follow-ups

- Sample data is static; a future day will connect to real pipeline output via an API route.
- Filter chips are server-rendered with `aria-pressed` state; client-side interactivity (toggling categories, input fields) will require a client component wrapper in a future iteration.
- The 200-row cap from the query layer is inherited; pagination will be needed when connected to real data.
