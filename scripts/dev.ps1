$ErrorActionPreference = "Stop"

$root = (Get-Item $PSScriptRoot).Parent.FullName
$serverDir = Join-Path $root "server"
$uiDir = Join-Path $root "ui"

Write-Host "Starting Momono dev (server + ui)..."

Start-Process python -ArgumentList "-m", "uvicorn", "main:app", "--reload" -WorkingDirectory $serverDir
Start-Process npm -ArgumentList "run", "dev" -WorkingDirectory $uiDir

Write-Host ""
Write-Host "Server (API) : http://127.0.0.1:8000"
Write-Host "UI (Vite)   : http://localhost:5173"
Write-Host "Tutup window masing-masing untuk menghentikan."
