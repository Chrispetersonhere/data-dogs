# Day 6 — SEC Client Hardening

## Scope completed

- Implemented SEC client configuration with explicit `User-Agent` requirement and runtime validation.
- Implemented production-safe HTTP client controls: throttling, timeout, retries, and exponential backoff.
- Added structured JSON logging support for request attempts, retries, failures, and file downloads.
- Added generic GET helper and raw file download helper.
- Added tests covering throttle behavior, retry behavior, and timeout handling (including URL error timeout mapping).

## Files changed

- `services/ingest-sec/src/config.py`
- `services/ingest-sec/src/logging.py`
- `services/ingest-sec/src/client.py`
- `services/ingest-sec/tests/test_client.py`
- `docs/operations/sec-client.md`
- `docs/daily/day-6.md`

## Validation commands

- `python -m pytest services/ingest-sec/tests -q`

## Risks / follow-ups

- The repository snapshot does not yet include the full ingest-sec runtime package scaffolding; tests dynamically load modules from `services/ingest-sec/src` to keep scope constrained.
- Before deploying, wire this client into the ingest job orchestration entrypoint and verify production SEC rate limits with real credentials and network policies.
- Windows local verification requires platform-correct commands (`python -m pytest`, Windows paths, and `pnpm install` before turbo-based scripts).
- On Windows, interrupted or locked installs can corrupt `node_modules/.pnpm`; documented a full reset workflow for `EACCES`/`ENOENT` recovery.
- Persistent `EACCES` on `node_modules/eslint` after cleanup indicates host ACL/protection issues; documented ACL reset + repo relocation path.
- Added Windows fallback to reinstall with `--node-linker=hoisted` and guidance for Controlled Folder Access environments.
- Added deterministic fallback: fresh clone into neutral path with fail-fast install (no silent error suppression) when repair-in-place keeps failing.
- Fresh-clone fallback now captures `remote.origin.url` from the existing repo to avoid placeholder clone URLs.
