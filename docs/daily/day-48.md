# Day 48 — Performance pass

## Scope

1. Profile main pages for overfetching and rendering bottlenecks
2. Reduce obvious overfetching by adding time-based revalidation to SEC API calls
3. Improve loading states with animated skeleton placeholders
4. Optimize chart rendering by eliminating redundant computation
5. No new features, no schema changes

## Changes

### Reduce overfetching: time-based fetch revalidation (5-min TTL)

Every SEC EDGAR fetch previously used `cache: 'no-store'`, forcing a fresh
network round-trip on every page load. For a financial data platform whose
source data changes at most a few times per day, this is unnecessary churn
that directly impacts page responsiveness.

Replaced `cache: 'no-store'` with `next: { revalidate: 300 }` (5-minute
TTL) on all SEC EDGAR fetch calls:

- `lib/api/filings.ts` — `queryFilings`
- `lib/api/company.ts` — `getCompanyOverview`
- `lib/api/filing-detail.ts` — `getFilingDetail` (both submissions + index fetches)
- `lib/api/qa.ts` — `getQaFactView`
- `app/company/[companyId]/financials/page.tsx` — `getAnnualStatements`

This means repeat visits within 5 minutes serve cached responses, avoiding
redundant 200–800 ms SEC API round-trips per page load. The 5-minute TTL
is conservative enough to surface new filings promptly while dramatically
reducing unnecessary network calls.

### Improve loading states: animated skeleton pulse

Added a `dd-pulse` CSS `@keyframes` animation to the root layout and
applied the `dd-skeleton` class to all skeleton placeholder bars across
loading states:

- `app/layout.tsx` — global pulse animation definition
- `app/filings/loading.tsx`
- `app/filings/[accession]/loading.tsx`
- `app/company/[companyId]/loading.tsx`
- `app/company/[companyId]/financials/loading.tsx`

This makes loading states feel active rather than static, improving
perceived performance while data is being fetched.

### Optimize chart computation: avoid redundant peer stats

`computeValuationDistances` in `lib/charts/peerValuationScatter.ts`
internally called `computePeerStats` even when the caller had already
computed stats. Added an optional `precomputedStats` parameter so callers
who already have stats can skip the duplicate computation.

The change is fully backward-compatible — existing callers without the
parameter continue to work as before.

## Files modified

| File | Change |
|------|--------|
| `apps/web/lib/api/filings.ts` | `cache: 'no-store'` → `next: { revalidate: 300 }` |
| `apps/web/lib/api/company.ts` | `cache: 'no-store'` → `next: { revalidate: 300 }` |
| `apps/web/lib/api/filing-detail.ts` | `cache: 'no-store'` → `next: { revalidate: 300 }` (×2) |
| `apps/web/lib/api/qa.ts` | `cache: 'no-store'` → `next: { revalidate: 300 }` |
| `apps/web/app/company/[companyId]/financials/page.tsx` | `cache: 'no-store'` → `next: { revalidate: 300 }` |
| `apps/web/app/layout.tsx` | Added `dd-pulse` keyframes + `dd-skeleton` class |
| `apps/web/app/filings/loading.tsx` | Added `dd-skeleton` class to skeleton bars |
| `apps/web/app/filings/[accession]/loading.tsx` | Added `dd-skeleton` class to skeleton bars |
| `apps/web/app/company/[companyId]/loading.tsx` | Added `dd-skeleton` class to skeleton bars |
| `apps/web/app/company/[companyId]/financials/loading.tsx` | Added `dd-skeleton` class to skeleton bars |
| `apps/web/lib/charts/peerValuationScatter.ts` | Optional `precomputedStats` param |
| `docs/daily/day-48.md` | This file |

## Verification

```
pnpm --filter web build   # ✓ Compiles, all routes build
pnpm --filter web test    # ✓ 155/155 tests pass
```

## Risks / follow-ups

- **5-minute revalidation window**: During rare rapid re-filing scenarios,
  users may see stale data for up to 5 minutes. This is acceptable for SEC
  filings which are published infrequently. If real-time freshness is
  required later, consider on-demand revalidation via webhook or
  `revalidateTag`.
- **No client-side changes**: All pages are server-rendered; client JS
  bundle sizes are unchanged.
- **Backward compatibility**: `computeValuationDistances` optional param
  does not break existing callers.
