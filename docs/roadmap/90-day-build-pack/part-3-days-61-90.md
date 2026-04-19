# 90-Day Build Pack — Part 3 (Days 61 to 90)

See [README.md](./README.md) for the assumed repo contract, global Codex header, and
standard verification command palette.

Scope of this part: governance fact extraction, compensation QA interface, Week-9
compensation stabilization, public compensation page, insider ingest and
normalization, insider activity page, pay mix + insider heatmap charts, governance
cards, Week-10 stabilization, public API read models, core and extended API
endpoints, API auth and rate limits, API documentation, OpenAPI + Postman assets,
Week-11 API stabilization, messaging rewrite, design QA, speed optimization,
monitoring/alerts/backups, security review, first-user guided states, Week-12 beta
stabilization, invite-only beta onboarding, feedback-fix day, product analytics,
company/legal pages, release-candidate freeze, soft-launch retrospective and Q2
roadmap.

---

## Day 61
### Touch only
- services/parse-proxy/src/parse_governance.py
- services/parse-proxy/tests/test_parse_governance.py
- docs/daily/day-61.md

### Prompt body
Build governance fact extraction.

Required facts:
- CEO/chair structure
- compensation committee members where feasible
- say-on-pay result where feasible

Source-link everything.

### Acceptance tests
```
pytest services/parse-proxy/tests/test_parse_governance.py -q
```

### Forbidden changes
- UI work
- new schema

### Rollback rule
- revert if extracted governance facts are not source-linked

---

## Day 62
### Touch only
- apps/web/app/admin/qa/page.tsx
- apps/web/lib/api/comp-qa.ts
- apps/web/tests/comp-qa.spec.ts
- docs/daily/day-62.md

### Prompt body
Add a compensation QA interface.

Required layout:
- raw proxy table on one side
- parsed structured output on the other
- discrepancy highlights

Internal-only.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- comp-qa.spec.ts || pnpm --filter web test
```

### Forbidden changes
- public compensation page
- homepage

### Rollback rule
- revert if QA interface obscures discrepancies rather than surfacing them

---

## Day 63
### Touch only as needed
- files touched Days 57–62
- docs/weekly/week-9-review.md
- docs/daily/day-63.md

### Prompt body
Stabilize compensation extraction.

Do exactly this:
1. fix parser fragility
2. improve source linking
3. document limitations
4. write week-9 review
5. add no new features

### Acceptance tests
```
pytest services/parse-proxy/tests -q
pnpm --filter web build
```

### Forbidden changes
- new product modules

### Rollback rule
- revert any scope expansion beyond stabilization

---

## Day 64
### Touch only
- apps/web/app/company/[companyId]/compensation/page.tsx
- apps/web/lib/api/compensation.ts
- apps/web/tests/compensation-page.spec.ts
- docs/daily/day-64.md

### Prompt body
Build the compensation page.

Required content:
- executive table
- total comp history
- source links
- premium layout

Use real data only.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- compensation-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- insider UI
- screener changes

### Rollback rule
- revert if comp page is not usable on real data

---

## Day 65
### Touch only
- services/market-data/src/insider_ingest.py
- services/market-data/tests/test_insider_ingest.py
- packages/db/schema/012_insiders.sql
- docs/daily/day-65.md

### Prompt body
Ingest insider datasets.

Required behavior:
- raw + normalized separation
- source linkage
- issuer/security linkage where possible

No public page today.

### Acceptance tests
```
pytest services/market-data/tests/test_insider_ingest.py -q
```

### Forbidden changes
- charts
- company overview cards

### Rollback rule
- revert if insider ingest loses source traceability

---

## Day 66
### Touch only
- services/market-data/src/normalize_insiders.py
- services/market-data/tests/test_normalize_insiders.py
- docs/daily/day-66.md

### Prompt body
Normalize insider transactions.

Required classes:
- buy
- sell
- grant
- derivative event
- holdings change

Keep ambiguity explicit.

### Acceptance tests
```
pytest services/market-data/tests/test_normalize_insiders.py -q
```

### Forbidden changes
- page work
- API auth

### Rollback rule
- revert if normalization invents precision that source data does not support

---

## Day 67
### Touch only
- apps/web/app/company/[companyId]/insiders/page.tsx
- apps/web/lib/api/insiders.ts
- apps/web/tests/insiders-page.spec.ts
- docs/daily/day-67.md

### Prompt body
Build the insider activity page.

Required contents:
- latest activity list
- role filter
- filing drilldown
- premium table layout

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- insiders-page.spec.ts || pnpm --filter web test
```

### Forbidden changes
- homepage
- pricing

### Rollback rule
- revert if page is not chronological, readable, and source-linked

---

## Day 68
### Touch only
- apps/web/lib/charts/executivePayMix.ts
- apps/web/lib/charts/insiderHeatmap.ts
- apps/web/tests/charts-3.spec.ts
- docs/daily/day-68.md

### Prompt body
Build two premium charts.

Charts required:
- Executive Pay Mix Stack
- Insider Activity Heatmap

Real data only.
Institutional visual tone only.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- charts-3.spec.ts || pnpm --filter web test
```

### Forbidden changes
- new chart types
- homepage edits

### Rollback rule
- revert if visuals are flashy instead of analytical

---

## Day 69
### Touch only
- packages/ui/src/components/company/governanceCards.tsx
- apps/web/app/company/[companyId]/page.tsx
- apps/web/tests/company-governance.spec.ts
- docs/daily/day-69.md

### Prompt body
Add governance and ownership summary cards to company overview.

Required card topics:
- CEO/chair structure
- recent insider activity summary
- compensation highlights

Keep cards factual and compact.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- company-governance.spec.ts || pnpm --filter web test
```

### Forbidden changes
- chart redesigns
- screener changes

### Rollback rule
- revert if cards become bloated or speculative

---

## Day 70
### Touch only as needed
- files touched Days 64–69
- docs/weekly/week-10-review.md
- docs/daily/day-70.md

### Prompt body
Stabilize comp and insider modules.

Do exactly this:
1. fix UI inconsistencies
2. tighten labels
3. improve source traceability
4. write week-10 review
5. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/parse-proxy/tests -q
pytest services/market-data/tests -q
```

### Forbidden changes
- new modules

### Rollback rule
- revert any scope expansion beyond cleanup

---

## Day 71
### Touch only
- packages/schemas/src/api/companies.ts
- packages/schemas/src/api/filings.ts
- packages/schemas/src/api/financials.ts
- packages/schemas/src/api/compensation.ts
- packages/schemas/src/api/insiders.ts
- docs/daily/day-71.md

### Prompt body
Define stable public API read models.

Required behavior:
- versioned contracts
- conservative field design
- no leaking internal raw-storage implementation details

### Acceptance tests
- all response contracts exist and are type-checked

### Forbidden changes
- route handlers
- auth

### Rollback rule
- revert if read models expose unstable internals

---

## Day 72
### Touch only
- apps/web/app/api/v1/companies/route.ts
- apps/web/app/api/v1/filings/route.ts
- apps/web/app/api/v1/financials/route.ts
- apps/web/tests/api-core.spec.ts
- docs/daily/day-72.md

### Prompt body
Implement core public API endpoints.

Routes required:
- companies
- filings
- financials

Add pagination, validation, and stable response contracts.

### Acceptance tests
```
pnpm --filter web test -- api-core.spec.ts || pnpm --filter web test
pnpm --filter web build
```

### Forbidden changes
- comp API
- insider API
- pricing page

### Rollback rule
- revert if endpoint contracts drift from read models

---

## Day 73
### Touch only
- apps/web/app/api/v1/compensation/route.ts
- apps/web/app/api/v1/insiders/route.ts
- apps/web/app/api/v1/screener/route.ts
- apps/web/tests/api-extended.spec.ts
- docs/daily/day-73.md

### Prompt body
Implement extended public API endpoints.

Routes required:
- compensation
- insiders
- screener

Keep filters sane and outputs aligned with read models.

### Acceptance tests
```
pnpm --filter web test -- api-extended.spec.ts || pnpm --filter web test
pnpm --filter web build
```

### Forbidden changes
- API auth
- docs site

### Rollback rule
- revert if endpoints are broader than the read-model contract allows

---

## Day 74
### Touch only
- apps/web/lib/auth/apiKeys.ts
- apps/web/lib/auth/rateLimits.ts
- packages/db/schema/013_api_keys.sql
- apps/web/tests/api-auth.spec.ts
- docs/daily/day-74.md

### Prompt body
Add API auth and rate limits.

Required behavior:
- API keys
- request logging
- simple rate limits
- secure enough for beta users

No complex billing system.

### Acceptance tests
```
pnpm --filter web test -- api-auth.spec.ts || pnpm --filter web test
pnpm --filter web build
```

### Forbidden changes
- frontend pricing logic
- OAuth

### Rollback rule
- revert if auth becomes complex or weakly tested

---

## Day 75
### Touch only
- apps/docs/app/api/page.tsx
- apps/docs/app/api/[endpoint]/page.tsx
- docs/daily/day-75.md

### Prompt body
Write API documentation.

Required contents:
- endpoint descriptions
- query parameters
- example responses
- curl examples
- Python examples
- JS examples

Keep it developer-friendly and exact.

### Acceptance tests
```
pnpm --filter web build
```
- docs pages render and align with actual route behavior

### Forbidden changes
- route implementation drift

### Rollback rule
- revert if docs describe behavior not implemented

---

## Day 76
### Touch only
- packages/schemas/src/openapi.ts
- docs/api/postman-collection.json
- docs/daily/day-76.md

### Prompt body
Add developer QA assets.

Required outputs:
- OpenAPI spec or equivalent machine-readable API contract
- Postman collection or equivalent

Keep contracts aligned with the actual API.

### Acceptance tests
- spec and collection exist and map to real endpoints

### Forbidden changes
- new routes
- new auth features

### Rollback rule
- revert if docs artifacts are inconsistent with actual API behavior

---

## Day 77
### Touch only as needed
- files touched Days 71–76
- docs/weekly/week-11-review.md
- docs/daily/day-77.md

### Prompt body
Stabilize the public API layer.

Do exactly this:
1. fix naming inconsistencies
2. remove contract drift
3. tighten docs
4. write week-11 review
5. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter web test
```

### Forbidden changes
- marketing features

### Rollback rule
- revert any scope expansion beyond API stabilization

---

## Day 78
### Touch only
- apps/web/app/(marketing)/page.tsx
- apps/docs/app/product/page.tsx
- docs/daily/day-78.md

### Prompt body
Rewrite messaging around trust, provenance, auditability, and point-in-time correctness.

Remove:
- hype language
- vague AI claims
- swagger tone

No code beyond copy/layout refinements.

### Acceptance tests
- copy reads like a serious financial product

### Forbidden changes
- pricing logic
- schema

### Rollback rule
- revert if messaging drifts into startup cliché language

---

## Day 79
### Touch only
- any page/component with design defects
- docs/daily/day-79.md

### Prompt body
Full design QA day.

Audit and fix:
- spacing
- hierarchy
- chart sizing
- wrapping
- overflow
- breakpoint inconsistencies

No new features.

### Acceptance tests
```
pnpm --filter web build
```
- major pages look polished at all main breakpoints

### Forbidden changes
- backend logic
- schema

### Rollback rule
- revert any non-design change added today

---

## Day 80
### Touch only
- slow query files
- chart render files
- route-level data-fetching files
- docs/daily/day-80.md

### Prompt body
Speed optimization day.

Required work:
- profile slow pages
- reduce overfetching
- improve heavy query paths
- improve chart render behavior

Do not trade correctness for speed.

### Acceptance tests
```
pnpm --filter web build
```
- measurable improvement on core paths if profiling exists

### Forbidden changes
- new features

### Rollback rule
- revert any optimization that weakens correctness or traceability

---

## Day 81
### Touch only
- infra/monitoring/*
- infra/scripts/backup.sh
- docs/operations/backups.md
- docs/operations/alerts.md
- docs/daily/day-81.md

### Prompt body
Add monitoring, alerts, and backup procedures.

Required outputs:
- health checks
- failure alerts for ingestion and API
- backup script or documented backup workflow

Keep it minimal and operationally useful.

### Acceptance tests
- health/backup docs exist and are executable in spirit

### Forbidden changes
- full deployment platform work

### Rollback rule
- revert if operational complexity jumps beyond current scale

---

## Day 82
### Touch only
- auth/admin/API files needing security fixes
- docs/operations/security-review.md
- docs/daily/day-82.md

### Prompt body
Security review day.

Inspect and fix:
- admin route protection
- API auth and rate limiting
- secrets handling
- input validation

No new features.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test
```
- security review doc written with fixes and remaining risks

### Forbidden changes
- pricing system
- auth redesign

### Rollback rule
- revert any unnecessary auth architecture changes

---

## Day 83
### Touch only
- apps/web/app/(marketing)/page.tsx
- apps/web/app/company/[companyId]/page.tsx
- apps/web/app/screener/page.tsx
- docs/daily/day-83.md

### Prompt body
Add first-user guided states.

Required behavior:
- featured sample companies
- guided or preloaded screener examples
- first-user cues that show value quickly

Use real sample entities only.

### Acceptance tests
```
pnpm --filter web build
```
- first-time user can understand product value without training

### Forbidden changes
- fake data
- fake success metrics

### Rollback rule
- revert if onboarding relies on fabricated examples

---

## Day 84
### Touch only as needed
- files touched Days 78–83
- docs/weekly/week-12-review.md
- docs/daily/day-84.md

### Prompt body
Beta-readiness stabilization.

Do exactly this:
1. fix beta blockers
2. update docs
3. mark unfinished areas clearly
4. write week-12 review
5. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter web test
pytest services/ingest-sec/tests -q
pytest services/parse-xbrl/tests -q
pytest services/parse-proxy/tests -q
pytest services/id-master/tests -q
pytest services/market-data/tests -q
```

### Forbidden changes
- new product modules

### Rollback rule
- revert any work beyond beta stabilization

---

## Day 85
### Touch only
- apps/web/app/(marketing)/beta/page.tsx
- apps/web/lib/auth/betaInvites.ts
- packages/db/schema/014_beta_invites.sql
- docs/daily/day-85.md

### Prompt body
Build invite-only beta onboarding.

Required behavior:
- invite records
- acceptance flow
- minimal tracking
- simple UX

No full billing or account management system.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test
```
- invite-only flow exists and is testable

### Forbidden changes
- pricing engine
- subscriptions

### Rollback rule
- revert if onboarding becomes overengineered

---

## Day 86
### Touch only
- files tied directly to beta-user pain points
- docs/daily/day-86.md

### Prompt body
Feedback-fix day.

Do exactly this:
1. triage real feedback
2. fix the top 3–5 most painful issues only
3. do not widen scope
4. document what was fixed and what was deferred

### Acceptance tests
- targeted issues are fixed and documented

### Forbidden changes
- new features not requested by users

### Rollback rule
- revert any speculative feature work introduced on feedback day

---

## Day 87
### Touch only
- apps/web/lib/analytics/*
- docs/operations/analytics.md
- docs/daily/day-87.md

### Prompt body
Add product analytics instrumentation.

Required events:
- company search
- filing click
- screener run
- financials view
- compensation view
- API key usage

Keep it privacy-conscious and simple.

### Acceptance tests
- event definitions documented
- instrumentation paths exist

### Forbidden changes
- ad-tech style tracking
- invasive user profiling

### Rollback rule
- revert if analytics become creepier than necessary

---

## Day 88
### Touch only
- apps/web/app/(marketing)/pricing/page.tsx
- apps/web/app/(marketing)/terms/page.tsx
- apps/web/app/(marketing)/privacy/page.tsx
- apps/web/app/(marketing)/contact/page.tsx
- docs/daily/day-88.md

### Prompt body
Add minimal company/legal pages.

Required pages:
- pricing
- terms
- privacy
- contact

Pricing may be placeholder but must be credible.
Keep legal copy clean and minimal.

### Acceptance tests
```
pnpm --filter web build
```
- all pages route correctly

### Forbidden changes
- billing backend
- fake enterprise claims

### Rollback rule
- revert if legal/company pages overclaim capability

---

## Day 89
### Touch only
- files required for release-candidate bug fixes
- docs/release-candidate.md
- docs/daily/day-89.md

### Prompt body
Release-candidate freeze day.

Do exactly this:
1. stop feature work
2. run full regression
3. document known issues
4. write rollback steps
5. cut the release candidate

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter web test
pytest services/ingest-sec/tests -q
pytest services/parse-xbrl/tests -q
pytest services/parse-proxy/tests -q
pytest services/id-master/tests -q
pytest services/market-data/tests -q
```

### Forbidden changes
- any new feature

### Rollback rule
- revert any commit that is not a release blocker fix

---

## Day 90
### Touch only
- docs/monthly/month-3-review.md
- docs/roadmap/q2-roadmap.md
- docs/daily/day-90.md

### Prompt body
Soft-launch and retrospective day.

Required outputs:
1. soft-launch build prepared or deployed
2. recorded demo walkthrough
3. 90-day retrospective with:
   - what shipped
   - what is strong
   - what is weak
   - what is next
4. next-quarter roadmap based on reality, not ambition theater

No new feature work.

### Acceptance tests
- retrospective and roadmap both exist and are concrete

### Forbidden changes
- feature additions
- architecture rewrites

### Rollback rule
- revert any last-minute feature impulse
