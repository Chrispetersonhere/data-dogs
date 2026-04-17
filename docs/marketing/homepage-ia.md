# Homepage Information Architecture

## Purpose

Communicate what the product does (SEC-filing-based financial research terminal),
why it is trustworthy (provenance, point-in-time correctness, auditability),
and how to get started (API and application access).

Remove generic SaaS marketing language. Every claim must reflect shipped capability.

---

## Section Order

### 1. Trust Signal (Hero)

- **Heading:** "SEC filings → verified financial facts"
- **Subheading:** One sentence: every fact traced to source URL, accession number,
  fetch timestamp, checksum, parser version, and job ID.
- **Stats row (3 cards):**
  - Filing types ingested (10-K, 10-Q, 8-K, DEF 14A)
  - Provenance fields per fact (6: source URL, accession, fetch timestamp, checksum, parser version, job ID)
  - Point-in-time guarantee (zero look-ahead leakage)
- **Tone:** factual, institutional. No superlatives or hype.

### 2. Filings to Facts

- **Heading:** "From raw filing to structured fact"
- **Description:** Three-step visual flow:
  1. Ingest — SEC EDGAR filing fetched with full provenance metadata.
  2. Parse — XBRL and proxy disclosures extracted by deterministic parsers.
  3. Serve — Standardized facts available via API and research UI, each linked to source.
- **Key message:** deterministic extraction, not LLM guesswork.

### 3. Compensation & Insider Modules

- **Heading:** "Executive compensation and insider activity"
- **Description:** Two sub-sections side by side:
  - **Compensation:** Named executive officer pay from DEF 14A proxy filings.
    Source-linked to specific proxy disclosure sections.
  - **Insiders:** Forms 3/4/5 transaction summaries with filing-level provenance.
- **Key message:** pay and trading data traced directly to SEC filings.

### 4. Provenance Story

- **Heading:** "Every number has a receipt"
- **Description:** Explain the six provenance fields that accompany each fact:
  1. Source URL — the SEC EDGAR URL of the raw artifact.
  2. Accession number — the SEC-assigned unique filing identifier.
  3. Fetch timestamp — when the artifact was retrieved.
  4. SHA-256 checksum — integrity proof of the raw artifact.
  5. Parser version — which parser version extracted the fact.
  6. Job ID — the pipeline run that produced the fact.
- **Key message:** full audit trail, restatement-aware, reproducible.

### 5. API Story

- **Heading:** "Programmatic access to filing-derived data"
- **Description:** v1 read-only API endpoints:
  - `/api/v1/companies` — issuer profiles and identifiers
  - `/api/v1/filings` — filing metadata and access
  - `/api/v1/financials` — standardized financial statements
  - `/api/v1/compensation` — executive compensation facts
  - `/api/v1/insiders` — insider transaction summaries
  - `/api/v1/screener` — fundamental screening queries
- **Key message:** every API response includes provenance metadata.

### 6. Call to Action

- **Heading:** "Start with the data"
- **Primary CTA:** "Explore the terminal" — links to app.
- **Secondary CTA:** "Read the API docs" — links to API documentation.
- **No free-trial gimmicks, no sign-up walls for public data.**

---

## Forbidden Patterns

- No "revolutionary", "game-changing", "AI-powered" or similar hype language.
- No vanity metrics (user counts, "trusted by X companies").
- No stock photography or decorative illustrations.
- No feature promises beyond shipped v1 modules.
- No pricing or monetization language on the homepage.

## Design Constraints

- Use existing design system components (`SectionHeader`, `StatCard`, `PageContainer`).
- Inline styles using design tokens only — no arbitrary colors or spacing.
- Responsive: single column on mobile, multi-column stat grids on tablet/desktop.
- CSS module for layout-specific grid rules only.
