# Week 2 Review — Stabilization and Resilience

## Scope summary
- Stabilized internal admin tooling delivered in days 11–12 (jobs/QA dashboards, provenance-backed admin mapping, Windows verification workflow).
- Added ingestion resilience tests in day 13 for resume semantics, retry behavior, malformed payload handling, and rerun idempotency.
- Performed week-2 cleanup in day 14 to reduce naming confusion and harden fragile parser/admin filter paths.

## What shipped this week
- Admin jobs and QA pages for internal operations triage.
- Provenance-backed admin API mapping for jobs, failed artifacts, and parser summaries.
- Executable web QA spec coverage.
- Ingest resilience test suite additions (resume, retry, malformed payloads, duplicate rerun protection).
- Windows cleanup script hardening and validation playbook improvements.

## Stabilization changes (day 14)
- Clarified admin parser filter typing so query parsing accepts only known parser values.
- Hardened submissions parser handling for malformed `filings/recent` payload shapes and non-list fields.
- Added malformed payload regression coverage to prevent accidental character-wise staging from string payload fields.

## Verification snapshot
- `pytest services/ingest-sec/tests -q` passes with expanded resilience suite.
- Web lint/typecheck/build and web tests were verified in a clean short-path Windows clone (`C:\dev\data-dogs-clean`) to avoid path/ACL instability under Documents.

## Risks and follow-ups
- Local Windows installs under synced/managed folders (e.g., Documents) can still produce intermittent node_modules corruption.
- Keep using short-path local clones for deterministic verification.
- Continue limiting week-level changes to stabilization/clarification without expanding feature scope.
