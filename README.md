# Data Dogs

Monorepo for building a SEC-native financial data platform, with active implementation underway.

## Current State
Implemented baseline project scaffolding and initial product code:
- **Monorepo + build orchestration:** pnpm workspace + Turbo task graph.
- **Web app shell:** Next.js app in `apps/web`.
- **Shared UI package:** reusable primitives in `packages/ui`.
- **DB package skeleton:** SQL schema/migration scaffolding in `packages/db`.
- **SEC ingest service foundation:** Python SEC client with throttling/retry/timeout behavior and unit tests in `services/ingest-sec`.
- **CI baseline:** lint, typecheck, JS tests, and Python service tests.

## Run Locally
### Prerequisites
- Node.js 20+
- pnpm 10+
- Python 3.12+ (for Python service tests)

### Install dependencies
```bash
pnpm install
```

### Start the web app
```bash
pnpm --filter web dev
```

### Windows PowerShell quickstart (recommended)
Use `python -m pytest` and complete install before running JS checks:

```powershell
Set-Location C:\dev\data-dogs  # prefer C:\dev over Documents/OneDrive-managed paths
pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store\v10"
pnpm install --force --node-linker=hoisted --no-frozen-lockfile

pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

python -m pip install -r services/ingest-sec/requirements.txt
python -m pytest services/ingest-sec/tests -q
```

If install fails with `EACCES` or broken symlink targets in `node_modules`, run:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force
icacls . /grant "$($env:USERDOMAIN)\$($env:USERNAME):(OI)(CI)F" /T
attrib -R .\* /S /D
cmd /c rmdir /s /q node_modules
cmd /c rmdir /s /q packages\db\node_modules
cmd /c rmdir /s /q packages\ui\node_modules
cmd /c rmdir /s /q apps\web\node_modules
pnpm store prune
pnpm install --force --node-linker=hoisted --no-frozen-lockfile
```

If you see any of these after a failed install:
- `'turbo' is not recognized as an internal or external command`
- `'next' is not recognized as an internal or external command`
- `'tsx' is not recognized as an internal or external command`

that means workspace dependencies were not installed successfully yet. Do **not** debug lint/typecheck/build/test first—complete the reset + reinstall flow above, then rerun commands.

For full fallback (including fresh clone to `C:\dev\data-dogs-clean`), see `docs/operations/local-dev.md`.


### Optional local infra
A Docker Compose setup is available under `infra/docker/docker-compose.yml` for local Postgres/Redis/MinIO and service wiring.

## Validation Commands
### Monorepo checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Python ingest-sec tests
```bash
python -m pip install -r services/ingest-sec/requirements.txt
PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q
```

## Test Each Component Locally

Quick-reference for running each component's checks from the repository root.

| Component | Type | Test Command | Status |
|-----------|------|-------------|--------|
| `apps/web` | Next.js | `pnpm --filter web test` | ✅ tests |
| `services/ingest-sec` | Python | `PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q` | ✅ tests |
| `services/parse-xbrl` | Python | `PYTHONPATH=services/parse-xbrl python -m pytest services/parse-xbrl/tests -q` | ⚠️ stub |
| `services/id-master` | Python | `PYTHONPATH=services/id-master python -m pytest services/id-master/tests -q` | ⚠️ stub |
| `packages/ui` | TS/React | `pnpm --filter @data-dogs/ui typecheck` | lint/typecheck only |
| `packages/db` | TS | `pnpm --filter @data-dogs/db typecheck` | lint/typecheck only |

### apps/web (Next.js)

**Prerequisites:** Node.js 20+, pnpm 10+

```bash
pnpm install                   # install all workspace dependencies
pnpm --filter web dev          # dev server → http://localhost:3000
pnpm --filter web test         # unit tests (Node test runner via tsx)
pnpm --filter web lint         # ESLint
pnpm --filter web typecheck    # TypeScript
pnpm --filter web build        # production build
```

### services/ingest-sec (Python)

**Prerequisites:** Python 3.12+, pip

```bash
python -m pip install -r services/ingest-sec/requirements.txt
PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q
```

> **Note:** `SEC_USER_AGENT` must be set for live SEC API calls. Unit tests mock this value.
> See `docs/operations/sec-client.md` for full configuration details.

### services/parse-xbrl (Python)

**Prerequisites:** Python 3.12+, pytest

```bash
python -m pip install pytest   # no requirements.txt yet
PYTHONPATH=services/parse-xbrl python -m pytest services/parse-xbrl/tests -q
```

> **Note:** Stub service — tests are self-contained with no external dependencies.

### services/id-master (Python)

**Prerequisites:** Python 3.12+, pytest

```bash
python -m pip install pytest   # no requirements.txt yet
PYTHONPATH=services/id-master python -m pytest services/id-master/tests -q
```

> **Note:** Stub service — tests are self-contained with no external dependencies.

### packages/ui

```bash
pnpm --filter @data-dogs/ui lint        # ESLint
pnpm --filter @data-dogs/ui typecheck   # TypeScript
```

> No unit tests configured yet.

### packages/db

```bash
pnpm --filter @data-dogs/db lint        # ESLint
pnpm --filter @data-dogs/db typecheck   # TypeScript
```

> No unit tests configured yet.

## Run Full Local Stack

The Docker Compose stack starts all infrastructure and services locally.

```bash
# one-command bootstrap (validates docker, installs deps, starts services)
./infra/scripts/bootstrap.sh

# — or manually —
docker compose -f infra/docker/docker-compose.yml up -d
```

**Exposed endpoints:**

| Service | URL |
|---------|-----|
| Web app | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |
| ClickHouse HTTP | `http://localhost:8123` |
| MinIO S3 API | `http://localhost:9001` |
| MinIO Console | `http://localhost:9002` |

```bash
# stop services
docker compose -f infra/docker/docker-compose.yml down

# stop and remove volumes
docker compose -f infra/docker/docker-compose.yml down -v
```

For detailed Docker troubleshooting and Windows-specific instructions, see `docs/operations/local-dev.md`.

## Documentation
- `docs/operations/local-dev.md` — local dev + infrastructure notes.
- `docs/operations/sec-client.md` — SEC client behavior and troubleshooting.
- `docs/roadmap/90-day-roadmap.md` — phased plan.
