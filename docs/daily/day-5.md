# Day 5 — Local Infrastructure and CI

## Scope completed

- Added local-only Docker Compose stack at `infra/docker/docker-compose.yml`.
- Added bootstrap script at `infra/scripts/bootstrap.sh`.
- Added CI workflow at `.github/workflows/ci.yml`.
- Added local development operations runbook at `docs/operations/local-dev.md`.
- Kept scope constrained to local-dev + CI only (no staging/prod/Kubernetes/cloud resources).

## What was implemented

### Local infrastructure services
- `postgres` (PostgreSQL 16)
- `clickhouse` (ClickHouse server)
- `object-storage` (MinIO object storage emulator)
- `web` (Next.js app container using workspace source)
- `ingest-sec` (local runtime container with service wiring)

### CI checks
- install dependencies (`pnpm install --no-frozen-lockfile`)
- lint (`pnpm lint`)
- typecheck (`pnpm typecheck`)
- web tests (`pnpm --filter web test`)
- Python tests for service directories, executed conditionally when paths exist via `python -m pytest`

## Validation commands run

- `docker compose -f infra/docker/docker-compose.yml config`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `python -m pytest services/ingest-sec/tests -q`
- `python -m pytest services/parse-xbrl/tests -q`
- `python -m pytest services/parse-proxy/tests -q`
- `python -m pytest services/id-master/tests -q`
- `python -m pytest services/market-data/tests -q`

## Risks / follow-ups

- Python service test folders are not present in this repository snapshot, so those commands currently fail locally unless guarded (CI is guarded).
- The `ingest-sec` compose service is wiring-ready but code-light in this snapshot; once the service exists, replace keepalive command with actual startup command.
- If a lockfile is introduced, switch install commands to frozen lockfile mode in CI/bootstrap.
- On Windows, `infra/scripts/bootstrap.sh` must be executed from Git Bash/WSL (or via `bash infra/scripts/bootstrap.sh` in PowerShell).
- If `bash` is unavailable on Windows, equivalent PowerShell bootstrap commands are documented in `docs/operations/local-dev.md`.
