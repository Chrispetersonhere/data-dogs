# Day 5 — Local Infrastructure + CI Baseline

## Scope completed
- Added local-only Docker Compose stack with required services: Postgres, ClickHouse, object storage emulator, web app, and ingest-sec.
- Added `infra/scripts/bootstrap.sh` to validate and bring up core infrastructure quickly.
- Added GitHub Actions CI workflow to run install, lint, typecheck, web tests, and Python tests on push and pull request events, with `pnpm install --no-frozen-lockfile` for repos without a committed lockfile.
- Added local development operations runbook with startup/teardown and verification commands.
- Added Windows-oriented troubleshooting guidance for missing Docker CLI / shell mismatch, including a PowerShell-specific quick-start path.
- Kept scope constrained to local development and CI only (no staging/prod infrastructure).

## Files touched
- `infra/docker/docker-compose.yml`
- `infra/scripts/bootstrap.sh`
- `.github/workflows/ci.yml`
- `docs/operations/local-dev.md`
- `docs/daily/day-5.md`

## Validation commands run
- `python -m unittest discover -v`
- `python -c "from pathlib import Path; ci=Path('.github/workflows/ci.yml').read_text(); required=['push:','pull_request:','pnpm install --no-frozen-lockfile','pnpm lint','pnpm typecheck','pnpm --filter web test','python -m unittest discover -v']; missing=[x for x in required if x not in ci]; print('OK' if not missing else f'MISSING: {missing}'); raise SystemExit(0 if not missing else 1)"`

## Risks / follow-ups
- `ingest-sec` is currently wired as a minimal placeholder container process until the real service module is introduced.
- CI Python step runs `unittest discover`; if/when pytest-based Python services are added, update CI to install test dependencies and execute those suites explicitly.
- Docker-based acceptance checks require local Docker Desktop/Engine and cannot pass when `docker` is absent from PATH.
