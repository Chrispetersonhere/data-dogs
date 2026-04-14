# Day 28 - Month-1 Freeze

## Freeze actions completed
1. **P0/P1 only:**
   - Addressed QA type parsing stability issue (lint parser compatibility) in Day-27 API typing.
   - No new feature surface added.
2. **Docs aligned to implementation reality:**
   - Clarified Day-26/Day-27 targeted web test invocations still run suite due current script glob.
3. **Month-1 review written:**
   - Added `docs/monthly/month-1-review.md`.
4. **Cuts recorded:**
   - Documented deferred mapping rules, public UX expansions, and non-freeze scope.
5. **No feature additions:**
   - Freeze day intentionally constrained to stabilization/documentation.

## Acceptance checks run (this environment)
- `pnpm lint` *(blocked by environment pnpm/corepack network fetch restriction in this container)*
- `pnpm typecheck` *(blocked by environment pnpm/corepack network fetch restriction in this container)*
- `pnpm --filter web build` *(blocked by environment pnpm/corepack network fetch restriction in this container)*
- `pytest services/ingest-sec/tests -q` ✅
- `pytest services/id-master/tests -q` ✅
- `pytest services/parse-xbrl/tests -q` ✅

## Guardrails respected
- No new domains.
- No new routes.
- No feature work added during freeze.
