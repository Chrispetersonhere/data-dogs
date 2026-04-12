# Day 11 — Provenance Ledger and Artifact Inspection Page

## Scope completed
- Added provenance ledger SQL view for artifact inspection fields.
- Added admin-only artifact inspection page with quiet tabular design.
- Added web provenance data access layer for admin artifact table rows.
- Added admin artifacts page test spec asserting required field headers.

## Files touched
- `packages/db/schema/002_provenance.sql`
- `apps/web/app/admin/artifacts/page.tsx`
- `apps/web/lib/db/provenance.ts`
- `apps/web/tests/admin-artifacts.spec.ts`
- `docs/daily/day-11.md`

## Required fields displayed
- source URL
- accession
- fetch timestamp
- checksum
- parser version
- job id
- status

## Verification commands
- `pnpm --filter web test -- admin-artifacts.spec.ts || pnpm --filter web test`
- `pnpm --filter web build`

## Notes
- Admin gating is intentionally trivial (`ADMIN_ENABLED=true`) per scope.
- No public routes, auth-system expansion, or financial normalization changes were introduced.
