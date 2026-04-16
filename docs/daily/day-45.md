# Day 45 — Peer comparison page

## Scope

Build the peer comparison page with three required features:

- **Company + peer set comparison** – subject company highlighted against curated peers
- **Curated metric set** – 8 fixed metrics: market cap, revenue, gross margin, operating margin, net margin, revenue growth, current ratio, L/E ratio
- **Clean comparison table** – single table, no sprawling dashboard

## Changes

### Peers API layer (`apps/web/lib/api/peers.ts`)

- **`PeerCompanyRow`** – type for a single company in the comparison (all metrics required, no nulls).
- **`PeerComparisonEntry`** – extends row with `role: 'subject' | 'peer'` discriminator.
- **`PeerComparisonResult`** – full result with subject, peers array, ordered entries, and peer count.
- **`PeerMetricDescriptor`** / **`PEER_METRICS`** – curated set of 8 metric column definitions with label and format type.
- **`formatPeerMetric()`** – formats values as currency (T/B/M), percent, or ratio.
- **`buildPeerComparison()`** – pure function that builds the comparison result, deduplicates subject from peer list, and orders entries subject-first.

### Peers page (`apps/web/app/peers/page.tsx`)

- Server component rendering peer comparison for AAPL vs. MSFT, GOOGL, META, AMZN.
- Four sections: header, peer set summary, curated metrics list, comparison table.
- Subject row highlighted with accent background and bold weight.
- Role badges (Subject/Peer) in the table.
- Horizontal scroll wrapper for responsive behavior on narrow viewports.
- Uses design tokens throughout (colorTokens, spacingTokens, typographyTokens, radiusTokens).

### Tests (`apps/web/tests/peers-page.spec.ts`)

- 19 tests covering:
  - `buildPeerComparison` – structure, deduplication, empty peers, order preservation
  - `formatPeerMetric` – currency (T/B/M), percent, ratio formatting
  - `PEER_METRICS` – count and completeness of curated metric set
  - Markup acceptance – required text fragments, placeholder rejection, missing section rejection
  - Module export validation

## Files touched

| File | Action |
|------|--------|
| `apps/web/lib/api/peers.ts` | Created |
| `apps/web/app/peers/page.tsx` | Created |
| `apps/web/tests/peers-page.spec.ts` | Created |
| `docs/daily/day-45.md` | Created |

## Verification

```bash
pnpm --filter web test -- peers-page.spec.ts
pnpm --filter web test
pnpm --filter web build
```

All pass — 97 tests (19 new), build successful, `/peers` route renders as static page.

### Windows PowerShell verification

> **Important:** All commands must run from the repository root (the folder
> containing `package.json`, `pnpm-workspace.yaml`, and `turbo.json`).

```powershell
# Navigate to your existing clone (adjust path as needed)
cd "$HOME\Documents\GitHub\data-dogs"

# Pull the latest branch
git fetch origin
git checkout copilot/build-peer-comparison-page
git pull origin copilot/build-peer-comparison-page

# Install deps
pnpm install

# Peers-specific tests (Day 45 acceptance)
pnpm --filter web test -- peers-page.spec.ts

# Full web test suite
pnpm --filter web test

# Build
pnpm --filter web build

# Typecheck
pnpm --filter web typecheck

# Lint (must be run from repo root)
pnpm lint
```

## Forbidden changes

- No compensation module changes
- No API auth changes

## Rollback rule

Revert if peer page becomes analytically noisy.

## Risks / follow-ups

- Sample data is static; a future day will connect to real pipeline output via an API route or database query.
- Peer set is currently hardcoded; future work should allow user-configurable peer selection.
- The 8-metric curated set is intentionally fixed to prevent analytical noise; expanding it requires a design review.
