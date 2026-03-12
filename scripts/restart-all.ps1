param(
  [int[]]$Ports = @(3000, 3001, 5000),
  [switch]$SkipKill
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[restart-all] $Message" -ForegroundColor Cyan
}

function Start-ManagedProcess {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Step "Starting $Name"
  Start-Process powershell -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    "Set-Location '$PSScriptRoot\\..'; $Command"
  ) | Out-Null
}

Write-Step "Working directory: $($PSScriptRoot)"

if (-not $SkipKill) {
  Write-Step "Stopping listeners on ports: $($Ports -join ', ')"
  & "$PSScriptRoot\kill-ports.ps1" -Ports $Ports
}

Start-ManagedProcess -Name 'backend' -Command 'npm run dev:backend'
Start-Sleep -Milliseconds 800

Start-ManagedProcess -Name 'storefront frontend' -Command 'npm run dev:frontend'
Start-Sleep -Milliseconds 800

Start-ManagedProcess -Name 'admin frontend' -Command 'npm run dev:admin:frontend'
Start-Sleep -Milliseconds 800

Write-Step 'Done. Services should be launching in new PowerShell windows.'
Write-Step 'Expected URLs: http://localhost:3000 (storefront), http://localhost:3001 (admin), http://localhost:5000 (API)'
