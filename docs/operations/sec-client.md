# SEC Client Operations Guide (Day 6)

## Purpose

`services/ingest-sec/src/client.py` provides a production-safe SEC HTTP client with:

- Declared `User-Agent` headers on every request.
- Request throttling (requests-per-second budget).
- Retries with exponential backoff for transient failures.
- Configurable request timeout.
- Structured JSON logging for request/retry/failure telemetry.
- Generic `get` and `get_json` helpers.
- Raw artifact download helper (`download_file`).

## Configuration

Environment variables:

- `SEC_USER_AGENT` (required): contact string expected by SEC fair-access policy.
- `SEC_REQUESTS_PER_SECOND` (default: `5`)
- `SEC_REQUEST_TIMEOUT_SECONDS` (default: `10`)
- `SEC_MAX_RETRIES` (default: `3`)
- `SEC_BACKOFF_BASE_SECONDS` (default: `0.5`)
- `SEC_MAX_BACKOFF_SECONDS` (default: `8`)

Example:

```bash
export SEC_USER_AGENT="DataDogsResearch/1.0 (ops@yourdomain.com)"
export SEC_REQUESTS_PER_SECOND="5"
export SEC_REQUEST_TIMEOUT_SECONDS="10"
export SEC_MAX_RETRIES="3"
```

## Runtime behavior

- Retryable HTTP statuses: `429`, `500`, `502`, `503`, `504`.
- Timeout and network errors are retried until `max_retries` is exhausted.
- Throttle is enforced centrally in the client and cannot be bypassed by helper methods.
- `SEC_REQUESTS_PER_SECOND` is validated not to exceed `10` requests/second (SEC fair-access ceiling).
- Structured logs are emitted as JSON to standard output.

## Verification

Run service tests (cross-platform):

```bash
python -m pytest services/ingest-sec/tests -q
```

Windows PowerShell copy/paste verification:

```powershell
# From repo root (if already in repo, skip Set-Location)
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs

# Ensure Python is available
python --version

# Install pytest if missing
python -m pip install pytest

# Run ingest-sec tests
python -m pytest services/ingest-sec/tests -q
```

If `pnpm lint` / `pnpm typecheck` fails with `'turbo' is not recognized`, install dependencies first:

```powershell
pnpm install
pnpm lint
pnpm typecheck
```

## Windows troubleshooting (exact errors)

If you see `Cannot find path 'C:\workspace\data-dogs'`, that is expected on Windows because `/workspace/...` is a Linux path. Stay in your existing repo path, for example:

```powershell
Set-Location C:\Users\lolvi\Documents\GitHub\data-dogs
```

If you see `pytest : The term 'pytest' is not recognized`, run tests through Python:

```powershell
python -m pip install pytest
python -m pytest services/ingest-sec/tests -q
```

If you see `'turbo' is not recognized`, install workspace dependencies:

```powershell
pnpm install
pnpm lint
pnpm typecheck
```

If `pnpm --filter web build` fails with `Cannot find module ...\\next\\dist\\bin\\next`, dependencies for `apps/web` are missing; run:

```powershell
pnpm install
pnpm --filter web build
```
