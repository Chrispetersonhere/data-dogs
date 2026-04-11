# v1 Scope and Boundaries

## In Scope (First 90 Days)
- U.S. public-company filings (SEC-based ingestion).
- Standardized core fundamentals and ratio engine.
- Filing explorer + filing detail workflows.
- Executive compensation v1 from proxy filings.
- Insider activity v1 from Forms 3/4/5 data.
- Public read API (beta-safe with auth + rate limits).
- Premium, responsive, terminal-style frontend.

## Explicit Non-Goals
- Full CRSP replacement in 90 days.
- Fully automated LLM-only extraction as source of truth.
- Broad international market coverage.
- Overly broad quant platform features before core trust is proven.

## Guardrails
- Preserve point-in-time history; no convenience overwrite tables.
- Maintain raw-first provenance for every normalized output.
- Keep daily scope tightly bounded to one PR-sized unit.
- Prioritize production-safe code over abstract frameworks.
