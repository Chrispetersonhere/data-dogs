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
- Node.js 20+
- Corepack enabled (`corepack enable`)

## Bootstrap local environment

From repository root:

```bash
infra/scripts/bootstrap.sh
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
- MinIO S3 API: `http://localhost:9001`
- MinIO Console: `http://localhost:9002`

## Notes on current repository state

- The `services/ingest-sec` code directory is not present in this snapshot.
- The compose service is still created so networking and environment wiring are preserved for local integration.
- CI test steps for Python services are conditional and skip missing directories with explicit logs.
