$ErrorActionPreference = "Stop"

Write-Host "[day19] Verifying repository context..."
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Write-Host "[day19] Using repository root: $repoRoot"

if (-not (Test-Path ".venv")) {
  Write-Host "[day19] Creating virtual environment (.venv)..."
  py -3 -m venv .venv
}

Write-Host "[day19] Activating virtual environment..."
.\.venv\Scripts\Activate.ps1

Write-Host "[day19] Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r services/ingest-sec/requirements.txt

Write-Host "[day19] Running Day 19 verification tests..."
python -m pytest services/id-master/tests/test_identifier_map.py -q
python -m pytest services/id-master/tests/test_listing_history.py -q
python -m pytest services/id-master/tests/test_point_in_time_queries.py -q
python -m pytest services/id-master/tests -q

Write-Host "[day19] Verification complete."
