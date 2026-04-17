# Day 51 — Refined homepage build

## Scope

1. Create reusable marketing components in `packages/ui/src/components/marketing/`
2. Refine homepage with premium visual hierarchy and section dividers
3. Add subtle motion (CSS transitions on cards and CTAs, no keyframe animations)
4. Include real-data provenance example (Apple Inc. 10-K accession number)
5. Full responsiveness (mobile 1-col → tablet 2-col → desktop 3-col)

## Changes

### Marketing components (`packages/ui/src/components/marketing/`)

- **HeroHeadline** — Centered hero heading with bold `3xl` type, generous spacing, and refined subtitle
- **PipelineStep** — Step card with uppercase step label, subtle hover transition
- **ProvenanceField** — Compact provenance field card with transition
- **ApiEndpointCard** — Monospace endpoint path card with transition
- **FeatureCard** — General feature card for compensation/insider sections with transition
- **index.ts** — Barrel export for all marketing components
- All components use design tokens only — no arbitrary colors or spacing
- All components include `transition: box-shadow 0.2s ease, border-color 0.2s ease` for subtle interactive feedback

### Homepage refinement (`apps/web/app/(marketing)/page.tsx`)

- Replaced inline card `<article>` elements with dedicated marketing components
- Added `HeroHeadline` component for premium hero hierarchy (bold, centered, tight letter-spacing)
- Added real-data provenance example block showing an actual Apple Inc. 10-K accession number
- Added `<hr>` section dividers between all six sections for clear visual separation
- CTA buttons now include subtle opacity/border-color transitions on hover
- Removed `cardStyle` const — styling now encapsulated in dedicated components
- Removed unused `shadowTokens` import

### CSS module update (`apps/web/app/(marketing)/page.module.css`)

- Added `.pageMain` class with flex column layout and responsive gap
- Added `.heroSection` class with top padding
- Added `.sectionDivider` class for subtle horizontal rules between sections
- Added `.provenanceExample`, `.provenanceExampleLabel`, `.provenanceExamplePre` for real-data block
- Added `.ctaPrimary:hover` and `.ctaSecondary:hover` for subtle CTA transitions
- Grid classes now include explicit `gap` values in CSS (not inline styles)
- Tablet breakpoint now also increases `pageMain` gap from 2.5rem to 3rem

### UI package registration

- Added `"./components/marketing"` export to `packages/ui/package.json`
- Added `export * from './components/marketing'` to `packages/ui/src/index.ts`

### Homepage tests (`apps/web/tests/homepage.spec.ts`)

50 tests covering:
- All six section headings present
- All content fragments (components, API paths, provenance fields, CTAs, zero look-ahead)
- Forbidden patterns absent (revolutionary, game-changing, AI-powered, trusted by, testimonial)
- Real-data provenance example present with real accession number
- CSS responsive breakpoints (768px, 1200px) and mobile-first 1fr grid
- Marketing component files exist and are non-empty
- Marketing components import design tokens
- At least one marketing component uses subtle transitions
- No keyframe animations in marketing components
- Section divider class in CSS and used in homepage

## Files touched

| File | Action |
|------|--------|
| `apps/web/app/(marketing)/page.tsx` | Updated |
| `apps/web/app/(marketing)/page.module.css` | Updated |
| `apps/web/tests/homepage.spec.ts` | Created |
| `packages/ui/src/components/marketing/HeroHeadline.tsx` | Created |
| `packages/ui/src/components/marketing/PipelineStep.tsx` | Created |
| `packages/ui/src/components/marketing/ProvenanceField.tsx` | Created |
| `packages/ui/src/components/marketing/ApiEndpointCard.tsx` | Created |
| `packages/ui/src/components/marketing/FeatureCard.tsx` | Created |
| `packages/ui/src/components/marketing/index.ts` | Created |
| `packages/ui/src/index.ts` | Updated |
| `packages/ui/package.json` | Updated |
| `docs/daily/day-51.md` | Created |

## Verification

```bash
pnpm --filter web build
pnpm --filter web test
```

- Build: successful (homepage 398 B static page)
- Tests: 216 pass, 0 fail (50 new homepage tests)

## Forbidden changes

- No fake testimonials
- No flashy hero effects (no keyframe animations on marketing components)
- No hype language

## Rollback rule

Revert if homepage feels gimmicky or salesy.

## Risks / follow-ups

- CTA links (`/overview`, `/docs/api`) point to routes that may not exist yet
- Provenance example uses a real Apple 10-K accession; update if the filing is amended
- Hover transitions on cards use inline `transition` property — CSS module hover classes could enhance this further but require client-side interactivity beyond server components
