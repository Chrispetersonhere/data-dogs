# Local Development: Infrastructure + CI Alignment

This runbook sets up only what Day 5 requires for local development parity with CI:

- `postgres`
- `clickhouse`
- object storage emulator (`minio`)
- `web` app
- `ingest-sec` service stub container

No staging or production infrastructure is defined here.

## Prerequisites

- Docker Engine with Docker Compose plugin
- Node.js 20+
- pnpm 10+

## Quick start

```bash
./infra/scripts/bootstrap.sh
```

What it does:

1. Installs workspace dependencies (`pnpm install`).
2. Validates compose syntax (`docker compose ... config`).
3. Starts local infra services in detached mode (`postgres`, `clickhouse`, `object-storage`, `ingest-sec`).

Start web app container:

```bash
docker compose -f infra/docker/docker-compose.yml up web
```

## Service endpoints

- Web: http://localhost:3000
- Ingest SEC stub: http://localhost:8081
- Postgres: `localhost:5432`
- ClickHouse HTTP: `localhost:8123`
- MinIO S3 API: http://localhost:9002
- MinIO Console: http://localhost:9001

## Verification

```bash
docker compose -f infra/docker/docker-compose.yml config
pnpm lint
pnpm typecheck
pnpm --filter web test
```

Python test command set used by CI:

```bash
pytest services/ingest-sec/tests -q
pytest services/parse-xbrl/tests -q
pytest services/parse-proxy/tests -q
pytest services/id-master/tests -q
pytest services/market-data/tests -q
```

If a service test directory does not yet exist in this repository snapshot, CI intentionally skips it and logs the skip.

## Shutdown

```bash
docker compose -f infra/docker/docker-compose.yml down
```
