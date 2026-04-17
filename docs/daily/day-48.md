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

### Windows PowerShell — manual spot-checks

> **Important:** The commands below use `git grep` and `git show` which
> resolve paths relative to the **git repo root**, so they work from any
> subdirectory inside the clone. Do **not** use `Select-String` with
> relative paths — PowerShell cannot resolve `[companyId]` brackets and
> nested directory layouts (`data-dogs\data-dogs`) break path resolution.

```powershell
# ── Navigate anywhere inside the repo ──
# (adjust to wherever your clone lives)
cd C:\Users\lolvi\Documents\GitHub\data-dogs\data-dogs

# 1. Build + Tests (already confirmed: 155/155 pass)
pnpm --filter web build
pnpm --filter web test

# 2. No 'no-store' left in API files (expect: no output = PASS)
Write-Host "`n--- cache: no-store should be GONE ---"
git grep "no-store" -- "apps/web/lib/api/*.ts" "apps/web/app/company/*/financials/page.tsx"
if ($LASTEXITCODE -eq 1) { Write-Host "PASS: no-store removed from all API files" }
else { Write-Host "FAIL: no-store still present" }

# 3. revalidate: 300 present in every API file (expect: 6 matches)
Write-Host "`n--- revalidate: 300 should be PRESENT ---"
$r = git grep -c "revalidate: 300" -- "apps/web/lib/api/*.ts" "apps/web/app/company/*/financials/page.tsx"
$r | ForEach-Object { Write-Host "  $_" }
$total = ($r | ForEach-Object { ($_ -split ':')[-1] } | Measure-Object -Sum).Sum
if ($total -ge 6) { Write-Host "PASS: $total revalidate:300 occurrences found (expected >=6)" }
else { Write-Host "FAIL: only $total occurrences (expected >=6)" }

# 4. dd-pulse animation defined in layout
Write-Host "`n--- dd-pulse animation in layout ---"
git grep "dd-pulse" -- "apps/web/app/layout.tsx"
if ($LASTEXITCODE -eq 0) { Write-Host "PASS" } else { Write-Host "FAIL" }

# 5. dd-skeleton class in all 4 loading files (expect: >=25 matches)
Write-Host "`n--- dd-skeleton in loading files ---"
$s = git grep -c "dd-skeleton" -- "apps/web/app/*/loading.tsx" "apps/web/app/*/*/loading.tsx" "apps/web/app/*/*/*/loading.tsx"
$s | ForEach-Object { Write-Host "  $_" }
$totalSkel = ($s | ForEach-Object { ($_ -split ':')[-1] } | Measure-Object -Sum).Sum
if ($totalSkel -ge 20) { Write-Host "PASS: $totalSkel dd-skeleton refs across loading files" }
else { Write-Host "FAIL: only $totalSkel dd-skeleton refs" }

# 6. day-48 doc exists
Write-Host "`n--- day-48 doc ---"
git show HEAD:docs/daily/day-48.md | Select-Object -First 1
if ($LASTEXITCODE -eq 0) { Write-Host "PASS: day-48.md exists in tree" }
else { Write-Host "FAIL: day-48.md missing" }

# 7. precomputedStats optimization
Write-Host "`n--- precomputedStats in peerValuationScatter ---"
git grep "precomputedStats" -- "apps/web/lib/charts/peerValuationScatter.ts"
if ($LASTEXITCODE -eq 0) { Write-Host "PASS" } else { Write-Host "FAIL" }

Write-Host "`n=== ALL CHECKS COMPLETE ==="
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
