# Day 50 — Homepage information architecture redesign

## Scope

1. Create homepage IA document defining six required sections
2. Rewrite marketing page to match IA document structure
3. Remove generic SaaS design-system showcase content
4. Update CSS module for new grid layouts
5. Create daily log (this file)

## Changes

### Homepage IA document (`docs/marketing/homepage-ia.md`)

- Defined six-section information architecture:
  1. Trust Signal (hero) — filing types, provenance field count, point-in-time guarantee
  2. Filings to Facts — three-step ingest/parse/serve pipeline
  3. Compensation & Insider Modules — proxy pay and Forms 3/4/5 data
  4. Provenance Story — the six provenance fields explained
  5. API Story — v1 read-only endpoints listed
  6. Call to Action — terminal and API docs links
- Documented forbidden patterns (no hype, no vanity metrics)
- Documented design constraints (existing components, design tokens only)

### Marketing page rewrite (`apps/web/app/(marketing)/page.tsx`)

- Replaced design-system showcase with product-specific homepage
- Hero section uses `SectionHeader` (level 1) + three `StatCard` components
- Pipeline section uses card articles with step numbering
- Compensation and insider section uses two-column card layout
- Provenance section uses six-card grid explaining each provenance field
- API section uses six-card grid with monospace endpoint paths
- CTA section uses two styled links (primary inverse, secondary outlined)
- All styling uses design tokens — no arbitrary colors or spacing
- Removed unused imports (`EmptyState`, `FilterChip`, `PremiumTableShell`, `TabStrip`)

### CSS module update (`apps/web/app/(marketing)/page.module.css`)

- Added `.twoColGrid` class for compensation/insider two-column layout
- Added `.provenanceGrid` class for six-field provenance grid
- Added `.apiGrid` class for API endpoints grid
- Removed unused `.tableCell` class
- All grids responsive: 1-col mobile, 2-col tablet, 3-col desktop (where applicable)

## Files touched

| File | Action |
|------|--------|
| `apps/web/app/(marketing)/page.tsx` | Updated (full rewrite) |
| `apps/web/app/(marketing)/page.module.css` | Updated (new grid classes) |
| `docs/marketing/homepage-ia.md` | Created |
| `docs/daily/day-50.md` | Created |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter web test
```

All pass — 166 tests, build successful, zero lint warnings, typecheck clean.

## Forbidden changes

- No docs app changes
- No API route changes

## Rollback rule

Revert if messaging becomes hype-driven.

## Risks / follow-ups

- CTA links (`/overview`, `/docs/api`) point to routes that may not exist yet — they are valid navigation targets for the terminal and API docs.
- No homepage-specific tests exist; the page is server-rendered static content verified by build success and existing stabilization tests.
- The IA document should be reviewed by product stakeholders to confirm section ordering and messaging tone.
