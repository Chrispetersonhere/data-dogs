# 90-Day Build Pack — Part 1 (Days 1 to 31)

See [README.md](./README.md) for the assumed repo contract, global Codex header, and
standard verification command palette.

Scope of this part: foundations (charter, monorepo, design system, initial schema, infra,
SEC client), ingestion job framework, submissions / companyfacts / frames backfills,
provenance ledger and admin tooling, resilience tests, issuer / security / identifier /
listing masters, point-in-time primitives, golden dataset, bulk submissions backfill,
SEC FS dataset ingest, notes staging, normalized fact skeleton, first real company
overview, QA reconciliation view, Month-1 freeze, canonical metric dictionary, XBRL
mapping engine, and restatement handling.

---

## Day 1
### Touch only
- docs/product/prd-v1.md
- docs/product/personas.md
- docs/product/non-goals.md
- docs/product/success-metrics.md
- docs/daily/day-1.md

### Prompt body
Today's scope is documentation only. No code. No config.

Write the v1 product charter for a U.S. public-company research terminal.

Required sections:
1. one-sentence product definition
2. target users: independent investor, professor/researcher, small fund analyst, RIA/consultant
3. exactly 5 core workflows
4. exact v1 modules
5. exact v1 exclusions
6. 90-day success metrics
7. product principles emphasizing trust, provenance, auditability, and point-in-time correctness

Do not add:
- pricing
- fundraising language
- global market coverage
- real-time trading claims
- CRSP replacement claims

### Acceptance tests
- Confirm only docs changed.
- Confirm `docs/product/prd-v1.md` has all 7 required sections.
- Confirm `docs/product/non-goals.md` contains at least 10 exclusions.

### Run
```
git diff --name-only
```

### Forbidden changes
- any code file
- any package config
- any migration

### Rollback rule
- revert entire day if any non-doc file changed

---

## Day 2
### Touch only
- package.json
- pnpm-workspace.yaml
- turbo.json
- .editorconfig
- .gitignore
- .prettierrc
- .eslintrc.*
- tsconfig.base.json
- docs/adr/ADR-0001-monorepo.md
- docs/daily/day-2.md

### Prompt body
Bootstrap the monorepo.

Implement exactly:
1. pnpm workspace
2. turbo tasks for lint, typecheck, test, build
3. root scripts for lint, typecheck, test, build, format
4. formatting and editor rules
5. ADR for monorepo decision

Keep it minimal. Do not add application logic.

### Acceptance tests
```
pnpm install
pnpm lint || true
pnpm typecheck || true
```
- root scripts exist
- workspace resolves without broken references

### Forbidden changes
- app routes
- service logic
- schema files

### Rollback rule
- revert if workspace install fails or if Codex adds framework-specific bloat not needed now

---

## Day 3
### Touch only
- apps/web/app/(marketing)/layout.tsx
- apps/web/app/(marketing)/page.tsx
- packages/ui/src/styles/tokens.ts
- packages/ui/src/components/ui/*
- packages/ui/src/components/layout/*
- docs/architecture/design-system.md
- docs/daily/day-3.md

### Prompt body
Create the premium design system foundation.

Required outputs:
1. design tokens for color, spacing, typography, radii, borders, shadows
2. reusable components: page container, section header, stat card, premium table shell, tab strip, filter chip, empty state
3. a style showcase page at the marketing home route
4. responsive behavior for mobile, tablet, desktop

Design constraints:
- restrained and institutional
- deep navy, charcoal, off-white, muted accent
- no loud gradients
- no cartoon illustrations
- no decorative animations

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test || true
```
- homepage renders a design-system showcase
- no TypeScript errors on touched files

### Forbidden changes
- data fetching
- API routes
- database files

### Rollback rule
- revert if design feels startup-generic or introduces visual inconsistency

---

## Day 4
### Touch only
- packages/db/schema/001_initial.sql
- packages/db/migrations/*
- packages/db/src/index.ts
- docs/architecture/erd-v1.md
- docs/daily/day-4.md

### Prompt body
Create the initial database schema.

Tables required:
- issuer
- filing
- filing_document
- raw_artifact
- ingestion_job
- parser_run

Every appropriate table must include provenance-safe fields.
Add obvious indexes.
Write an ERD markdown doc.

Do not add fact tables, compensation tables, or market-price tables.

### Acceptance tests
- migration file exists and is ordered correctly
- ERD explains relationships
- schema includes accession/source/checksum/parser-job lineage where relevant

### Run
```
git diff -- packages/db docs/architecture/erd-v1.md
```

### Forbidden changes
- app routes
- service logic
- auth

### Rollback rule
- revert if Codex merges issuer and security into one entity

---

## Day 5
### Touch only
- infra/docker/docker-compose.yml
- infra/scripts/bootstrap.sh
- .github/workflows/ci.yml
- docs/operations/local-dev.md
- docs/daily/day-5.md

### Prompt body
Create local infrastructure and CI.

Services required:
- postgres
- clickhouse
- object storage emulator
- web app
- ingest-sec service

CI must run install, lint, typecheck, web tests, and Python tests.
Keep it local-dev and CI only. No staging. No prod.

### Acceptance tests
```
docker compose -f infra/docker/docker-compose.yml config
```
- CI workflow parses
- local-dev doc exists and is executable in spirit

### Forbidden changes
- deployment infrastructure
- Kubernetes
- cloud resources

### Rollback rule
- revert if infra becomes more complex than needed for local + CI

---

## Day 6
### Touch only
- services/ingest-sec/src/client.py
- services/ingest-sec/src/config.py
- services/ingest-sec/src/logging.py
- services/ingest-sec/tests/test_client.py
- docs/operations/sec-client.md
- docs/daily/day-6.md

### Prompt body
Implement a production-safe SEC client.

Required behavior:
- declared User-Agent
- throttling
- retries with backoff
- timeout controls
- structured logging
- generic GET helper
- raw file download helper

Tests required:
- throttle behavior
- retry behavior
- timeout handling

Do not hardcode secrets or bypass throttle logic.

### Acceptance tests
```
pytest services/ingest-sec/tests/test_client.py -q
```
- tests pass
- logging captures request metadata

### Forbidden changes
- schema files
- web app pages

### Rollback rule
- revert if any request path can escape throttling or if retry logic is untested

---

## Day 7
### Touch only as needed
- any file created in Days 1–6
- docs/weekly/week-1-review.md
- docs/daily/day-7.md

### Prompt body
Stabilization day.

Do exactly this:
1. inspect everything added in Days 1–6
2. fix naming inconsistencies
3. remove premature abstractions
4. tighten docs
5. write a week-1 review with done/fragile/next

No new features.

### Acceptance tests
```
pnpm lint
pnpm typecheck
pytest services/ingest-sec/tests -q
```
- no new files unrelated to cleanup
- review doc written

### Forbidden changes
- new routes
- new schema tables
- new services

### Rollback rule
- revert any cleanup commit that widens scope

---

## Day 8
### Touch only
- services/ingest-sec/src/jobs/base.py
- services/ingest-sec/src/models/job_state.py
- services/ingest-sec/src/storage/job_store.py
- services/ingest-sec/tests/test_jobs_base.py
- docs/architecture/ingestion-jobs.md
- docs/daily/day-8.md

### Prompt body
Build the generic ingestion job framework.

Required features:
- job id
- source type
- state
- checkpoint
- retry count
- last error
- started_at / finished_at
- idempotent execution
- resume after failure

Do not add distributed queueing.
Do not add Celery.
Do not add orchestration beyond simple local job mechanics.

### Acceptance tests
```
pytest services/ingest-sec/tests/test_jobs_base.py -q
```
- jobs can resume without duplicate writes

### Forbidden changes
- web routes
- API docs
- schema unrelated to jobs

### Rollback rule
- revert if idempotency is not explicit and test-covered

---

## Day 9
### Touch only
- services/ingest-sec/src/jobs/submissions_backfill.py
- services/ingest-sec/src/parsers/submissions_parser.py
- services/ingest-sec/src/storage/raw_store.py
- services/ingest-sec/tests/test_submissions_backfill.py
- docs/daily/day-9.md

### Prompt body
Implement submissions backfill.

Required behavior:
1. fetch SEC submissions JSON for supplied issuers
2. store raw JSON in raw_artifact storage
3. store parsed filing headers separately in staging form
4. persist checkpoints
5. reruns must not duplicate records

Keep raw and parsed layers separate.

### Acceptance tests
```
pytest services/ingest-sec/tests/test_submissions_backfill.py -q
```
- test proves rerun is idempotent
- raw and parsed layers are not mixed

### Forbidden changes
- normalize facts
- add financial tables

### Rollback rule
- revert if raw JSON is overwritten instead of stored immutably

---

## Day 10
### Touch only
- services/ingest-sec/src/jobs/companyfacts_backfill.py
- services/ingest-sec/src/jobs/frames_backfill.py
- services/ingest-sec/src/parsers/companyfacts_parser.py
- services/ingest-sec/tests/test_companyfacts_frames.py
- docs/daily/day-10.md

### Prompt body
Implement companyfacts and frames ingestion.

Required behavior:
- fetch raw payloads
- store raw payloads immutably
- parse enough metadata for later normalization
- support checkpoints and resume
- add duplicate-protection tests

Do not normalize canonical metrics yet.

### Acceptance tests
```
pytest services/ingest-sec/tests/test_companyfacts_frames.py -q
```
- companyfacts and frames tests pass

### Forbidden changes
- canonical metric registry
- web financials UI

### Rollback rule
- revert if checkpoint/resume is absent or untested

---

## Day 11
### Touch only
- packages/db/schema/002_provenance.sql
- apps/web/app/admin/artifacts/page.tsx
- apps/web/lib/db/provenance.ts
- apps/web/tests/admin-artifacts.spec.ts
- docs/daily/day-11.md

### Prompt body
Create the provenance ledger and artifact inspection page.

Required display fields:
- source URL
- accession
- fetch timestamp
- checksum
- parser version
- job id
- status

Admin-only. Quiet design. No marketing polish.

### Acceptance tests
```
pnpm --filter web test -- admin-artifacts.spec.ts || pnpm --filter web test
pnpm --filter web build
```
- admin page renders and exposes required fields

### Forbidden changes
- public routes
- auth system beyond trivial admin gating

### Rollback rule
- revert page changes if artifact fields are incomplete or unauditable

---

## Day 12
### Touch only
- apps/web/app/admin/jobs/page.tsx
- apps/web/app/admin/qa/page.tsx
- apps/web/lib/api/admin.ts
- apps/web/tests/admin-qa.spec.ts
- docs/daily/day-12.md

### Prompt body
Build the admin QA dashboard.

Required features:
- job list with states
- failed artifact list
- parser failure summary
- link from failures to raw artifact inspection
- basic filter controls

Keep it internal-facing and functional.

### Acceptance tests
```
pnpm --filter web test -- admin-qa.spec.ts || pnpm --filter web test
pnpm --filter web build
```
- operator can navigate job -> failure -> artifact path in UI

### Forbidden changes
- public styling work
- homepage changes

### Rollback rule
- revert if the admin flow hides errors instead of exposing them clearly

---

## Day 13
### Touch only
- services/ingest-sec/tests/test_resume.py
- services/ingest-sec/tests/test_retries.py
- services/ingest-sec/tests/test_malformed_payloads.py
- docs/daily/day-13.md

### Prompt body
Add ingestion resilience tests only.

Required tests:
- interrupted job resume
- transient HTTP failure retry
- malformed payload handling
- duplicate rerun protection

Do not add new features.

### Acceptance tests
```
pytest services/ingest-sec/tests -q
```

### Forbidden changes
- implementation changes unless strictly necessary to make tests pass

### Rollback rule
- revert any non-test scope creep introduced today

---

## Day 14
### Touch only as needed
- files created in Days 8–13
- docs/weekly/week-2-review.md
- docs/daily/day-14.md

### Prompt body
Week-2 stabilization.

Do exactly this:
1. inspect ingestion and admin tooling
2. fix naming confusion and fragile code paths
3. improve docs
4. write week-2 review
5. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/ingest-sec/tests -q
```

### Forbidden changes
- new product pages
- new schema domains

### Rollback rule
- revert any change that is not cleanup or clarification

---

## Day 15
### Touch only
- services/id-master/src/issuer_master.py
- services/id-master/tests/test_issuer_master.py
- packages/db/schema/003_issuer_master.sql
- docs/daily/day-15.md

### Prompt body
Create the issuer master.

Required behavior:
- canonical issuer records
- current name and historical name tracking
- stable issuer identity independent of display-name changes

Do not create security records today.

### Acceptance tests
```
pytest services/id-master/tests/test_issuer_master.py -q
```
- historical names preserved

### Forbidden changes
- security master
- ticker-specific logic

### Rollback rule
- revert if issuer identity depends on current display name

---

## Day 16
### Touch only
- services/id-master/src/security_master.py
- services/id-master/tests/test_security_master.py
- packages/db/schema/004_security_master.sql
- docs/daily/day-16.md

### Prompt body
Create the security master.

Required behavior:
- separate security and listing records from issuer
- support multiple securities per issuer
- effective-dated listing relationships

Do not collapse security into issuer.

### Acceptance tests
```
pytest services/id-master/tests/test_security_master.py -q
```

### Forbidden changes
- public web routes
- financial statements

### Rollback rule
- revert if security and issuer concepts are merged

---

## Day 17
### Touch only
- services/id-master/src/identifier_map.py
- packages/db/schema/005_identifier_map.sql
- services/id-master/tests/test_identifier_map.py
- docs/daily/day-17.md

### Prompt body
Build the identifier mapping layer.

Required behavior:
- internal companyId, issuerId, securityId
- external identifiers such as ticker and CIK
- historical mapping support
- no assumption that one ticker equals one permanent identity

### Acceptance tests
```
pytest services/id-master/tests/test_identifier_map.py -q
```

### Forbidden changes
- OpenFIGI live integration
- public UI changes

### Rollback rule
- revert if the model assumes current ticker is permanent identity

---

## Day 18
### Touch only
- services/id-master/src/listing_history.py
- packages/db/schema/006_listing_history.sql
- services/id-master/tests/test_listing_history.py
- docs/daily/day-18.md

### Prompt body
Model listing and exchange history.

Required behavior:
- effective-dated listing records
- historical transitions preserved
- tests for listing moves and changes

### Acceptance tests
```
pytest services/id-master/tests/test_listing_history.py -q
```

### Forbidden changes
- current-state overwrite logic

### Rollback rule
- revert if historical listing truth is lost

---

## Day 19
### Touch only
- packages/db/src/pit.ts
- packages/db/src/sql/pit_queries.sql
- packages/db/tests/pit.test.ts
- docs/architecture/point-in-time.md
- docs/daily/day-19.md

### Prompt body
Implement point-in-time query primitives.

Required behavior:
- effective-as-of helper
- known-as-of helper
- tests proving no future data leaks backward
- docs explaining effective time vs known time

### Acceptance tests
```
pnpm --filter web test || true
pnpm --filter web build
```
- PIT tests exist and pass

### Forbidden changes
- new UI features
- normalization rules

### Rollback rule
- revert if no explicit anti-look-ahead test exists

---

## Day 20
### Touch only
- packages/db/seeds/golden_companies.sql
- docs/qa/golden-dataset.md
- services/id-master/tests/test_golden_cases.py
- docs/daily/day-20.md

### Prompt body
Create the golden validation dataset.

Required cases:
- name changes
- multiple securities
- amended filings
- complex histories
- identity ambiguity edge cases

Document why each case exists.

### Acceptance tests
```
pytest services/id-master/tests/test_golden_cases.py -q
```

### Forbidden changes
- app routes
- chart work

### Rollback rule
- revert if gold dataset is too small or trivial to be useful

---

## Day 21
### Touch only as needed
- files created Days 15–20
- docs/weekly/week-3-review.md
- docs/daily/day-21.md

### Prompt body
Stabilize the issuer/security/PIT layer.

Do exactly this:
1. inspect schema and tests
2. fix naming and relationship issues
3. remove duplicate logic
4. write week-3 review
5. add no new features

### Acceptance tests
```
pytest services/id-master/tests -q
pnpm typecheck
```

### Forbidden changes
- new routes
- new domains

### Rollback rule
- revert any scope expansion beyond cleanup

---

## Day 22
### Touch only
- services/ingest-sec/src/jobs/submissions_bulk_backfill.py
- services/ingest-sec/tests/test_submissions_bulk.py
- docs/daily/day-22.md

### Prompt body
Add bulk submissions backfill.

Required behavior:
- archive-aware ingestion
- work partitioning
- immutable raw storage
- progress tracking
- duplicate protection

### Acceptance tests
```
pytest services/ingest-sec/tests/test_submissions_bulk.py -q
```

### Forbidden changes
- financial normalization
- public UI work

### Rollback rule
- revert if bulk ingest path is less safe than single-issuer path

---

## Day 23
### Touch only
- services/parse-xbrl/src/fs_dataset_ingest.py
- services/parse-xbrl/tests/test_fs_dataset_ingest.py
- packages/db/schema/007_fs_staging.sql
- docs/daily/day-23.md

### Prompt body
Ingest SEC financial statement datasets into staging.

Required behavior:
- raw/staging separation
- preserve period metadata
- no canonical mapping yet

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_fs_dataset_ingest.py -q
```

### Forbidden changes
- financials UI
- ratio engine

### Rollback rule
- revert if staging layer starts acting like final normalized truth

---

## Day 24
### Touch only
- services/parse-xbrl/src/notes_ingest.py
- services/parse-xbrl/tests/test_notes_ingest.py
- packages/db/schema/008_notes_staging.sql
- docs/daily/day-24.md

### Prompt body
Add note/disclosure artifact ingest stubs.

Required behavior:
- store note artifacts
- link to filings and issuers
- keep the pipeline auditable

No note UX today.

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_notes_ingest.py -q
```

### Forbidden changes
- public note panel
- statement renderer

### Rollback rule
- revert if note artifacts are stored without linkage to source filing

---

## Day 25
### Touch only
- packages/db/schema/009_facts.sql
- services/parse-xbrl/src/fact_models.py
- services/parse-xbrl/tests/test_fact_models.py
- docs/daily/day-25.md

### Prompt body
Create the normalized fact skeleton.

Required models:
- xbrl_fact_raw
- xbrl_fact_normalized
- units
- periods
- source concept
- source filing
- normalization status

Do not build mapping rules yet.

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_fact_models.py -q
```

### Forbidden changes
- ratio formulas
- frontend charts

### Rollback rule
- revert if raw fact identity is lost in the normalized model

---

## Day 26
### Touch only
- apps/web/app/company/[companyId]/page.tsx
- apps/web/lib/api/company.ts
- apps/web/tests/company-overview.spec.ts
- docs/daily/day-26.md

### Prompt body
Build the first real company overview page.

Required contents:
- issuer metadata
- identity history summary
- filing count summary
- latest filings summary
- premium layout

Use real backend data, not mocks.

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- company-overview.spec.ts || pnpm --filter web test
```

### Forbidden changes
- compensation UI
- screener UI

### Rollback rule
- revert if the page uses fake data or placeholder text disguised as live data

---

## Day 27
### Touch only
- apps/web/app/admin/qa/page.tsx
- apps/web/lib/api/qa.ts
- apps/web/tests/qa-facts.spec.ts
- docs/daily/day-27.md

### Prompt body
Add a reconciliation QA view for facts.

Required behavior:
- show raw fact rows
- show normalized candidates
- make discrepancies obvious
- admin-only

### Acceptance tests
```
pnpm --filter web build
pnpm --filter web test -- qa-facts.spec.ts || pnpm --filter web test
```

### Forbidden changes
- public routes
- styling experiments

### Rollback rule
- revert if QA view hides ambiguity instead of surfacing it

---

## Day 28
### Touch only as needed
- files touched Days 22–27
- docs/monthly/month-1-review.md
- docs/daily/day-28.md

### Prompt body
Month-1 freeze.

Do exactly this:
1. fix P0/P1 issues only
2. align docs with implemented reality
3. write month-1 review
4. record what was cut
5. add no new features

### Acceptance tests
```
pnpm lint
pnpm typecheck
pnpm --filter web build
pytest services/ingest-sec/tests -q
pytest services/id-master/tests -q
pytest services/parse-xbrl/tests -q
```

### Forbidden changes
- new domains
- new routes

### Rollback rule
- revert any feature work sneaking into freeze day

---

## Day 29
### Touch only
- packages/schemas/src/domain/canonical_metrics.ts
- docs/data/canonical-metrics.md
- services/parse-xbrl/tests/test_canonical_metrics.py
- docs/daily/day-29.md

### Prompt body
Define the canonical metric dictionary.

Required scope:
- revenue
- gross profit
- operating income
- net income
- assets
- liabilities
- equity
- CFO
- capex
- FCF
- shares

Keep it tight. No metric sprawl.

### Acceptance tests
- confirm every metric has name, description, unit, and scope note

### Forbidden changes
- mapping engine implementation
- web page changes

### Rollback rule
- revert if dictionary becomes bloated or vague

---

## Day 30
### Touch only
- packages/parser-rules/src/xbrl_rules.ts
- services/parse-xbrl/src/mapper.py
- services/parse-xbrl/tests/test_mapper.py
- docs/daily/day-30.md

### Prompt body
Build the XBRL mapping rules engine.

Required behavior:
- deterministic raw-to-canonical mapping
- stored rule source
- confidence score
- auditable output

Do not use heuristics that cannot be explained.

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_mapper.py -q
```

### Forbidden changes
- charts
- screener
- ratio engine

### Rollback rule
- revert if mapped facts cannot explain why they were mapped

---

## Day 31
### Touch only
- services/parse-xbrl/src/restatement_resolution.py
- services/parse-xbrl/tests/test_restatement_resolution.py
- packages/db/schema/010_restatements.sql
- docs/daily/day-31.md

### Prompt body
Add amended filing/restatement handling.

Required behavior:
- supersession logic
- prior truth preserved
- current resolved truth represented separately

No destructive overwrites.

### Acceptance tests
```
pytest services/parse-xbrl/tests/test_restatement_resolution.py -q
```

### Forbidden changes
- public restatement viewer UI

### Rollback rule
- revert if history is overwritten instead of versioned
