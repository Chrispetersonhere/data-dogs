# Day 5 — Local Infrastructure + CI Baseline

## Scope completed
- Added local-only Docker Compose stack with required services: Postgres, ClickHouse, object storage emulator, web app, and ingest-sec.
- Added `infra/scripts/bootstrap.sh` to validate and bring up core infrastructure quickly.
- Added GitHub Actions CI workflow to run install, lint, typecheck, web tests, and Python tests.
- Added local development operations runbook with startup/teardown and verification commands.
- Added Windows-oriented troubleshooting guidance for missing Docker CLI / shell mismatch.
- Kept scope constrained to local development and CI only (no staging/prod infrastructure).

## Files touched
- `infra/docker/docker-compose.yml`
- `infra/scripts/bootstrap.sh`
- `.github/workflows/ci.yml`
- `docs/operations/local-dev.md`
- `docs/daily/day-5.md`

## Validation commands run
- `python -m unittest discover -v`
- `python - <<'PY' ... (string validation for required CI steps) ... PY`

## Risks / follow-ups
- `ingest-sec` is currently wired as a minimal placeholder container process until the real service module is introduced.
- CI Python step runs `unittest discover`; if/when pytest-based Python services are added, update CI to install test dependencies and execute those suites explicitly.
- Docker-based acceptance checks require local Docker Desktop/Engine and cannot pass when `docker` is absent from PATH.
