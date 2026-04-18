# Week 9 Review — Compensation pipeline hardening

Date: 2026-04-18

## Week objective
Stabilize the compensation data path from proxy ingestion through parser outputs while preserving provenance and auditability.

## Delivered this week (Days 57–63)
- Introduced normalized compensation schema and domain contracts (`executive`, role history, summary/award/governance fact entities) with source metadata columns required for traceability.
- Added deterministic proxy fetch + segmentation scaffold with provenance fields and checksum retention.
- Added conservative Summary Compensation Table parser with required compensation fields and row-level raw references.
- Added conservative grants parser with explicit ambiguity handling via candidate sets.
- Added governance fact parser for CEO/chair structure, compensation committee members, and say-on-pay result with source links.
- Added internal admin compensation QA view to compare raw source rows and parsed output with discrepancy highlighting and provenance visibility.
- Completed Day 63 stabilization pass:
  - preserved original raw source line numbers through blank-line inputs;
  - improved source linking by embedding accession in governance source references;
  - fixed pipe-delimited sparse row handling to avoid dropped empty columns.

## Quality and verification status
- Parse-proxy suite passed after stabilization:
  - `pytest services/parse-proxy/tests -q`
- Web build acceptance command could not be executed in this environment due external package download restriction during Corepack/pnpm bootstrap.

## Limitations and risk notes
- Parsing remains heuristic text-based and not full HTML table-model aware.
- Non-standard issuer labeling and highly irregular formatting can still reduce recall.
- Governance name extraction is regex-based and can mis-handle unusual punctuation/capitalization styles.
- Environment-level package manager bootstrap dependency can block JS build verification in restricted network contexts.

## Follow-ups for Week 10
- Add fixture corpus from real DEF 14A filings covering irregular spacing/wrapped rows.
- Evaluate bounded improvements to header alias coverage while preserving conservative extraction behavior.
- Add cross-parser consistency checks between SCT totals and QA discrepancy surface to catch drift earlier.
