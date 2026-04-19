# 90-Day Build Pack — Part 2 (Days 32 to 60)

See [README.md](./README.md) for the assumed repo contract, global Codex header, and
standard verification command palette.

Scope of this part: annual/quarterly/TTM statement builders, ratio engine, fundamentals
stabilization, filing explorer API and UI, filing detail, financials page polish,
flagship charts (small multiples + margin bridge), responsive polish, Week-6 freeze,
screener API and UI, peer comparison, valuation scatter + restatement diff charts,
note disclosure retrieval UI, performance pass, Week-7 freeze, homepage IA and
refined homepage, docs shell, observability foundation, Month-2 hardening,
accessibility pass, Month-2 freeze, compensation schema, proxy fetcher and
segmentation, SCT parser, grants parser, governance extraction, compensation QA
interface.

---

## Day 32
### Touch only
- services/parse-xbrl/src/statement_builder_annual.py
- apps/web/app/company/[companyId]/financials/page.tsx
- apps/web/tests/financials-annual.spec.ts
- docs/daily/day-32.md

### Prompt body
Build the annual statement renderer.

Required outputs:
- income statement
- balance sheet
- cash flow
- premium table UX
- real data only

Keep the metric set focused.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- financials-annual.spec.ts || pnpm --filter web test
pytest services/parse-xbrl/tests -q
```

### Forbidden changes
- quarterly UI
- TTM logic

### Rollback rule
- revert if statement totals are obviously inconsistent or unsupported by tests

---

## Day 33
### Touch only
- services/parse-xbrl/src/statement_builder_quarterly.py
- services/parse-xbrl/tests/test_ttm.py
- apps/web/tests/financials-quarterly.spec.ts
- docs/daily/day-33.md

### Prompt body
Add quarterly and TTM logic.

Required behavior:
- quarterly renderer
- explicit TTM formulas
- no mixed-period contamination
- tests for TTM output

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_ttm.py -q
pnpm --filter web test -- financials-quarterly.spec.ts || pnpm --filter web test
```

### Forbidden changes
- ratio engine
- new metrics

### Rollback rule
- revert if TTM behavior is implicit or not documented

---

## Day 34
### Touch only
- services/parse-xbrl/src/ratios.py
- services/parse-xbrl/tests/test_ratios.py
- packages/schemas/src/domain/ratios.ts
- docs/daily/day-34.md

### Prompt body
Build the ratio engine.

Required ratio groups:
- margins
- leverage
- liquidity
- efficiency
- simple valuation-ready support metrics

Add known-input/output tests.
Document formulas.

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_ratios.py -q
```

### Forbidden changes
- screener UI
- charts

### Rollback rule
- revert if formulas are not explicit and test-covered

---

## Day 35
### Touch only as needed
- files touched Days 29–34
- docs/weekly/week-5-review.md
- docs/daily/day-35.md

### Prompt body
Stabilize the fundamentals layer.

Do exactly this:
1. inspect mapping, restatement, statement, and ratio code
2. remove duplication
3. tighten docs
4. write week-5 review
5. add no new features

### Acceptance tests
```
pytest services/parse-xbrl/tests -q
pnpm --filter web build
```

### Forbidden changes
- new routes
- compensation work

### Rollback rule
- revert any scope expansion disguised as refactor

---

## Day 36
### Touch only
- apps/web/lib/api/filings.ts
- packages/schemas/src/api/filings.ts
- apps/web/tests/filings-api.spec.ts
- docs/daily/day-36.md

### Prompt body
Build the filing explorer backend query layer.

Required filters:
- issuer
- form type
- date range
- accession

Keep contracts stable and minimal.

### Acceptance tests
```
pnpm --filter web test -- filings-api.spec.ts || pnpm --filter web test
pnpm --filter web build
```

### Forbidden changes
- filings UI
- statement UI

### Rollback rule
- revert if API contract is unstable or noisy

---

## Day 37
### Touch only
- apps/web/app/filings/page.tsx
- packages/ui/src/components/filings/*
- apps/web/tests/filings-page.spec.ts
- docs/daily/day-37.md

### Prompt body
Build the filing explorer UI.

Required features:
- search filters
- quiet premium table
- drilldown links
- responsive layout

Use real data only.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- filings-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- charts
- marketing pages

### Rollback rule
- revert if explorer becomes cluttered or uses placeholder data

---

## Day 38
### Touch only
- apps/web/app/filings/[accession]/page.tsx
- apps/web/lib/api/filing-detail.ts
- apps/web/tests/filing-detail.spec.ts
- docs/daily/day-38.md

### Prompt body
Build the filing detail page.

Required contents:
- filing metadata
- linked documents
- provenance summary
- available sections if present

Keep source traceability obvious.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- filing-detail.spec.ts || pnpm --filter web test
```

### Forbidden changes
- compensation UI
- screener UI

### Rollback rule
- revert if filing detail loses raw-source drilldown

---

## Day 39
### Touch only
- apps/web/app/company/[companyId]/financials/page.tsx
- packages/ui/src/components/financials/*
- apps/web/tests/financials-page.spec.ts
- docs/daily/day-39.md

### Prompt body
Polish the financials page.

Required features:
- period toggles
- sticky headers
- export-friendly layout
- responsive behavior

No new metrics today.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- financials-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- ratio logic
- screener

### Rollback rule
- revert if polish introduces regressions or visual clutter

---

## Day 40
### Touch only
- apps/web/lib/charts/fundamentalsSmallMultiples.ts
- apps/web/lib/charts/marginBridgeWaterfall.ts
- packages/ui/src/components/charts/*
- apps/web/tests/charts.spec.ts
- docs/daily/day-40.md

### Prompt body
Build two flagship charts.

Charts required:
- Fundamentals Small Multiples
- Margin Bridge Waterfall

Use real data.
Use precise labels.
Keep interactions restrained and institutional.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- charts.spec.ts || pnpm --filter web test
```

### Forbidden changes
- homepage redesign
- extra chart types

### Rollback rule
- revert if charts are visually flashy or analytically unclear

---

## Day 41
### Touch only
- core page components needing responsive fixes
- docs/daily/day-41.md

### Prompt body
Responsive polish only.

Audit and fix:
- table overflow
- chart clipping
- spacing breakdowns
- bad heading hierarchy
- mobile scanability issues

No new features.

### Acceptance tests
```
pnpm --filter web build
```
- no major breakpoint defects remain on core pages

### Forbidden changes
- schema
- services

### Rollback rule
- revert any change unrelated to breakpoint repair

---

## Day 42
### Touch only as needed
- files touched Days 36–41
- docs/weekly/week-6-review.md
- docs/daily/day-42.md

### Prompt body
Week-6 stabilization.

Do exactly this:
1. clean up filing and financials UX rough edges
2. tighten loading and empty states
3. make styles consistent
4. write week-6 review

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/parse-xbrl/tests -q
```

### Forbidden changes
- new product modules

### Rollback rule
- revert any scope expansion beyond stabilization

---

## Day 43
### Touch only
- apps/web/lib/api/screener.ts
- packages/schemas/src/api/screener.ts
- apps/web/tests/screener-api.spec.ts
- docs/daily/day-43.md

### Prompt body
Build the screener backend query layer.

Required filters:
- size
- growth
- margin
- leverage
- liquidity

Keep the contract simple. No giant filter matrix.

### Acceptance tests
```
pnpm --filter web test -- screener-api.spec.ts || pnpm --filter web test
pnpm --filter web build
```

### Forbidden changes
- screener page UI
- peer page UI

### Rollback rule
- revert if screener API becomes unstable or overcomplicated

---

## Day 44
### Touch only
- apps/web/app/screener/page.tsx
- packages/ui/src/components/screener/*
- apps/web/tests/screener-page.spec.ts
- docs/daily/day-44.md

### Prompt body
Build the screener page.

Required features:
- filter chips
- query summary
- premium results table
- responsive layout

Keep it focused and quiet.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- screener-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- extra chart work
- marketing work

### Rollback rule
- revert if the screener gets noisy or bloated

---

## Day 45
### Touch only
- apps/web/app/peers/page.tsx
- apps/web/lib/api/peers.ts
- apps/web/tests/peers-page.spec.ts
- docs/daily/day-45.md

### Prompt body
Build the peer comparison page.

Required features:
- company + peer set comparison
- curated metric set
- clean comparison table

No sprawling dashboard.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- peers-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- compensation module
- API auth

### Rollback rule
- revert if peer page becomes analytically noisy

---

## Day 46
### Touch only
- apps/web/lib/charts/peerValuationScatter.ts
- apps/web/lib/charts/restatementDiffViewer.ts
- apps/web/tests/charts-2.spec.ts
- docs/daily/day-46.md

### Prompt body
Build two more premium visuals.

Charts required:
- Peer Valuation Scatter
- Restatement Diff Viewer

Real data only. Keep them interpretable.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- charts-2.spec.ts || pnpm --filter web test
```

### Forbidden changes
- homepage work
- admin work

### Rollback rule
- revert if charts sacrifice clarity for style

---

## Day 47
### Touch only
- apps/web/app/company/[companyId]/financials/page.tsx
- apps/web/lib/api/notes.ts
- packages/ui/src/components/notes/*
- apps/web/tests/notes-panel.spec.ts
- docs/daily/day-47.md

### Prompt body
Add note disclosure retrieval UI.

Required behavior:
- user can open a note panel from a financial line item
- panel shows linked note/disclosure content where available
- keep it elegant and secondary to the table

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- notes-panel.spec.ts || pnpm --filter web test
```

### Forbidden changes
- new metrics
- screener changes

### Rollback rule
- revert if note panel overwhelms the primary financial table UX

---

## Day 48
### Touch only
- query and chart files directly tied to speed issues
- docs/daily/day-48.md

### Prompt body
Performance pass.

Do exactly this:
1. profile main pages
2. reduce obvious overfetching
3. improve loading states
4. optimize chart rendering where needed

No new features.

### Acceptance tests
```
pnpm --filter web build
```
- visible improvement in main-page responsiveness

### Forbidden changes
- schema
- new components unrelated to performance

### Rollback rule
- revert any change that sacrifices correctness for speed

---

## Day 49
### Touch only as needed
- files touched Days 43–48
- docs/weekly/week-7-review.md
- docs/daily/day-49.md

### Prompt body
Week-7 stabilization.

Do exactly this:
1. clean up screener, peers, and notes rough edges
2. improve docs and tests
3. record known limits
4. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/parse-xbrl/tests -q
```

### Forbidden changes
- compensation work
- API auth

### Rollback rule
- revert any disguised scope creep

---

## Day 50
### Touch only
- apps/web/app/(marketing)/page.tsx
- docs/marketing/homepage-ia.md
- docs/daily/day-50.md

### Prompt body
Redesign homepage information architecture.

Required sections:
- trust signal
- filings to facts
- compensation and insider modules
- provenance story
- API story
- call to action

Remove generic SaaS fluff.

### Acceptance tests
- homepage IA doc updated
- page structure matches doc

### Forbidden changes
- docs app
- API routes

### Rollback rule
- revert if messaging becomes hype-driven

---

## Day 51
### Touch only
- apps/web/app/(marketing)/page.tsx
- packages/ui/src/components/marketing/*
- apps/web/tests/homepage.spec.ts
- docs/daily/day-51.md

### Prompt body
Build the refined homepage.

Requirements:
- premium hierarchy
- subtle motion only where useful
- real screenshots or real-data states where possible
- fully responsive

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- homepage.spec.ts || pnpm --filter web test
```

### Forbidden changes
- fake testimonials
- flashy hero effects

### Rollback rule
- revert if homepage feels gimmicky or salesy

---

## Day 52
### Touch only
- apps/docs/app/page.tsx
- apps/docs/app/layout.tsx
- apps/docs/app/api/page.tsx
- apps/docs/app/product/page.tsx
- docs/daily/day-52.md

### Prompt body
Create the docs app shell.

Required features:
- nav
- clean typography everything has to be readable by a human
- code block theme
- API reference placeholder
- product docs placeholder

Make it consistent with main brand. Make the main brand clean and premium.

### Acceptance tests
```
pnpm --filter web build
```
- docs routes build and render cleanly

### Forbidden changes
- public API endpoints
- compensation parser

### Rollback rule
- revert if docs shell is visually disconnected from main product

---

## Day 53
### Touch only
- apps/web/lib/observability/*
- infra/monitoring/*
- services/*/src/logging.py
- docs/operations/observability.md
- docs/daily/day-53.md

### Prompt body
Add observability foundation.

Required behavior:
- structured logs
- request ids and job ids
- health checks
- error boundaries where appropriate

Keep it lightweight and useful.

### Acceptance tests
- health check path exists
- logs include ids

### Forbidden changes
- analytics instrumentation
- deployment tooling beyond health/monitoring basics

### Rollback rule
- revert if observability work creates noisy or unreadable logging

---

## Day 54
### Touch only as needed
- fragile code introduced in Month 2
- docs/daily/day-54.md

### Prompt body
Month-2 hardening day.

Do exactly this:
1. remove duplicate logic
2. rename confusing helpers
3. reduce technical debt created in Month 2
4. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/parse-xbrl/tests -q
```

### Forbidden changes
- new routes
- new schema domains

### Rollback rule
- revert any change not clearly tied to hardening

---

## Day 55
### Touch only
- core web pages/components with accessibility issues
- apps/web/tests/accessibility.spec.ts
- docs/daily/day-55.md

### Prompt body
Accessibility and browser sanity pass.

Required fixes:
- contrast issues
- focus states
- keyboard flow
- obvious Safari/Chrome issues

No new features.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- accessibility.spec.ts || pnpm --filter web test
```

### Forbidden changes
- marketing rewrites
- schema

### Rollback rule
- revert anything unrelated to accessibility/browser sanity

---

## Day 56
### Touch only
- docs/monthly/month-2-review.md
- docs/daily/day-56.md

### Prompt body
Month-2 freeze.

Required outputs:
- month-2 review
- what shipped
- what is fragile
- what was cut
- what starts next in compensation work

No code unless strictly needed to fix a blocker.

### Acceptance tests
- docs written and accurate

### Forbidden changes
- new features

### Rollback rule
- revert any feature work added on freeze day

---

## Day 57
### Touch only
- packages/db/schema/011_compensation.sql
- packages/schemas/src/domain/compensation.ts
- docs/daily/day-57.md

### Prompt body
Create the executive compensation schema.

Required entities:
- executive
- executive_role_history
- comp_summary
- comp_award
- governance_fact

Keep schema normalized and auditable.
No giant flat comp table.

### Acceptance tests
- schema explains role history separately from comp facts

### Forbidden changes
- parser code
- public comp page

### Rollback rule
- revert if schema flattens away important comp structure

---

## Day 58
### Touch only
- services/parse-proxy/src/fetch_proxy.py
- services/parse-proxy/src/segment_proxy.py
- services/parse-proxy/tests/test_proxy_fetcher.py
- docs/daily/day-58.md

### Prompt body
Build the proxy fetcher and segmentation scaffold.

Required behavior:
- fetch proxy filing
- segment major sections
- locate candidate compensation tables
- preserve source links

### Acceptance tests
```
pytest services/parse-proxy/tests/test_proxy_fetcher.py -q
```

### Forbidden changes
- comp UI
- LLM parsing shortcuts

### Rollback rule
- revert if section segmentation is not reproducible

---

## Day 59
### Touch only
- services/parse-proxy/src/parse_sct.py
- services/parse-proxy/tests/test_parse_sct.py
- docs/daily/day-59.md

### Prompt body
Build the Summary Compensation Table parser.

Required outputs:
- salary
- bonus
- stock awards
- option awards
- non-equity
- pension change
- other comp
- total

Preserve raw-row references.
Do not guess missing values.

### Acceptance tests
```
pytest services/parse-proxy/tests/test_parse_sct.py -q
```

### Forbidden changes
- grants parsing
- governance parsing

### Rollback rule
- revert if parser silently fills missing cells with guesses

---

## Day 60
### Touch only
- services/parse-proxy/src/parse_grants.py
- services/parse-proxy/tests/test_parse_grants.py
- docs/daily/day-60.md

### Prompt body
Build the grants parser.

Required behavior:
- parse awards where present
- link to executives and periods
- keep ambiguity explicit

### Acceptance tests
```
pytest services/parse-proxy/tests/test_parse_grants.py -q
```

### Forbidden changes
- SCT changes unless required bugfix
- public page work

### Rollback rule
- revert if award data cannot be tied back to source rows
