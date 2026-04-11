# Local Development Operations

This project supports **local-only development infrastructure** via Docker Compose.
No staging or production infrastructure is included in this repository.

## Prerequisites
- Docker Engine with Docker Compose v2
- Node.js 20+
- pnpm 10+
- Python 3.12+

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
./infra/scripts/bootstrap.sh
```

That script validates compose config and starts core data infrastructure.

To start all services:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

To stop all services:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

To remove data volumes as well:

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
