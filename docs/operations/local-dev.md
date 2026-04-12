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

# IMPORTANT: only continue to step 4 if install succeeds.
# If install fails with EACCES on node_modules\eslint, run the recovery block below, then retry install once.

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

If install fails with `EACCES ... node_modules\eslint` on Windows, run this exact recovery block in PowerShell from repo root:

```powershell
# stop any locking processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force

# clean local install artifacts
if (Test-Path .\node_modules) { Remove-Item -Recurse -Force .\node_modules }
if (Test-Path .\pnpm-lock.yaml) { Remove-Item -Force .\pnpm-lock.yaml }

# clear pnpm metadata and reinstall with hoisted linker
pnpm store prune
pnpm install --force --node-linker=hoisted --no-frozen-lockfile
```

If install/build fails with `EACCES` on Linux-only optional packages (for example `@unrs/resolver-binding-linux-x64-gnu` or `@img/sharp-libvips-linux-x64`), your `node_modules` tree was likely created by WSL/Linux and then reused from Windows PowerShell. Use this exact reset in **PowerShell**:

```powershell
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs

# stop potential file-locking processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force

# remove mixed-OS install artifacts
cmd /c rmdir /s /q node_modules
cmd /c rmdir /s /q apps\web\node_modules
cmd /c rmdir /s /q packages\ui\node_modules
cmd /c rmdir /s /q packages\db\node_modules

# keep pnpm store in user profile and reinstall for Windows only
pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store\v10"
pnpm install --force --node-linker=hoisted --no-frozen-lockfile

# verify
pnpm --filter web typecheck
pnpm --filter web build
```

Important:
- Do not alternate installs between WSL and native Windows PowerShell in the same checkout.
- If you need both environments, keep two clones (for example `C:\dev\data-dogs-win` and `\\wsl$\Ubuntu\home\<you>\data-dogs-wsl`).

Then rerun:

```powershell
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
```

If the recovery block still fails with `EACCES` or `Remove-Item` path errors, use this deterministic fallback:

```powershell
# 1) Run PowerShell as Administrator for ACL repair, then return to repo
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs

# 2) Repair ACL/attributes on the working tree
icacls . /grant "$($env:USERDOMAIN)\$($env:USERNAME):(OI)(CI)F" /T
attrib -R .\* /S /D

# 3) Force-remove node_modules with cmd (more reliable than Remove-Item for deep trees)
cmd /c rmdir /s /q node_modules
cmd /c rmdir /s /q packages\db\node_modules
cmd /c rmdir /s /q packages\ui\node_modules
cmd /c rmdir /s /q apps\web\node_modules
if (Test-Path .\pnpm-lock.yaml) { Remove-Item -Force .\pnpm-lock.yaml }

# 4) Keep pnpm store outside the repo and reinstall
pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store\v10"
pnpm install --force --node-linker=hoisted --no-frozen-lockfile
```

If this still fails in `C:\Users\...\Documents`, do a fresh clone in a neutral path (`C:\dev`) and retry there:

```powershell
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs
$repoUrl = git config --get remote.origin.url
$branch = git rev-parse --abbrev-ref HEAD

Set-Location C:\
if (Test-Path .\dev\data-dogs-clean) { Remove-Item -Recurse -Force .\dev\data-dogs-clean }
git clone --branch $branch $repoUrl C:\dev\data-dogs-clean
Set-Location C:\dev\data-dogs-clean

pnpm config set store-dir "$env:LOCALAPPDATA\pnpm\store\v10"
pnpm install --force --node-linker=hoisted --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build
```

Why the first recovery can still fail:
- `Remove-Item -Recurse -Force` in PowerShell can partially fail on deep pnpm trees/symlinks, leaving broken entries behind.
- A later install can then fail in workspace package paths (for example `packages\db\node_modules\typescript\package.json`) even after root cleanup.
- Using `cmd /c rmdir /s /q` for root and package-level `node_modules` is more reliable for this specific failure mode.

Expected notes:
- `services/parse-xbrl/tests`, `services/parse-proxy/tests`, `services/id-master/tests`, and `services/market-data/tests` are currently absent in this repository snapshot; pytest will report missing paths for those commands.
- `turbo is not recognized` and `Cannot find module ... next` both indicate install did not complete; resolve install first, then rerun checks.

## Notes on current repository state

- The `ingest-sec` compose service is intentionally wiring-only in Week 1 and keeps the container running for manual service command execution.
- CI test steps for Python services are conditional and skip missing directories with explicit logs.
- If `pytest` is not installed locally, use `python -m pip install pytest` and run tests with `python -m pytest ...`.
- If `docker` is not installed, all compose/bootstrap steps will fail until Docker Desktop (or Docker Engine + Compose) is installed and on PATH.
- If `docker compose up` fails with `open //./pipe/docker_engine` on Windows, Docker Desktop is installed but the daemon is not running yet; start Docker Desktop and wait until it reports Engine running.
- The `web` compose service sets `CI=true` during `pnpm install` to avoid non-interactive TTY prompts in container startup.
