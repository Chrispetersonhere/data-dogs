# Day 58 - Proxy fetcher and segmentation scaffold

## Scope
Implemented a production-safe scaffold for proxy ingestion and section segmentation limited to parse-proxy.

## What changed
- Added `fetch_proxy.py` with `fetch_proxy_filing` to fetch proxy content and emit provenance metadata:
  - source URL
  - accession
  - fetch timestamp (UTC ISO8601)
  - source checksum (SHA-256)
  - parser version
  - job id
- Added `segment_proxy.py` with deterministic major-section segmentation and candidate compensation-table detection.
- Added tests in `test_proxy_fetcher.py` covering:
  - provenance metadata preservation
  - section segmentation
  - compensation-table candidate detection
  - source-link preservation

## Provenance and auditability
The scaffold preserves source linkage and checksum at fetch time and carries source URL + checksum into segmentation outputs so downstream transformations can remain traceable.

## Definition-of-done status
- **Code + tests are implemented** for the Day 58 prompt requirements.
- **Acceptance is complete only when the Day 58 test command runs in the target environment.**
- If `pytest` is unavailable on Windows, install it in the repo's Python environment first, then run the acceptance command.

## Verification
- `pytest services/parse-proxy/tests/test_proxy_fetcher.py -q`

## Windows PowerShell verification (copy/paste)
```powershell
# from repo root
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install pytest
python -m pytest services/parse-proxy/tests/test_proxy_fetcher.py -q
git show --name-only --oneline -1
```

## Notes
- Segmentation is deterministic and heuristic-based; no LLM parsing shortcuts were added.
- If section segmentation becomes non-reproducible under real filings, rollback should revert these files and refine header heuristics offline before re-enabling.
