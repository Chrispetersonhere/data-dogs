# ERD v1 — Core Ingestion & Filing Lineage

This ERD defines the Day 4 initial relational model for filing ingestion, raw artifact provenance, and parser execution lineage.

## Scope
Included tables:
- `issuer`
- `filing`
- `filing_document`
- `raw_artifact`
- `ingestion_job`
- `parser_run`

Excluded (intentionally out-of-scope in v1):
- fact tables
- compensation tables
- market-price tables

## Entity Relationship Diagram (text)

```text
ingestion_job (1) ────────< filing (many) >──────── (1) issuer
      │
      ├───────────────< raw_artifact (many) >───────(0..1) filing_document
      │                         │
      │                         └───────────────(0..1) filing
      │
      └───────────────< parser_run (many) >─────────(1) raw_artifact

filing (1) ───────────────< filing_document (many)
```

## Relationship notes
- One `issuer` can have many `filing` records via `filing.issuer_id`.
- One `filing` can have many `filing_document` rows via `filing_document.filing_id`.
- One `ingestion_job` can produce many `filing`, `raw_artifact`, and `parser_run` rows.
- One `raw_artifact` can be linked to a `filing` and/or a `filing_document`.
- One `raw_artifact` can have many `parser_run` executions over time (reprocessing, parser upgrades).

## Provenance and auditability fields
Lineage-sensitive columns are included where relevant:
- Source tracking: `source_url`, `source_accessed_at`, `fetched_at`.
- Filing lineage: `accession_number` on `filing` and repeated on `raw_artifact` when artifact-level carry-through is needed.
- Integrity: `checksum_sha256` (unique) on `raw_artifact`.
- Parser lineage: `parser_name`, `parser_version`, `parser_job_id` on `parser_run`; optional parser fields also captured on `raw_artifact` for provenance snapshots.
- Job lineage: `ingestion_job_id` on `filing`, `raw_artifact`, and `parser_run`.
- Record-level audit timestamps: `created_at` and (where mutable) `updated_at`.

## Indexing strategy (v1)
Indexes target obvious query paths and joins:
- Foreign-key join indexes (`*_id`) on all high-cardinality relationships.
- `filing(filing_type, filing_date DESC)` for filing timeline retrieval.
- `raw_artifact(accession_number)` for accession-level artifact lookups.
- `ingestion_job(status)` and `parser_run(status)` for operational monitoring.

## Notes
- `issuer` is intentionally separate from any security entity (none introduced in this scope).
- Deletion behavior is conservative (`RESTRICT` for `issuer -> filing`) and lineage-preserving (`SET NULL` where detached artifacts/runs may remain auditable).
