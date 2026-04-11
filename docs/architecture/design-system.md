# Design System Foundation (Premium / Institutional)

## Objective
Establish a conservative, reusable UI foundation for analytics-heavy finance workflows.

## Token Categories
Defined in `packages/ui/src/styles/tokens.ts`:
- **Color**: deep navy primary text, charcoal secondary text, off-white backgrounds, muted accent.
- **Spacing**: 4px scale from `0` to `16` for consistent density.
- **Typography**: Inter-focused sans stack with explicit size, line-height, and weight scales.
- **Radii**: from `none` to `pill` for cards, controls, and chips.
- **Borders**: standard 1px/2px options.
- **Shadows**: restrained elevation model (`sm`, `md`, `lg`) without decorative styling.
- **Breakpoints**: mobile `0px`, tablet `768px`, desktop `1200px`.

## Reusable Components
### Layout
- `PageContainer`: max-width content wrapper with page-level framing.
- `SectionHeader`: standardized title/subtitle/action header.

### UI Primitives
- `StatCard`: KPI presentation card for compact finance metrics.
- `PremiumTableShell`: bordered table scaffold for dense data panels.
- `TabStrip`: horizontal tab control with selected-state emphasis.
- `FilterChip`: compact selectable filter token.
- `EmptyState`: neutral fallback for absent content.

## Responsive Behavior
The showcase route demonstrates:
- **Mobile**: single-column card density.
- **Tablet**: 2-column stat grid at `>= 768px`.
- **Desktop**: 3-column stat grid at `>= 1200px`.

## Non-goals
- No decorative gradients or animation-led branding.
- No non-functional “illustration-first” components.
- No uncontrolled color expansion outside token definitions.
