# PRD v1: U.S. Public-Company Research Terminal

## 1) One-Sentence Product Definition
A production-grade research terminal that gives users point-in-time-correct, provenance-linked analysis of U.S. public-company filings and fundamentals.

## 2) Target Users
- **Independent investor:** performs self-directed company research with audit-ready evidence trails.
- **Professor/researcher:** studies issuer behavior and filing-based trends with reproducible source lineage.
- **Small fund analyst:** executes repeatable diligence workflows across a focused U.S. equity universe.
- **RIA/consultant:** prepares client-facing research notes backed by verifiable filing and metric provenance.

## 3) Exactly 5 Core Workflows
1. **Company diligence workflow:** open a company profile, review filing timeline, and trace key facts to source artifacts.
2. **Filing investigation workflow:** inspect a filing (10-K/10-Q/8-K/DEF 14A), navigate sections, and validate extracted facts.
3. **Financial trend workflow:** compare annual, quarterly, and TTM metrics with restatement-aware historical context.
4. **Compensation and insider workflow:** review executive pay and insider activity with direct links to filings/forms.
5. **Screen-and-compare workflow:** filter companies by fundamentals, then compare peer metrics using point-in-time data.

## 4) Exact v1 Modules
- **Company Overview** (issuer profile, identifiers, listing context)
- **Filings Explorer** (search/filter/list filings and access filing detail)
- **Financials** (standardized statements, key ratios, period comparisons)
- **Compensation** (executive compensation facts from proxy disclosures)
- **Insiders** (Forms 3/4/5 activity summaries)
- **Screener** (fundamental filters and saved query parameters)
- **Peer Comparison** (side-by-side selected company metrics)
- **API v1 Read Endpoints** (companies, filings, financials, compensation, insiders, screener)
- **Admin QA** (jobs, artifacts, parser runs, reconciliation checks)

## 5) Exact v1 Exclusions
- Non-U.S. issuer coverage.
- Intraday or real-time trading data claims.
- Portfolio execution, order routing, or brokerage workflows.
- Alternative data products as system-of-record inputs.
- Fully automated LLM-only extraction as authoritative truth.
- CRSP-equivalent replacement scope.
- Personalized investment advice or suitability tooling.
- Full-featured collaborative research workspaces.
- Mobile-native application scope beyond responsive web.
- Backtesting engine or quant strategy execution platform.

## 6) 90-Day Success Metrics
- **Coverage:** at least 95% of targeted U.S. issuer universe has ingestible filing history in the system.
- **Provenance completeness:** 100% of displayed core facts include source artifact links and parser/job lineage fields.
- **Point-in-time integrity:** 0 confirmed look-ahead leakage defects in acceptance and regression test suites.
- **Freshness reliability:** scheduled ingestion jobs succeed at >= 99% over trailing 30 days by Day 90.
- **Workflow usability:** median time to complete each core workflow is <= 10 minutes for pilot users.
- **Quality signal:** <= 2% of sampled extracted facts require manual correction after QA review.

## 7) Product Principles (Trust, Provenance, Auditability, Point-in-Time Correctness)
1. **Raw-first truth:** raw artifacts are immutable and preserved before transformation.
2. **Lineage by default:** every transformed fact is traceable to source URL, accession, fetch timestamp, checksum, parser version, and job id.
3. **Point-in-time safety:** every query and metric must reflect what was knowable at that historical moment.
4. **Restatement awareness:** superseded facts are retained and explicitly versioned, never silently overwritten.
5. **Deterministic parsing first:** deterministic extraction is preferred for production-critical facts.
6. **Auditable UX:** users can inspect where a number came from and why it changed.
7. **Narrow-scope reliability:** ship bounded, testable modules instead of broad unstable feature sets.
8. **Operational transparency:** ingestion/parsing health is observable through clear admin QA views.
9. **Reproducibility:** repeated runs over the same inputs should produce consistent outputs.
10. **Compliance-aware communication:** avoid promotional claims that exceed validated product behavior.
