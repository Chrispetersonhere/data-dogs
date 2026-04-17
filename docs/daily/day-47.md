# Day 47 — Note Disclosure Retrieval UI

## Scope

- Add a note/disclosure panel that users can open from a financial line item
- Panel shows linked SEC XBRL note/disclosure content where available
- Keep the panel elegant and secondary to the primary financial table
- Map financial line-item concepts to their related US-GAAP taxonomy note text blocks
- Add comprehensive tests for the API layer, component, and integration

## Changes

### Notes API (`apps/web/lib/api/notes.ts`)

- **`NoteDisclosure`** — type representing a linked note (concept, title, summary, taxonomySection)
- **`NoteDisclosureResult`** — lookup result with `found` flag and disclosures array
- **`CONCEPT_TO_NOTES`** — static mapping from 20+ financial concepts to their related note text-block concepts, derived from US-GAAP 2024 taxonomy presentation linkbase
- **`getNotesForConcept()`** — look up notes linked to a single financial line-item concept
- **`getNotesForConcepts()`** — batch lookup with de-duplication across multiple concepts

### NotesPanel component (`packages/ui/src/components/notes/NotesPanel.tsx`)

- Slide-out panel rendered from the right edge of the viewport
- Uses `role="dialog"` with proper `aria-label` for accessibility
- Displays line item label, source concept, and linked note cards
- Each note card shows title, summary, and ASC taxonomy reference
- Empty state when no notes are linked
- Returns `null` when `open` is `false` (no DOM output when hidden)
- Width constrained to 380px / 90vw to stay secondary to the table
- All styling uses design tokens — no hardcoded hex values

### Financials page integration (`apps/web/app/company/[companyId]/financials/page.tsx`)

- Added `searchParams` prop to accept `?note=<label>` query parameter
- Each financial row with a known concept gets a subtle ℹ icon link
- Clicking the icon navigates to `?note=Revenue` (etc.) to open the panel
- Panel renders conditionally when `notePanelData` is resolved
- No client-side JavaScript required — works with server-side rendering
- Primary table structure fully preserved (FinancialsTableShell, PeriodToggle, sticky headers, export attributes)

### UI package exports

- Added `./components/notes` export path to `packages/ui/package.json`
- Added notes re-export to `packages/ui/src/index.ts`
- Created barrel export at `packages/ui/src/components/notes/index.ts`

### Tests (`apps/web/tests/notes-panel.spec.ts`)

- 28 tests covering:
  - Notes API: concept mapping for revenue/income/balance/cashflow, multi-note results, unknown concepts, de-duplication, batch lookup, field validation
  - NotesPanel markup: dialog role, aria-label, data-testid, empty state, design token usage, width constraints, taxonomy display
  - Financials integration: note icon links, conditional rendering, API import, concept-gated icons, preserved table structure
  - Forbidden text checks on both API and component sources
  - UI package export verification

## Files touched

| File | Action |
|------|--------|
| `apps/web/lib/api/notes.ts` | Created |
| `packages/ui/src/components/notes/NotesPanel.tsx` | Created |
| `packages/ui/src/components/notes/index.ts` | Created |
| `packages/ui/src/index.ts` | Updated |
| `packages/ui/package.json` | Updated |
| `apps/web/app/company/[companyId]/financials/page.tsx` | Updated |
| `apps/web/tests/notes-panel.spec.ts` | Created |
| `docs/daily/day-47.md` | Created |

## Verification

```bash
pnpm --filter web test -- notes-panel.spec.ts
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
git checkout copilot/update-documentation-for-changes-another-one
git pull origin copilot/update-documentation-for-changes-another-one

# Install deps
pnpm install

# Day 47 notes panel tests only
pnpm --filter web test -- notes-panel.spec.ts

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

- No new metrics
- No screener changes

## Rollback rule

Revert if note panel overwhelms the primary financial table UX.

## Risks / follow-ups

- The concept-to-note mapping is static and derived from US-GAAP 2024 taxonomy; future days should connect to a live taxonomy API to stay current with taxonomy updates.
- Note content is summary-level; a future enhancement could fetch and render the full text-block content from the issuer's XBRL filing.
- Panel open/close is driven by URL search params (server-side); a future enhancement could add client-side JavaScript for smoother transitions and a close button.
- The backdrop overlay is rendered but currently non-interactive server-side; adding a client component wrapper would allow click-to-dismiss behavior.
