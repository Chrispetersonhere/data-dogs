# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Data Dogs is a monorepo for a SEC-native financial data platform. It combines a Next.js web shell with Python services that ingest SEC filings (submissions, company facts, XBRL, proxy) and resolve issuer/security identity, backed by a SQL schema defined under `packages/db`.

## Monorepo layout

Workspaces are declared in `pnpm-workspace.yaml`:

- `apps/web` — Next.js 15.3.1 + React 19 app (App Router under `apps/web/app`, data/HTTP wrappers under `apps/web/lib/api`, shared charts and observability helpers under `apps/web/lib`). Tests under `apps/web/tests/*.spec.ts` use the Node test runner via `tsx --test`.
- `apps/docs` — secondary docs app.
- `packages/ui` (`@data-dogs/ui`) — shared React components. Consumed via subpath exports declared in `packages/ui/package.json` (`./components/layout`, `./components/financials`, `./components/charts`, etc.); add new surface areas by extending that `exports` map.
- `packages/db` (`@data-dogs/db`) — SQL schema, migrations, and seeds. Note: `schema/` holds the authoritative per-feature SQL files (001…011), while `migrations/` currently only has `001_initial.sql`. Keep both in sync if you add migrations.
- `packages/schemas`, `packages/parser-rules` — shared TypeScript modules.
- `services/ingest-sec` — Python SEC HTTP client + job framework (`src/client.py`, `src/jobs/`, `src/storage/`, `src/parsers/`, `src/models/`). See `docs/architecture/ingestion-jobs.md` and `docs/operations/sec-client.md`.
- `services/parse-xbrl`, `services/parse-proxy`, `services/id-master` — Python parsers/resolvers. Each is a flat `src/` + `tests/` Python package (no `__init__.py` package root), and tests are run with `PYTHONPATH=services/<name>`.
- `infra/docker/docker-compose.yml` — local Postgres + ClickHouse + MinIO + web + ingest-sec stack.
- `infra/scripts/bootstrap.sh`, `scripts/windows/*.ps1` — environment bootstrap and Windows recovery helpers.
- `docs/` — ADRs, architecture, operations, roadmap, QA. `docs/` is itself a pnpm workspace entry.

## Common commands

All JS/TS commands go through Turbo at the repo root:

    pnpm install                 # pnpm 10, Node 20+ (CI uses Node 24)
    pnpm lint                    # turbo run lint --continue     (ESLint, max-warnings=0)
    pnpm typecheck               # turbo run typecheck --continue (tsc --noEmit)
    pnpm test                    # turbo run test --continue     (depends on ^build)
    pnpm build                   # turbo run build --continue    (Next build for web)
    pnpm format                  # prettier --check .
    pnpm verify:workspace        # sanity check that root config + scripts exist

Per-workspace:

    pnpm --filter web dev        # Next dev server on :3000
    pnpm --filter web build
    pnpm --filter web test       # tsx --test tests/*.spec.ts
    pnpm --filter @data-dogs/ui typecheck

Run a single web test (bypass Turbo):

    pnpm --filter web exec tsx --test apps/web/tests/homepage.spec.ts

Python services (3.12+). CI installs only `services/ingest-sec/requirements.txt` and then iterates services, setting `PYTHONPATH` per service because each `src/` has no package `__init__.py`:

    python -m pip install -r services/ingest-sec/requirements.txt
    PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q
    PYTHONPATH=services/parse-xbrl  python -m pytest services/parse-xbrl/tests  -q
    PYTHONPATH=services/parse-proxy python -m pytest services/parse-proxy/tests -q
    PYTHONPATH=services/id-master   python -m pytest services/id-master/tests   -q

    # Single test file / single case:
    PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests/test_client.py -q
    PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests/test_client.py::test_name -q

Local infra (optional): `docker compose -f infra/docker/docker-compose.yml up -d` exposes web :3000, Postgres :5432, ClickHouse :8123, MinIO S3 :9001 / console :9002.

## Architecture notes worth loading before editing

- **Turbo task graph** (`turbo.json`): `build` and `test` both declare `dependsOn: ["^build"]`, so any workspace you touch must be buildable for downstream tests to run. Only `build` outputs are cached (`dist/**`, `build/**`, `.next/**`).
- **TS config** (`tsconfig.base.json`): `strict: true`, `noEmit: true`, `moduleResolution: "Bundler"`, ES2022. Packages extend this; typecheck is the source of truth, there is no separate `tsc` emit.
- **Lint policy**: ESLint runs with `--max-warnings=0` in every workspace, so warnings fail CI. Root config extends `next/core-web-vitals` and `@typescript-eslint/recommended`; `.eslintrc.cjs` ignores `node_modules/`, `.turbo/`, `dist/`, `build/`, `.next/`.
- **Prettier**: `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`. `.editorconfig` enforces LF + 2-space indent across the repo.
- **SEC client** (`services/ingest-sec/src/client.py`): central throttle, retry, and timeout behavior driven by env vars (`SEC_USER_AGENT` required; `SEC_REQUESTS_PER_SECOND` capped at 10). Helpers must go through the client — do not bypass the throttle. Retryable statuses: 429, 500, 502, 503, 504. See `docs/operations/sec-client.md`.
- **Job framework** (`services/ingest-sec/src/jobs/base.py` + `storage/job_store.py`): `JobRecord` lifecycle is `pending → running → failed | finished`; `checkpoint` is the next-unit index and only advances after a successful unit write, which is what gives idempotent reruns and resume-after-failure. Finished jobs are a no-op on rerun. See `docs/architecture/ingestion-jobs.md`.
- **DB schema** is feature-sliced under `packages/db/schema/` (`001_initial.sql` through `011_compensation.sql`). The ERD and rationale for v1 tables (`issuer`, `filing`, `filing_document`, `raw_artifact`, `ingestion_job`, `parser_run`) live in `docs/architecture/erd-v1.md`.
- **UI package exports**: `apps/web` imports from `@data-dogs/ui/components/<surface>`. When adding a new surface, register it in `packages/ui/package.json` `exports` or the import will fail at build time.

## CI (`.github/workflows/ci.yml`)

Order: install → `pnpm lint` → `pnpm typecheck` → `pnpm --filter web test` → Python service tests. Python steps are conditional on each `services/<name>/tests` directory existing and always invoke `python -m pytest` with `PYTHONPATH=services/<name>`. `services/market-data/tests` is referenced by CI but intentionally absent from this snapshot — don't be surprised by the skip log.

## Gotchas

- `pnpm install` without a completed run leaves `turbo`, `next`, and `tsx` missing from PATH; "command not recognized" errors mean install did not finish, not that the scripts are wrong. Re-run install before debugging lint/typecheck/build/test.
- `pnpm-workspace.yaml` lists `esbuild`, `sharp`, and `unrs-resolver` under `onlyBuiltDependencies`. If a Windows install warns that build scripts were ignored for those, pull latest before troubleshooting.
- Don't alternate pnpm installs between WSL and native Windows in the same checkout — the Linux-only optional binaries (`@img/sharp-libvips-linux-x64`, `@unrs/resolver-binding-linux-x64-gnu`) will EACCES. `scripts/windows/reset-node-modules.ps1` and `docs/operations/local-dev.md` document the full reset flow.
- Python service `src/` trees are import roots, not packages; always export `PYTHONPATH=services/<name>` before running `pytest` or imports will fail.
- `packages/db/migrations/` is not yet aligned with `packages/db/schema/` — treat `schema/` as authoritative when making changes until that is reconciled.
