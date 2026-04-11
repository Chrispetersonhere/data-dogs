# Day 5 — Local Infrastructure + CI

## Scope completed
- Added local-only Docker Compose stack for required Day 5 services: postgres, clickhouse, object-storage emulator, web, and ingest-sec.
- Added bootstrap script to validate compose config and start the stack consistently.
- Added GitHub Actions CI workflow for install, lint, typecheck, web tests, and Python tests.
- Added local operations guide with executable commands and operational notes.
- Kept scope to local-dev and CI; no staging/prod, no Kubernetes, no cloud resources.

## Files touched
- `infra/docker/docker-compose.yml`
- `infra/scripts/bootstrap.sh`
- `.github/workflows/ci.yml`
- `docs/operations/local-dev.md`
- `docs/daily/day-5.md`

## Validation commands run
- `docker compose -f infra/docker/docker-compose.yml config`
- `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/ci.yml')"`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pytest services/ingest-sec/tests -q`
- `pytest services/parse-xbrl/tests -q`
- `pytest services/parse-proxy/tests -q`
- `pytest services/id-master/tests -q`
- `pytest services/market-data/tests -q`

## Risks / follow-ups
- Service directories for Python tests are not present in this repository snapshot, so those pytest paths currently fail locally unless added.
- `web` and `ingest-sec` services are wired for local development parity; ingest-sec runs in a compatibility mode when the service directory is absent.
- If CI policy later requires strict existence of all Python service tests, remove skip logic and enforce repository completeness first.
