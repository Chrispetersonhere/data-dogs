$ErrorActionPreference = 'Stop'

Write-Host 'Stopping node/pnpm processes (if running)...'
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force

$targets = @(
  'node_modules',
  'apps\web\node_modules',
  'packages\ui\node_modules',
  'packages\db\node_modules'
)

foreach ($target in $targets) {
  if (-not (Test-Path -LiteralPath $target)) {
    continue
  }

  Write-Host "Resetting ACL/attributes for $target ..."
  cmd /c "takeown /f \"$target\" /r /d y >nul 2>&1" | Out-Null
  cmd /c "icacls \"$target\" /grant \"$($env:USERNAME):(OI)(CI)F\" /T /C >nul 2>&1" | Out-Null
  cmd /c "attrib -R \"$target\" /S /D >nul 2>&1" | Out-Null

  Write-Host "Removing $target ..."
  cmd /c "rmdir /s /q \"$target\""

  if (Test-Path -LiteralPath $target) {
    throw "Failed to remove $target"
  }
}

Write-Host 'Node modules cleanup complete.'
