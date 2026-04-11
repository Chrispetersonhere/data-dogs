# Day 5 — Local Infrastructure and CI

## Scope completed
- Added local Docker Compose stack with exactly the required services: `postgres`, `clickhouse`, object storage emulator (`minio`), `web`, and `ingest-sec`.
- Added bootstrap script to install dependencies, validate compose config, and start local infrastructure.
- Added GitHub Actions CI workflow to run install, lint, typecheck, web tests, and Python tests.
- Added local development operations runbook for setup, endpoints, verification, and shutdown.
- Kept scope limited to local dev + CI only (no staging/prod or deployment infrastructure).

## Commands run
- `docker compose -f infra/docker/docker-compose.yml config`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/parse-proxy/tests -q`
- `pytest services/id-master/tests -q`
- `pytest services/market-data/tests -q`

## Notes
- The repository snapshot currently does not include `services/*/tests` directories, so those pytest commands are expected to fail locally unless service repositories are present.
- CI handles this safely by running pytest only for service test paths that exist.
