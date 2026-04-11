# Local Development Operations

This project supports **local-only development infrastructure** via Docker Compose.
No staging or production infrastructure is included in this repository.

## Prerequisites
- Docker Desktop / Docker Engine with Docker Compose v2 available on PATH.
- Node.js 20+
- pnpm 10+
- Python 3.12+
- On Windows: run shell scripts through **Git Bash** or **WSL**.

## Services
The local stack defined in `infra/docker/docker-compose.yml` includes:
- `postgres` (OLTP metadata store)
- `clickhouse` (analytics/time-series warehouse)
- `object-storage` (MinIO S3-compatible emulator)
- `web` (Next.js app)
- `ingest-sec` (local placeholder service process)

## Quick start
From repository root:

```bash
bash infra/scripts/bootstrap.sh
```

That script validates compose config and starts core data infrastructure.

## Docker command checks
Before running compose commands, verify Docker is installed and available:

```bash
docker --version
docker compose version
```

If PowerShell reports `docker : The term 'docker' is not recognized...`, install Docker Desktop and restart your terminal session.

## Compose lifecycle
Start all services:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Stop all services:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

Remove volumes as well:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

## Connectivity defaults
- Postgres: `localhost:5432`
- ClickHouse HTTP: `localhost:8123`
- ClickHouse native: `localhost:9000`
- MinIO console: `localhost:9001`
- MinIO S3 API: `localhost:19000`
- Web app: `localhost:3000`
- Ingest SEC placeholder endpoint: `localhost:8080`

## Acceptance checks
Validate compose file:

```bash
docker compose -f infra/docker/docker-compose.yml config
```

Run CI-equivalent checks locally:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web test
python -m unittest discover -v
```
