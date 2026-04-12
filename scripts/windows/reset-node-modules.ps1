$ErrorActionPreference = 'Stop'

function Invoke-BestEffortCmd {
  param(
    [Parameter(Mandatory = $true)][string]$Command
  )

  cmd /c "$Command >nul 2>&1"
}

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
  Invoke-BestEffortCmd "takeown /f \"$target\" /r /d y"
  Invoke-BestEffortCmd "icacls \"$target\" /grant \"$($env:USERNAME):(OI)(CI)F\" /T /C"
  Invoke-BestEffortCmd "attrib -R \"$target\" /S /D"

  Write-Host "Removing $target ..."
  Invoke-BestEffortCmd "rmdir /s /q \"$target\""

  if (Test-Path -LiteralPath $target) {
    $absolute = (Resolve-Path -LiteralPath $target).Path
    $longPath = "\\?\$absolute"
    Invoke-BestEffortCmd "rmdir /s /q \"$longPath\""
  }

  if (Test-Path -LiteralPath $target) {
    throw "Failed to remove $target. Re-run this script in elevated PowerShell (Run as Administrator)."
  }
}

Write-Host 'Node modules cleanup complete.'
