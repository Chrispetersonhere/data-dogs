# Month 1 Review (Days 1-28 Freeze)

## Executive summary
Month 1 delivered core ingestion scaffolding, identifier/domain foundations, and first internal QA/admin surfaces.
Freeze day focused on stability, not feature expansion.

## What shipped (high-level)
- SEC ingest backbone (submissions/companyfacts/frame ingestion and raw/staging safety).
- Identity and identifier foundations (issuer/security/listing/identifier maps).
- Parse-XBRL scaffolding for datasets, notes, and normalized fact skeleton layers.
- Internal web/admin views for jobs/artifacts/QA and first company overview page.

## P0/P1 issues addressed in freeze
- **P1:** QA API lint parser compatibility issue fixed by replacing deeply nested inline generic types with explicit aliases (`FactPoint`, `FactDetail`, `CompanyFactsPayload`) to remove parser ambiguity.
- **P1:** Documentation alignment on web test invocation clarified: targeted `pnpm --filter web test -- <file>` still executes the suite due current script glob.
- **P0:** none open at freeze close based on acceptance suite outcomes in Python services and passing web checks in a clean git-backed worktree.

## Scope cut / deferred
- Mapping rules for normalized facts (intentionally deferred).
- Public note UX and statement renderer expansion (explicitly out of scope in this phase).
- Compensation/screener/public-route expansion (explicitly frozen/out of scope).
- Broader reconciliation automation beyond ambiguity surfacing.

## Reality alignment notes
- Web acceptance depends on a working pnpm environment; local validation may require a clean git-backed worktree path when OS-level ACLs break node_modules installation.
- QA and company pages are implemented against live SEC endpoints (no mock payload source in adapters).

## Month-2 ready backlog (carry-forward)
1. Implement deterministic concept mapping rules and confidence scoring.
2. Add persisted fact reconciliation artifacts and triage workflows.
3. Expand issuer/company overview metrics beyond current submissions summary.
4. Harden CI matrix/runtime and local setup scripts for Windows reliability.
