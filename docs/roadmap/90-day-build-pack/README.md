# Ultra-Exact 90-Day Codex Build Pack

This directory holds the authoritative day-by-day execution plan for the 90-day build.
It is a strict execution rail for Codex / Claude Code: narrow scope per day, explicit
"touch only" file lists, acceptance tests, forbidden changes, and rollback rules.

The separate summary view lives at `docs/roadmap/90-day-roadmap.md`; this directory is the
detailed per-day contract.

## Parts

- [Part 1 — Days 1 to 31](./part-1-days-1-31.md) — Foundations, ingestion, admin tooling,
  issuer/security/PIT layer, fact skeleton, XBRL mapper, restatements.
- Part 2 — Days 32 to 60 — _pending upload_
- Part 3 — Days 61 to 90 — _pending upload_

## Assumed repo contract

```
/
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  │  ├─ (marketing)/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ pricing/page.tsx
│  │  │  │  ├─ terms/page.tsx
│  │  │  │  ├─ privacy/page.tsx
│  │  │  │  ├─ contact/page.tsx
│  │  │  │  └─ beta/page.tsx
│  │  │  ├─ company/[companyId]/
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ financials/page.tsx
│  │  │  │  ├─ compensation/page.tsx
│  │  │  │  └─ insiders/page.tsx
│  │  │  ├─ filings/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [accession]/page.tsx
│  │  │  ├─ screener/page.tsx
│  │  │  ├─ peers/page.tsx
│  │  │  ├─ admin/
│  │  │  │  ├─ jobs/page.tsx
│  │  │  │  ├─ artifacts/page.tsx
│  │  │  │  └─ qa/page.tsx
│  │  │  ├─ api/v1/
│  │  │  │  ├─ companies/route.ts
│  │  │  │  ├─ filings/route.ts
│  │  │  │  ├─ financials/route.ts
│  │  │  │  ├─ compensation/route.ts
│  │  │  │  ├─ insiders/route.ts
│  │  │  │  └─ screener/route.ts
│  │  │  └─ layout.tsx
│  │  ├─ lib/
│  │  │  ├─ api/
│  │  │  ├─ db/
│  │  │  ├─ charts/
│  │  │  ├─ formatting/
│  │  │  ├─ observability/
│  │  │  ├─ analytics/
│  │  │  └─ auth/
│  │  └─ tests/
│  └─ docs/
│     └─ app/
├─ services/
│  ├─ ingest-sec/
│  │  ├─ src/
│  │  │  ├─ client.py
│  │  │  ├─ config.py
│  │  │  ├─ logging.py
│  │  │  ├─ jobs/
│  │  │  ├─ parsers/
│  │  │  ├─ storage/
│  │  │  └─ models/
│  │  └─ tests/
│  ├─ parse-xbrl/
│  │  ├─ src/
│  │  └─ tests/
│  ├─ parse-proxy/
│  │  ├─ src/
│  │  └─ tests/
│  ├─ id-master/
│  │  ├─ src/
│  │  └─ tests/
│  └─ market-data/
│     ├─ src/
│     └─ tests/
├─ packages/
│  ├─ ui/
│  │  ├─ src/components/
│  │  └─ src/styles/
│  ├─ db/
│  │  ├─ migrations/
│  │  ├─ schema/
│  │  ├─ seeds/
│  │  ├─ src/
│  │  └─ tests/
│  ├─ schemas/
│  │  ├─ src/api/
│  │  ├─ src/domain/
│  │  └─ src/validation/
│  └─ parser-rules/
│     └─ src/
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ adr/
│  ├─ daily/
│  ├─ weekly/
│  ├─ monthly/
│  ├─ qa/
│  ├─ operations/
│  ├─ data/
│  ├─ marketing/
│  └─ api/
└─ infra/
   ├─ docker/
   ├─ scripts/
   └─ monitoring/
```

## Global Codex header

Use this at the top of every day.

```
You are working in a real production-bound monorepo for a financial data platform.

Hard rules:
1. Inspect the repository before editing.
2. Do not assume files exist; verify them.
3. Touch only the files listed for today unless a small supporting change is strictly necessary.
4. Keep the app and services working.
5. Prefer simple, production-safe implementations over clever abstractions.
6. Add or update tests for all non-trivial changes.
7. Do not widen scope.
8. Preserve provenance, point-in-time correctness, and auditability.
9. Update docs for every meaningful change.
10. At the end, provide:
   - summary of changes
   - files created/updated
   - commands run
   - risks / follow-ups
   - exact verification steps

Global non-negotiables:
- main branch must remain buildable
- all raw artifacts must preserve source URL, accession, fetch timestamp, checksum, parser version, and job id
- all transformed facts must remain traceable to raw source
- no dead code
- no TODO placeholders
- no silent schema changes

Before making changes:
- inspect current repo layout
- inspect relevant files
- restate today's scope in 5 bullets
- then implement
```

## Standard verification command palette

Use these unless the day says otherwise.

```
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
pytest services/ingest-sec/tests -q
pytest services/parse-xbrl/tests -q
pytest services/parse-proxy/tests -q
pytest services/id-master/tests -q
pytest services/market-data/tests -q
```

Operator note: verification is done in Windows PowerShell. Each day should end with a
copy-paste PowerShell block for PR verification (see any `docs/daily/day-NN.md`).

## What this pack is for

This is not a brainstorm. It is an execution rail. The point is to make Codex narrow,
test-bound, and unable to improvise itself into technical debt.

## Standard for success

At the end of 90 days, the right question is not "did we build everything?"
It is: "Would a serious finance user say this is clean, trustworthy, responsive, and
clearly becoming a real platform?"
