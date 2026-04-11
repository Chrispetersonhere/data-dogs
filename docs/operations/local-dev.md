# Local Development Operations

This project supports **local-only development infrastructure** via Docker Compose.
No staging or production infrastructure is included in this repository.

## Prerequisites
- Docker Desktop / Docker Engine with Docker Compose v2 available on PATH.
- Node.js 20+
- pnpm 10+
- Python 3.12+
- Optional on Windows: Git Bash or WSL if you want to run `bootstrap.sh`.

## Services
The local stack defined in `infra/docker/docker-compose.yml` includes:
- `postgres` (OLTP metadata store)
- `clickhouse` (analytics/time-series warehouse)
- `object-storage` (MinIO S3-compatible emulator)
- `web` (Next.js app)
- `ingest-sec` (local placeholder service process)

## Docker command checks (Windows/PowerShell first)
Before running compose commands, verify Docker is installed and available:

```powershell
docker --version
docker compose version
```

If PowerShell reports `docker : The term 'docker' is not recognized...`, install Docker Desktop and restart your terminal session.

## Bootstrap options
### Option A: bootstrap script (requires bash)
Run from repository root:

```powershell
bash infra/scripts/bootstrap.sh
```

If PowerShell reports `bash : The term 'bash' is not recognized...`, install Git for Windows (Git Bash) or WSL.

### Option B: PowerShell-only (no bash required)
Start the core infrastructure directly:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d postgres clickhouse object-storage
```

## Compose lifecycle
Start all services:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Stop all services:

```powershell
docker compose -f infra/docker/docker-compose.yml down
```

Remove volumes as well:

```powershell
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

```powershell
docker compose -f infra/docker/docker-compose.yml config
```

Run CI-equivalent checks locally:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web test
python -c "import sys,unittest; suite=unittest.defaultTestLoader.discover('.'); total=suite.countTestCases(); print(f'Discovered {total} Python unittest test case(s).'); sys.exit(0) if total==0 else sys.exit(0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1)"
```

## CI workflow content check (PowerShell-safe; no quote-escaping traps)
Use this native PowerShell check instead of a Python one-liner with nested quotes:

```powershell
$ci = Get-Content -Raw .github/workflows/ci.yml
$required = @(
  'push:'
  'pull_request:'
  'pnpm install --no-frozen-lockfile'
  'pnpm lint'
  'pnpm typecheck'
  'pnpm --filter web test'
  'unittest.defaultTestLoader.discover'
)
$missing = $required | Where-Object { -not $ci.Contains($_) }
if ($missing.Count -gt 0) {
  Write-Host "MISSING: $($missing -join ', ')"
  exit 1
}
Write-Host 'OK'
```
