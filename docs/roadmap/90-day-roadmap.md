# 90-Day Product Roadmap (Planning Only)

## Goal
Deliver a beta-grade institutional financial data product in 90 days with:
- SEC ingestion + provenance,
- standardized fundamentals,
- filing exploration,
- executive compensation v1,
- insider activity v1,
- public read API,
- premium terminal-style UX.

## Month 1: Foundations
### Week 1
- Product charter and v1 scope freeze.
- Architecture decisions, monorepo setup, CI skeleton.
- Design system foundation.
- Initial schema for issuer/filing/raw artifact lineage.
- SEC client with fair-access controls.

### Week 2
- Raw ingestion runner with retries/checkpoints/dead-letter handling.
- Submissions/companyfacts/frames ingestion workflows.
- Provenance ledger and admin QA dashboard v1.
- Resilience and restart-resume tests.

### Week 3
- Issuer master and security master.
- Historical identifier mapping.
- Listing/exchange history tracking.
- Point-in-time query primitives.
- Golden dataset for validation.

### Week 4
- Bulk backfill support.
- Financial statement dataset ingestion.
- Notes dataset stubs.
- Normalized fact skeleton.
- First company overview shell with real data.

## Month 2: Fundamentals + Product UX
### Week 5
- Canonical metric dictionary.
- XBRL mapping rules engine.
- Restatement-aware fact resolution.
- Annual/quarterly/TTM builders.
- Ratio engine v1.

### Week 6
- Filing explorer backend + UI.
- Filing detail page.
- Financials page v1.
- Visualization pack: small multiples + margin bridge.
- Responsive polish.

### Week 7
- Screener backend + UI.
- Peer comparison page.
- Visualization pack: valuation scatter + restatement diff.
- Note disclosure retrieval UI.

### Week 8
- Homepage architecture + implementation.
- Docs shell and API docs structure.
- Observability foundation.
- Accessibility/cross-browser pass.
- Month 2 hardening and freeze.

## Month 3: Comp + Insider + API + Launch Readiness
### Week 9
- DEF 14A ingestion and compensation extraction framework.
- Summary Compensation Table parser.
- Grants parser and governance fact extraction.
- Compensation QA interface.

### Week 10
- Compensation UX.
- Insider data ingestion + normalization.
- Insider activity page.
- Visualization pack: pay mix + insider heatmap.

### Week 11
- Public API read models.
- Endpoint rollout for companies/filings/financials/comp/insiders/screener.
- API keys, rate limits, docs, and developer assets.

### Week 12
- Reliability, performance, monitoring, backups.
- Security and abuse review.
- Guided demo journeys.
- Beta-readiness checklist.

### Week 13
- Controlled beta onboarding.
- Feedback triage and quick wins.
- Funnel instrumentation.
- Launch pages/legal basics.
- Release candidate freeze and soft launch retrospective.

## End-of-Day-90 Target
- Cohesive multi-page product (homepage, company, filings, financials, comp, insiders, screener, peer compare, docs, admin QA).
- Auditable lineage and point-in-time-safe data model.
- Measurable product quality (tests, logs, health checks, backups, CI/CD).
