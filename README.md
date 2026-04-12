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

## Documentation
- `docs/operations/local-dev.md` — local dev + infrastructure notes.
- `docs/operations/sec-client.md` — SEC client behavior and troubleshooting.
- `docs/roadmap/90-day-roadmap.md` — phased plan.
