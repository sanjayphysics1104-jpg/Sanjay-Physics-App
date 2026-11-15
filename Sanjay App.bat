@echo off
setlocal EnableExtensions
title Sanjay Physics App - Local Admin
cd /d "%~dp0"

set "NODE_EXE="
for /f "delims=" %%N in ('where.exe node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not defined NODE_EXE (
  echo ERROR: Node.js runtime could not be found.
  echo Checked Windows and Codex bundled runtime locations.
  pause
  exit /b 1
)

set "SSP_NODE_EXE=%NODE_EXE%"
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ready=$false; try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4176/api/health' -TimeoutSec 2; $ready=$r.StatusCode -eq 200 } catch {}; if(-not $ready){ $env:SSP_LOCAL_PORT='4176'; Start-Process -FilePath $env:SSP_NODE_EXE -ArgumentList 'tests/ui-test-server.js' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden; 1..20 | ForEach-Object { if(-not $ready){ Start-Sleep -Milliseconds 250; try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4176/api/health' -TimeoutSec 1; $ready=$r.StatusCode -eq 200 } catch {} } } }; if(-not $ready){exit 1}"
if errorlevel 1 (
  echo ERROR: The local Admin server could not be started.
  echo Node runtime: %NODE_EXE%
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
