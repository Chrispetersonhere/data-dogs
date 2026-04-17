# Day 54 - Month 2 Hardening

Date: 2026-04-17

## What changed

- Hardened `apps/web/lib/observability` by removing duplicate error-shape logic in `error-boundary.ts`.
- Renamed a confusing helper in `context.ts` from `normalizeId` to `normalizeHeaderId` to clarify intent and reduce maintenance risk.
- Reused shared log serialization (`serializeLogEntry`) in `buildErrorBoundaryLog` to reduce drift risk between logging paths.
- Added test coverage for unknown/non-`Error` values to ensure payload/log consistency for boundary failures.

## Acceptance criteria mapping

- **Remove duplicate logic**: centralized error detail derivation in `getErrorDetails`.
- **Rename confusing helpers**: `normalizeId` -> `normalizeHeaderId`.
- **Reduce Month-2 tech debt**: standardized error-boundary log serialization and message/name derivation.
- **No new features**: no routes, schemas, or product behavior added.

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web build`
- `pytest services/parse-xbrl/tests -q`

## Risk / rollback

- Low risk; changes are internal helper cleanup with added tests.
- Rollback by reverting this day’s commit if any regression appears in observability payloads/logging.
