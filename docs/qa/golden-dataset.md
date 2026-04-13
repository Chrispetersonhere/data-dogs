# Golden validation dataset

This dataset is intentionally curated (not synthetic random rows) to regression-test issuer and security identity logic under realistic edge conditions.

## Case families and rationale

### 1) Name changes
- **Why this exists:** Issuers often rebrand or rename while keeping the same legal identity key.
- **Risk covered:** Systems that heavily weight current display name can accidentally fork one issuer into two records.
- **Rows:** `NAME-001`, `NAME-002`.

### 2) Multiple securities
- **Why this exists:** One issuer can legitimately have multiple instruments (common equity, preferred, convertibles, ADRs).
- **Risk covered:** Pipelines that assume one security per issuer can duplicate issuers or lose instrument history.
- **Rows:** `MULTI-001`, `MULTI-002`.

### 3) Amended filings
- **Why this exists:** 10-K/A and similar amendments revise prior filings after initial ingestion.
- **Risk covered:** Amendment processing can create duplicate entity records if filing identifiers are treated as primary identity.
- **Rows:** `AMD-001`, `AMD-002`.

### 4) Complex histories
- **Why this exists:** Mergers, relistings, and corporate reorganizations introduce multi-step timeline transitions.
- **Risk covered:** Point-in-time joins can break if pre-close and post-close records are not linked carefully.
- **Rows:** `HIST-001`, `HIST-002`.

### 5) Identity ambiguity edge cases
- **Why this exists:** Similar names and overlapping symbols across jurisdictions are common.
- **Risk covered:** Fuzzy matching can collapse distinct issuers into a single incorrect identity.
- **Rows:** `AMB-001`, `AMB-002`.

## Non-triviality guardrail

The golden set must include all five case families and enough rows to exercise transitions, not just single-row smoke tests. Day 20 baseline is **10 rows** across **5 mandatory families**.
