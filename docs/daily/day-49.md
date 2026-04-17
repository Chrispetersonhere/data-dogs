# Day 49 — Week-7 stabilization

## Scope

1. Clean up screener, peers, and notes rough edges — no new features
2. Improve test coverage with edge-case tests
3. Record known limits across Days 43–48 modules
4. Create week-7 review documentation
5. Preserve all existing behavior and test baselines

## Changes

### Screener page NaN guard (`apps/web/app/screener/page.tsx`)

- Added `safeParseNumber()` helper that rejects NaN and Infinity from malformed query params (e.g. `?minMarketCap=abc`).
- Replaced all raw `Number()` calls in `parseActiveFilters()` with `safeParseNumber()`.
- Previously, non-numeric query params would produce `NaN` filter values that silently caused all rows to fail matching. Now they are cleanly ignored.

### Notes API defensive guard (`apps/web/lib/api/notes.ts`)

- `getNotesForConcept()` now returns early with `found: false` for empty-string concepts instead of performing a map lookup with `""` as the key.

### New edge-case tests

#### Screener (`apps/web/tests/screener-api.spec.ts`) — 3 new tests

- Empty-object filters pass all rows (verifies `{}` categories don't accidentally reject)
- All-categories-active combined filter narrows results and validates all surviving rows
- Min-only and max-only ranges are preserved through normalization

#### Peers (`apps/web/tests/peers-page.spec.ts`) — 4 new tests

- Sub-million and zero currency formatting
- Zero percent and zero ratio formatting
- Empty peer array returns subject-only comparison
- Peer order preserved after deduplication with subject in peer list

#### Notes (`apps/web/tests/notes-panel.spec.ts`) — 4 new tests

- Empty string concept returns not-found
- De-duplication across overlapping financing concept sets
- Mixed known/unknown concepts returns correct disclosures
- All NoteDisclosure fields are non-empty for known concepts

### Documentation

- `docs/daily/day-49.md` — this file
- `docs/weekly/week-7-review.md` — week-7 review covering Days 43–49

## Known limits

These limits are documented here and in the week-7 review. They are intentional scope boundaries, not bugs.

| Area | Limit | Rationale |
|------|-------|-----------|
| Screener | Sample data is static (5 companies) | No backend pipeline connected yet |
| Screener | 200-row cap with no pagination | Safety net; pagination deferred |
| Screener | Only 7 of 14 filter params exposed via URL | Keeps URL simple; expand when connected to real data |
| Peers | Static peer set (AAPL vs 4 peers) | No dynamic peer selection API yet |
| Peers | 8 curated metrics are fixed | Intentional to prevent analytical noise |
| Notes | Concept-to-note mapping is static (US-GAAP 2024) | No live taxonomy API connected |
| Notes | Note panel is server-rendered (no client JS) | Click-to-dismiss requires future client component |
| Notes | Summary-level content only | Full text-block rendering deferred |
| Charts | Valuation multiples are point-in-time FY 2024 | No live market-data pipeline yet |
| Charts | GE restatement is a single event | Multi-company restatement database deferred |
| Performance | 5-min revalidation TTL | Conservative for SEC filing frequency |

## Files touched

| File | Action |
|------|--------|
| `apps/web/app/screener/page.tsx` | Updated (NaN guard) |
| `apps/web/lib/api/notes.ts` | Updated (empty-string guard) |
| `apps/web/tests/screener-api.spec.ts` | Updated (3 new tests) |
| `apps/web/tests/peers-page.spec.ts` | Updated (4 new tests) |
| `apps/web/tests/notes-panel.spec.ts` | Updated (4 new tests) |
| `docs/daily/day-49.md` | Created |
| `docs/weekly/week-7-review.md` | Created |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter web test
pytest services/parse-xbrl/tests -q
```

All pass — 166 tests (11 new), build successful, zero lint warnings, typecheck clean.

## Forbidden changes

- No compensation work
- No API auth changes

## Rollback rule

Revert any disguised scope creep.

## Risks / follow-ups

- The `safeParseNumber` guard silently ignores invalid params; a future iteration could surface a user-visible validation message.
- All known limits above are deferred to future days when real backend data pipelines are connected.
- No new features were added; all changes are defensive hardening and documentation.
