# Local Development Infrastructure (Day 5)

This repository now includes a local-only infrastructure stack and CI workflow for baseline quality checks.

## What is included

The local Docker Compose stack provides:

- PostgreSQL (`postgres`)
- ClickHouse (`clickhouse`)
- Object storage emulator via MinIO (`object-storage`)
- Web app (`web`)
- SEC ingest service placeholder/runtime container (`ingest-sec`)

No staging or production infrastructure is included.

## Prerequisites

- Docker with Docker Compose v2
- Docker Desktop/Engine daemon running
- Node.js 20+
- Corepack enabled (`corepack enable`)
- For Windows: run shell scripts through **Git Bash** or **WSL** (PowerShell does not natively execute `.sh` scripts)

## Bootstrap local environment

From repository root (bash shell):

```bash
infra/scripts/bootstrap.sh
```

Windows PowerShell equivalent:

```powershell
bash infra/scripts/bootstrap.sh
```

If `bash` is not installed on Windows, run the bootstrap steps directly in PowerShell:

```powershell
corepack enable
pnpm install --no-frozen-lockfile
docker compose -f infra/docker/docker-compose.yml up -d
```

This script will:
1. validate `docker`, `docker compose`, and `corepack`
2. run `pnpm install --no-frozen-lockfile`
3. start the local stack with Docker Compose

## Manual compose commands

Validate compose file:

```bash
docker compose -f infra/docker/docker-compose.yml config
```

PowerShell:

```powershell
docker compose -f infra/docker/docker-compose.yml config
```

Recommended PowerShell preflight checks:

```powershell
Get-Command docker -ErrorAction SilentlyContinue
Get-Command node -ErrorAction SilentlyContinue
Get-Command pnpm -ErrorAction SilentlyContinue
Get-Command python -ErrorAction SilentlyContinue
docker version
```

Start services:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Stop services:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

Remove volumes:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

## Endpoints and ports

- Web app: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- ClickHouse HTTP: `http://localhost:8123`
- MinIO S3 API (host): `http://localhost:9001`
- MinIO Console (host): `http://localhost:9002`


## Windows PowerShell: copy/paste verification from zero

Use this exact sequence from a normal PowerShell prompt:

```powershell
# 1) Go to your existing clone path (do NOT use /workspace/... on Windows)
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs

# 2) Verify required tools
node --version
pnpm --version
python --version

# 3) Install JS dependencies first (fixes "turbo is not recognized" and missing next binary)
pnpm install --no-frozen-lockfile

# 4) Run JS checks
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# 5) Ensure pytest is available, then run Python checks
python -m pip install --upgrade pip
python -m pip install pytest
python -m pytest services/ingest-sec/tests -q
python -m pytest services/parse-xbrl/tests -q
python -m pytest services/parse-proxy/tests -q
python -m pytest services/id-master/tests -q
python -m pytest services/market-data/tests -q
```

Expected notes:
- `services/parse-xbrl/tests`, `services/parse-proxy/tests`, `services/id-master/tests`, and `services/market-data/tests` are currently absent in this repository snapshot; pytest will report missing paths for those commands.
- If `pnpm lint`/`pnpm typecheck` still fail after install, re-run `pnpm install --force` once and retry.

## Notes on current repository state

- The `ingest-sec` compose service is intentionally wiring-only in Week 1 and keeps the container running for manual service command execution.
- CI test steps for Python services are conditional and skip missing directories with explicit logs.
- If `pytest` is not installed locally, use `python -m pip install pytest` and run tests with `python -m pytest ...`.
- If `docker` is not installed, all compose/bootstrap steps will fail until Docker Desktop (or Docker Engine + Compose) is installed and on PATH.
- If `docker compose up` fails with `open //./pipe/docker_engine` on Windows, Docker Desktop is installed but the daemon is not running yet; start Docker Desktop and wait until it reports Engine running.
- The `web` compose service sets `CI=true` during `pnpm install` to avoid non-interactive TTY prompts in container startup.
