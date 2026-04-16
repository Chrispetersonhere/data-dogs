# Day 46 — Premium chart visuals: Peer Valuation Scatter & Restatement Diff Viewer

## Scope

Build two premium data-visualization data-prep layers:

- **Peer Valuation Scatter** — plots peer companies on Forward P/E vs EV/EBITDA axes with market-cap bubble sizing; computes peer-group statistics and valuation distances
- **Restatement Diff Viewer** — shows before/after values for restated financial line items with delta, percentage change, and materiality flagging
- Real SEC EDGAR data only; no placeholders
- Tests covering data integrity, computation correctness, and validation
- Documentation for the daily log

## Changes

### Peer Valuation Scatter (`apps/web/lib/charts/peerValuationScatter.ts`)

- **`PeerValuationPoint`** — type for a single company in the scatter (ticker, name, forwardPE, evToEbitda, marketCapBn, role).
- **`PeerValuationScatterData`** — full dataset with period, axis labels, size metric, and points array.
- **`TECH_PEER_VALUATION`** — FY 2024 large-cap tech scatter: AAPL (subject) vs MSFT, GOOGL, META, AMZN, NVDA. Data sourced from SEC EDGAR 10-K filings.
- **`PeerStats`** / **`computePeerStats()`** — computes mean and median Forward P/E and EV/EBITDA for the peer group (excluding subject). Used for reference cross-hair lines.
- **`ValuationDistance`** / **`computeValuationDistances()`** — computes Euclidean distance from peer-median point for each company. Highlights potential over/under-valuation.
- **`validatePeerValuationData()`** — validates exactly one subject, unique tickers, positive values, and minimum point count.

### Restatement Diff Viewer (`apps/web/lib/charts/restatementDiffViewer.ts`)

- **`RestatementLineItem`** — type for a single before/after line item.
- **`RestatementEvent`** — full restatement with ticker, company, period, disclosure date, filing type, SEC accession, CIK, reason, and items.
- **`GE_RESTATEMENT_FY2017`** — General Electric FY 2017 restatement (8 line items) sourced from SEC EDGAR 10-K/A filing. Covers insurance reserve adjustments and ASC 606 transition.
- **`RestatementDiff`** / **`computeRestatementDiffs()`** — computes delta, percentage change, and materiality flag for each line item.
- **`getMaterialDiffs()`** — filters to only material changes (configurable threshold, default 5%).
- **`RestatementImpactSummary`** / **`computeRestatementSummary()`** — aggregate summary: item count, material count, max absolute percentage change and which line item.
- **`validateRestatementEvent()`** — validates non-empty items, required metadata fields, and non-empty line-item names.

### Tests (`apps/web/tests/charts-2.spec.ts`)

- 30 tests covering:
  - Peer Valuation Scatter: point count, subject/peer roles, uniqueness, positivity, metadata, stats computation, distance computation, validation (valid, no-subject, duplicates, too-few)
  - Restatement Diff Viewer: item count, metadata, diff computation (delta, pctChange, materiality), material filtering, summary, max-change identification, validation (valid, empty items, empty ticker, empty line-item name)
  - Cross-chart structural assertions for exports

## Files touched

| File | Action |
|------|--------|
| `apps/web/lib/charts/peerValuationScatter.ts` | Created |
| `apps/web/lib/charts/restatementDiffViewer.ts` | Created |
| `apps/web/tests/charts-2.spec.ts` | Created |
| `docs/daily/day-46.md` | Created |

## Verification

```bash
pnpm --filter web test -- charts-2.spec.ts
pnpm --filter web test
pnpm --filter web build
```

### Windows PowerShell verification

> **Important:** All commands must run from the repository root (the folder
> containing `package.json`, `pnpm-workspace.yaml`, and `turbo.json`).

```powershell
# Navigate to your existing clone (adjust path as needed)
cd "$HOME\Documents\GitHub\data-dogs"

# Pull the latest branch
git fetch origin
git checkout copilot/update-financial-data-processing
git pull origin copilot/update-financial-data-processing

# Install deps
pnpm install

# Day 46 chart tests only
pnpm --filter web test -- charts-2.spec.ts

# Full web test suite
pnpm --filter web test

# Build
pnpm --filter web build

# Typecheck
pnpm --filter web typecheck

# Lint
pnpm lint
```

## Forbidden changes

- No homepage work
- No admin work

## Rollback rule

Revert if charts sacrifice clarity for style.

## Risks / follow-ups

- Valuation multiples are point-in-time snapshots from FY 2024; future days should connect to a live market-data pipeline.
- GE restatement data is from a single event; a future day could add a restatement database with multiple companies and periods.
- Materiality threshold is configurable but defaults to 5%; regulatory or audit contexts may require different thresholds.
- Bubble sizing in the scatter is linear market cap; a future enhancement could offer log-scale option.
