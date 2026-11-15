@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Sanjay Physics App - GitHub and Vercel Deploy
cd /d "%~dp0"

set "DRY_RUN=0"
set "NO_PAUSE=0"
set "RESULT=0"
set "LIVE_URL=https://sanjay-physics-app.vercel.app"
set "GITHUB_REPOSITORY=sanjayphysics1104-jpg/Sanjay-Physics-App"
if /I "%~1"=="--dry-run" set "DRY_RUN=1"
if /I "%~1"=="--no-pause" set "NO_PAUSE=1"
if /I "%~2"=="--no-pause" set "NO_PAUSE=1"
goto :start

:finish
echo.
if "%NO_PAUSE%"=="0" pause
endlocal & exit /b %RESULT%

:start
echo.
echo ==================================================
echo   Sanjay Physics App - GitHub + Vercel Deployment
echo ==================================================
echo.

where git >nul 2>&1
if errorlevel 1 goto :git_missing
git lfs version >nul 2>&1
if errorlevel 1 goto :lfs_missing
where powershell.exe >nul 2>&1
if errorlevel 1 goto :powershell_missing

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto :not_repository

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH goto :branch_error
if /I not "%CURRENT_BRANCH%"=="main" goto :wrong_branch

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "ORIGIN_URL=%%R"
if not defined ORIGIN_URL goto :remote_error

git diff --quiet --diff-filter=U
if errorlevel 1 goto :conflict_error
git diff --cached --quiet --diff-filter=U
if errorlevel 1 goto :conflict_error

echo [1/8] Protecting local credentials and checking tools...
git check-ignore -q .env
if errorlevel 1 goto :env_not_ignored
git ls-files --error-unmatch .env >nul 2>&1
if not errorlevel 1 goto :protected_file_error
git diff --cached --quiet -- ":(glob).env*" ":(glob)**/.env*" ":(glob)*.pem" ":(glob)**/*.pem" ":(glob)*.key" ":(glob)**/*.key"
if errorlevel 1 goto :protected_file_error

git lfs install --local >nul
if errorlevel 1 goto :lfs_error
git lfs fsck
if errorlevel 1 goto :lfs_error

echo [2/8] Synchronizing with GitHub main...
git fetch origin main --prune
if errorlevel 1 goto :fetch_error
git merge-base --is-ancestor origin/main HEAD >nul 2>&1
if not errorlevel 1 goto :stage_changes
echo GitHub has newer commits. Rebasing local work safely...
git pull --rebase --autostash origin main
if errorlevel 1 goto :pull_error

:stage_changes
echo [3/8] Adding intended project files, PDFs and documents...
git add --ignore-removal -- .
if errorlevel 1 goto :stage_error

git diff --cached --quiet --diff-filter=D
if errorlevel 1 goto :deletion_error
git diff --cached --quiet -- ":(glob).env*" ":(glob)**/.env*" ":(glob)*.pem" ":(glob)**/*.pem" ":(glob)*.key" ":(glob)**/*.key"
if errorlevel 1 goto :protected_file_error

git grep --cached -I -n -E "AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,}|vercel_[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}" >nul 2>&1
if not errorlevel 1 goto :secret_content_error

git lfs fsck
if errorlevel 1 goto :lfs_error

if "%DRY_RUN%"=="1" goto :dry_run

git diff --cached --quiet
if not errorlevel 1 goto :check_existing_commits

echo [4/8] Creating deployment commit...
git commit -m "Auto-deploy Sanjay Physics App - %date% %time:~0,5%"
if errorlevel 1 goto :commit_error

:check_existing_commits
for /f "delims=" %%C in ('git rev-list --count origin/main..HEAD 2^>nul') do set "AHEAD_COUNT=%%C"
if not defined AHEAD_COUNT goto :history_error
if "%AHEAD_COUNT%"=="0" goto :already_current

echo [5/8] Uploading Git LFS objects...
git lfs push origin main
if errorlevel 1 goto :lfs_push_error

echo [6/8] Pushing main to GitHub...
git push origin main
if errorlevel 1 goto :push_error

for /f "delims=" %%H in ('git rev-parse HEAD 2^>nul') do set "DEPLOY_SHA=%%H"
if not defined DEPLOY_SHA goto :history_error
for /f "tokens=1" %%H in ('git ls-remote origin refs/heads/main 2^>nul') do set "REMOTE_SHA=%%H"
if not "%REMOTE_SHA%"=="%DEPLOY_SHA%" goto :remote_verify_error
echo GitHub verified at commit %DEPLOY_SHA%.

echo [7/8] Waiting for Vercel deployment of this exact commit...
set "VERCEL_ATTEMPT=0"
:wait_for_vercel
set /a VERCEL_ATTEMPT+=1
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $s=Invoke-RestMethod -Headers @{'User-Agent'='Sanjay-Physics-Push'} -Uri 'https://api.github.com/repos/%GITHUB_REPOSITORY%/commits/%DEPLOY_SHA%/status'; $v=@($s.statuses | Where-Object {$_.context -eq 'Vercel'})[0]; if($null -eq $v){exit 1}; if($v.state -eq 'success'){exit 0}; if($v.state -in @('error','failure')){exit 2}; exit 1" >nul 2>&1
if errorlevel 2 goto :vercel_failed
if not errorlevel 1 goto :verify_live
if "%VERCEL_ATTEMPT%"=="90" goto :vercel_timeout
echo Vercel is still building... attempt %VERCEL_ATTEMPT% of 90
timeout /t 10 /nobreak >nul
goto :wait_for_vercel

:verify_live
echo [8/8] Verifying the live production app...
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $health=Invoke-RestMethod -Uri '%LIVE_URL%/api/health?commit=%DEPLOY_SHA%' -Headers @{'Cache-Control'='no-cache'}; if(-not $health.ok){exit 1}; $page=Invoke-WebRequest -UseBasicParsing -Uri '%LIVE_URL%/?commit=%DEPLOY_SHA%' -Headers @{'Cache-Control'='no-cache'}; if($page.StatusCode -ne 200 -or $page.Content -notmatch 'Sanjay Singh Physics'){exit 1}" >nul 2>&1
if errorlevel 1 goto :live_verify_error

echo.
echo SUCCESS: GitHub and Vercel production are live.
echo GitHub commit: %DEPLOY_SHA%
echo Live app: %LIVE_URL%
goto :finish

:already_current
for /f "delims=" %%H in ('git rev-parse HEAD 2^>nul') do set "DEPLOY_SHA=%%H"
echo No new files needed a commit. GitHub is already current.
goto :verify_live

:dry_run
echo.
echo DRY RUN PASSED.
git diff --cached --quiet
if errorlevel 1 echo Intended files are ready to commit and deploy.
if not errorlevel 1 echo No new files need to be committed.
echo .env and credential files remain local and ignored.
echo No commit, push or deployment was performed.
goto :finish

:git_missing
echo ERROR: Git is not installed or is not available in PATH.
goto :failed
:lfs_missing
echo ERROR: Git LFS is not installed or is not available in PATH.
goto :failed
:powershell_missing
echo ERROR: Windows PowerShell is required for deployment verification.
goto :failed
:not_repository
echo ERROR: This folder is not a Git repository.
goto :failed
:branch_error
echo ERROR: The current Git branch could not be detected.
goto :failed
:wrong_branch
echo ERROR: Automatic deployment is allowed only from the main branch.
goto :failed
:remote_error
echo ERROR: The configured GitHub origin remote is unavailable.
goto :failed
:conflict_error
echo ERROR: Unresolved Git conflicts were detected. Nothing was changed.
goto :failed
:env_not_ignored
echo ERROR: .env is not ignored. Deployment stopped to protect credentials.
goto :failed
:protected_file_error
echo ERROR: A protected environment, key or certificate file is tracked or staged.
goto :failed
:secret_content_error
echo ERROR: A likely API key or access token was found in staged content.
echo Remove the secret from the project file; the local .env remains untouched.
goto :failed
:lfs_error
echo ERROR: Git LFS configuration or local LFS objects failed validation.
goto :failed
:fetch_error
echo ERROR: GitHub could not be reached or authenticated.
goto :failed
:pull_error
echo ERROR: GitHub changes could not be rebased automatically.
echo Local work and credentials were preserved. Resolve the conflict, then double-click again.
goto :failed
:stage_error
echo ERROR: Project files could not be prepared for commit.
goto :failed
:deletion_error
echo ERROR: A staged deletion was detected. Deployment stopped without deleting data.
goto :failed
:commit_error
echo ERROR: The deployment commit could not be created.
goto :failed
:history_error
echo ERROR: Local and GitHub commit history could not be read.
goto :failed
:lfs_push_error
echo ERROR: Git LFS upload failed. The GitHub branch was not pushed.
goto :failed
:push_error
echo ERROR: GitHub push failed. No force-push was attempted.
echo The local commit is preserved; double-click again after authentication is restored.
goto :failed
:remote_verify_error
echo ERROR: GitHub did not report the same commit after push.
goto :failed
:vercel_failed
echo ERROR: Vercel reported a failed deployment for commit %DEPLOY_SHA%.
goto :failed
:vercel_timeout
echo ERROR: Vercel did not finish within 15 minutes.
echo GitHub push succeeded at %DEPLOY_SHA%, but production was not verified.
goto :failed
:live_verify_error
echo ERROR: Vercel reported success, but the production app health check failed.
goto :failed

:failed
set "RESULT=1"
echo.
echo Deployment stopped safely. No local credentials or data were deleted.
goto :finish
