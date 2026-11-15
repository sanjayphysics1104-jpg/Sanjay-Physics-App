@echo off
setlocal EnableExtensions
title Sanjay Physics App - Local Admin
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is required to open the local Admin app.
  pause
  exit /b 1
)

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4176/api/health' -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0} } catch {}; $env:SSP_LOCAL_PORT='4176'; Start-Process -FilePath 'node.exe' -ArgumentList 'tests/ui-test-server.js' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden"
if errorlevel 1 (
  echo ERROR: The local Admin server could not be started.
  pause
  exit /b 1
)

powershell.exe -NoProfile -NonInteractive -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:4176/'"
if errorlevel 1 (
  echo Open http://127.0.0.1:4176/ in your browser.
  pause
  exit /b 1
)

echo Sanjay Physics App opened. Admin PDF uploads will be saved in the project.
endlocal
