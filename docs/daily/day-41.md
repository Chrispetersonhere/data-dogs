# Day 41 — Responsive polish

## Scope

Audit and fix responsive breakpoint issues across core pages:

- Table overflow
- Chart clipping
- Spacing breakdowns
- Bad heading hierarchy
- Mobile scanability issues

No new features. No schema or service changes.

## Changes

### Heading hierarchy

- **`packages/ui/src/components/layout/SectionHeader.tsx`**: Added optional `level` prop (1 | 2, default 2) so callers can render `<h1>` when semantically appropriate.
- **`apps/web/app/(marketing)/page.tsx`**: Set `level={1}` on the main "Premium Design System Showcase" heading. Previously the marketing page had no `<h1>`.

### Table overflow

- **`apps/web/app/admin/artifacts/page.tsx`**: Added `minWidth: '900px'` to the provenance table, `whiteSpace: 'nowrap'` on header cells, `wordBreak: 'break-all'` on Source URL column (capped at 260px), and monospace font on Checksum column for scanability.
- **`apps/web/app/admin/jobs/page.tsx`**: Added `minWidth: '700px'` to the jobs table and `whiteSpace: 'nowrap'` on all cells so columns don't collapse on narrow viewports.
- **`apps/web/app/admin/qa/page.tsx`**: Added `minWidth` to raw-facts table (600px) and discrepancies table (560px) with `whiteSpace: 'nowrap'` on all header cells.
- **`apps/web/app/company/[companyId]/page.tsx`**: Added `minWidth: '600px'` to the latest filings summary table and `whiteSpace: 'nowrap'` on header cells.

### Spacing breakdowns

- **`apps/web/app/company/[companyId]/page.tsx`**: Reduced shell padding from 32px to 16px so the layout doesn't waste horizontal space on mobile.
- **`apps/web/app/company/[companyId]/financials/page.tsx`**: Reduced shell padding from 28px to 16px.

### Chart clipping

- **`packages/ui/src/components/charts/FundamentalsSmallMultiples.tsx`**: Added `overflowX: 'auto'` and `maxWidth: '100%'` to the grid container to prevent chart panels from clipping or overflowing on very narrow viewports.

### Mobile scanability

- **`packages/ui/src/components/filings/FilingsSearchFilters.tsx`**: Reduced grid column minimum from 180px to 140px for better single-column stacking on narrow phones. Added `boxSizing: 'border-box'` to inputs to prevent padding-induced overflow.
- **`apps/web/app/admin/qa/page.tsx`**: Added `flexWrap: 'wrap'` to the CIK search form so the button wraps below the input on narrow screens.

## Files touched

| File | Action |
|------|--------|
| `packages/ui/src/components/layout/SectionHeader.tsx` | Updated |
| `apps/web/app/(marketing)/page.tsx` | Updated |
| `apps/web/app/admin/artifacts/page.tsx` | Updated |
| `apps/web/app/admin/jobs/page.tsx` | Updated |
| `apps/web/app/admin/qa/page.tsx` | Updated |
| `apps/web/app/company/[companyId]/page.tsx` | Updated |
| `apps/web/app/company/[companyId]/financials/page.tsx` | Updated |
| `packages/ui/src/components/charts/FundamentalsSmallMultiples.tsx` | Updated |
| `packages/ui/src/components/filings/FilingsSearchFilters.tsx` | Updated |
| `docs/daily/day-41.md` | Created |

## Verification

```bash
pnpm --filter web build
pnpm --filter web test
```

## Risks / follow-ups

- Inline style padding reduction (32→16px, 28→16px) is a safe universal improvement; desktop still looks fine because the `maxWidth` container centers content.
- `minWidth` values on admin tables are estimates based on column count; adjust if real data shows different widths.
- Future work: consider CSS modules or a responsive shell component to replace repeated inline padding patterns across dark-theme pages.
