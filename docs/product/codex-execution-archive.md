# Codex Execution Archive (Stored Reference)

> Status: **Reference only — do not execute automatically**.
>
> Purpose: preserve the user-provided 90-day operating prompt, repository map, global rules, and day-by-day constraints so future sessions can reference the same baseline without re-pasting.

## Repository Map (as provided)

```text
/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  │  ├─ (marketing)/
│  │  │  ├─ company/[companyId]/
│  │  │  ├─ filings/
│  │  │  ├─ screener/page.tsx
│  │  │  ├─ peers/page.tsx
│  │  │  ├─ admin/
│  │  │  ├─ api/v1/
│  │  │  └─ layout.tsx
│  │  ├─ lib/
│  │  └─ tests/
│  └─ docs/
├─ services/
│  ├─ ingest-sec/
│  ├─ parse-xbrl/
│  ├─ parse-proxy/
│  ├─ id-master/
│  └─ market-data/
├─ packages/
│  ├─ ui/
│  ├─ db/
│  ├─ schemas/
│  └─ parser-rules/
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ adr/
│  ├─ daily/
│  ├─ weekly/
│  └─ monthly/
└─ infra/
   ├─ docker/
   ├─ scripts/
   └─ monitoring/
```

## Operating Rules (as provided)

1. Inspect repository before changes.
2. Do not assume files exist.
3. Keep app/services working.
4. Prefer stable, production-safe implementations.
5. Add/update tests for non-trivial changes.
6. Do not widen scope beyond today.
7. Preserve lineage + point-in-time correctness.
8. Avoid LLM extraction as system-of-record when deterministic parsing exists.
9. Update docs for meaningful changes.
10. End each day with summary, changed files, commands, risks/follow-ups, exact verification.

## Global Standards (as provided)

- `main` must remain buildable.
- Raw artifacts preserve provenance.
- Transformed facts trace back to raw source.
- No dead code, no silent schema changes, no hidden shortcuts.

## Standard Verification Commands (as provided)

```bash
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
pytest services/ingest-sec/tests -q
pytest services/parse-xbrl/tests -q
pytest services/parse-proxy/tests -q
pytest services/id-master/tests -q
```

## Day-by-Day Prompt Archive (Days 1–90)

This section stores the exact day-scoped implementation intent from the user prompt in a compact but complete checklist format for reference.

### Days 1–7
- Day 1: Product charter docs only (`docs/product/*`, `docs/daily/day-1.md`), with PRD, 4 personas, exactly 5 workflows, strict non-goals, 90-day KPIs, and 10 principles.
- Day 2: Monorepo bootstrap/tooling docs + root config (`package.json`, workspace/turbo/lint/ts/editor configs, ADR, day log).
- Day 3: Design-system foundation in `apps/web` + `packages/ui` + design docs.
- Day 4: Core provenance schema (`issuer`, `filing`, `filing_document`, `raw_artifact`, `ingestion_job`, `parser_run`) + ERD docs.
- Day 5: Local infra and CI (`docker-compose`, bootstrap, CI workflow, local-dev docs).
- Day 6: SEC client (UA, throttle, retries, timeout, structured logging) + tests + ops docs.
- Day 7: Week 1 stabilization, naming clean-up, docs tightening, week review.

### Days 8–14
- Day 8: Generic ingestion job framework with idempotency/resume.
- Day 9: Submissions backfill with raw/staging split and checkpointing.
- Day 10: Companyfacts + frames ingestion with resume/no-dup behavior.
- Day 11: Provenance ledger schema/UI/admin filtering.
- Day 12: Admin QA dashboard for jobs/failures/artifacts.
- Day 13: Resilience tests (resume/retries/malformed/duplicates).
- Day 14: Week 2 stabilization and review.

### Days 15–21
- Day 15: Issuer master + historical naming.
- Day 16: Security master + effective-dated listings.
- Day 17: Identifier map with historical queryability.
- Day 18: Exchange/listing history transitions.
- Day 19: Point-in-time query primitives and anti-lookahead tests.
- Day 20: Golden company validation set.
- Day 21: Week 3 stabilization and trustworthiness review.

### Days 22–28
- Day 22: Bulk submissions backfill.
- Day 23: FS dataset ingest into staging.
- Day 24: Notes/disclosure ingest stubs.
- Day 25: Raw + normalized fact skeleton.
- Day 26: First real company overview page.
- Day 27: Admin reconciliation view for raw vs normalized facts.
- Day 28: Month 1 cleanup + freeze review.

### Days 29–35
- Day 29: Canonical metric dictionary.
- Day 30: Deterministic XBRL mapping engine.
- Day 31: Restatement/supersession handling.
- Day 32: Annual statement builder.
- Day 33: Quarterly + TTM builder.
- Day 34: Ratio engine.
- Day 35: Week 5 stabilization.

### Days 36–42
- Day 36: Filing explorer backend.
- Day 37: Filing explorer UI.
- Day 38: Filing detail page.
- Day 39: Financials page polish.
- Day 40: Small multiples + margin bridge charts.
- Day 41: Responsive polish.
- Day 42: Week 6 stabilization.

### Days 43–49
- Day 43: Screener backend.
- Day 44: Screener UI.
- Day 45: Peer comparison page.
- Day 46: Valuation scatter + restatement diff charts.
- Day 47: Notes/disclosure retrieval UI.
- Day 48: Performance pass.
- Day 49: Week 7 stabilization.

### Days 50–56
- Day 50: Homepage IA rewrite.
- Day 51: Homepage build.
- Day 52: Docs app shell.
- Day 53: Observability foundations.
- Day 54: Month 2 hardening.
- Day 55: Accessibility/browser pass.
- Day 56: Month 2 freeze review.

### Days 57–63
- Day 57: Compensation schema.
- Day 58: Proxy fetch/segment scaffold.
- Day 59: Summary Compensation Table parser.
- Day 60: Grants parser.
- Day 61: Governance facts extraction.
- Day 62: Compensation QA interface.
- Day 63: Week 9 stabilization.

### Days 64–70
- Day 64: Compensation page.
- Day 65: Insider ingest.
- Day 66: Insider normalization.
- Day 67: Insider page.
- Day 68: Exec pay mix + insider heatmap charts.
- Day 69: Governance/ownership cards.
- Day 70: Week 10 stabilization.

### Days 71–77
- Day 71: Public API read models.
- Day 72: Companies/filings/financials endpoints.
- Day 73: Compensation/insiders/screener endpoints.
- Day 74: API auth + rate limits.
- Day 75: API docs.
- Day 76: OpenAPI + Postman assets.
- Day 77: Week 11 stabilization.

### Days 78–84
- Day 78: Trust-layer messaging pass.
- Day 79: Full design QA pass.
- Day 80: Speed optimization.
- Day 81: Monitoring/alerts/backups.
- Day 82: Security review.
- Day 83: Guided first-user journeys.
- Day 84: Week 12 stabilization.

### Days 85–90
- Day 85: Invite-only beta onboarding.
- Day 86: Beta feedback quick wins.
- Day 87: Product analytics instrumentation.
- Day 88: Legal/company basics pages.
- Day 89: Release candidate freeze docs.
- Day 90: Soft launch + retrospective + next-quarter roadmap.

## Preservation Note

- This archive intentionally stores the user’s operating framework in-repo for future reference.
- It is a planning/control artifact, not an instruction to execute all items immediately.
