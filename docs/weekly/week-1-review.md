# Week 1 Review (Days 1–7)

## Done
- Established Week 1 product and scope baseline docs (`prd-v1`, personas, non-goals, success metrics).
- Bootstrapped monorepo foundations (`pnpm` workspace, `turbo`, shared lint/typecheck scaffolding, ADR).
- Added premium web design-system foundations and demo route in the web app package.
- Added initial database schema and ERD for issuer/filing/artifact/parser lineage.
- Added local Docker-based infrastructure and CI workflow for JS + Python checks.
- Implemented production-safe SEC client controls (required User-Agent, throttling, timeouts, retries, structured logs) with focused tests.
- Completed Day 7 stabilization cleanup for naming consistency, docs accuracy, CI script simplification, and lint-tooling compatibility hardening.

## Fragile
- Most Python service test suites referenced in global verification commands are still absent in this snapshot (`parse-xbrl`, `parse-proxy`, `id-master`, `market-data`).
- The `ingest-sec` compose service is still wiring-only rather than running a concrete service entrypoint.
- Root lint/typecheck reliability currently depends on workspace package script coverage and existing baseline scaffolding.
- Local verification still depends on host prerequisites (Docker daemon status, Python toolchain, pnpm/corepack availability).

## Next
1. Add concrete runtime entrypoints for `ingest-sec` and wire compose command to service startup.
2. Introduce missing Python service test suites or explicitly remove them from required local command palettes until implemented.
3. Add integration checks that verify raw-artifact provenance fields are persisted end-to-end.
4. Add CI artifact/reporting for ingestion lineage invariants (source URL, accession, fetch timestamp, checksum, parser version, job id).
5. Continue tightening command runbooks, with platform-specific copy/paste verification flows and deterministic Windows install-recovery and fresh-clone fallback steps.
