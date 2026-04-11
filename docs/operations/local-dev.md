# Local Development Infrastructure

This project provides a **local-only** Docker Compose stack for Day 5 wiring and CI parity.
No staging or production infrastructure is included.

## Services
The compose stack in `infra/docker/docker-compose.yml` includes:
- `postgres` (PostgreSQL 16)
- `clickhouse` (ClickHouse server)
- `object-storage` (MinIO S3-compatible emulator)
- `web` (Next.js app from `apps/web`)
- `ingest-sec` (service wiring container for `services/ingest-sec`)

## Prerequisites
- Docker Engine with Docker Compose v2
- Node.js and pnpm (if running web commands outside containers)

## Bootstrap
From repository root:

```bash
bash infra/scripts/bootstrap.sh
```

This script:
1. validates `infra/docker/docker-compose.yml`,
2. starts all required Day 5 services,
3. prints local endpoints.

## Manual compose commands
Validate config:

```bash
docker compose -f infra/docker/docker-compose.yml config
```

Start:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

Stop:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

Stop and remove volumes:

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

## Notes
- The `ingest-sec` container is intentionally wired to run tests when `services/ingest-sec` exists; otherwise it stays alive and logs a clear message.
- The MinIO API is exposed on `localhost:9002` and console on `localhost:9001` to avoid clashing with ClickHouse native port `9000`.
