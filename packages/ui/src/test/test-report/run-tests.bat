@echo off
REM AI-BOS ERP UI Test Suite Runner - Hardened
SETLOCAL EnableExtensions EnableDelayedExpansion

echo.
echo ========================================
echo   AI-BOS ERP UI Test Suite Runner
echo ========================================
echo.

REM -------- Args --------
set MODE=
set WATCH=
set COVERAGE=
set UI=
set FILTER=
set WORKSPACE=
set NOPAUSE_FLAG=

for %%A in (%*) do (
  echo %%~A | findstr /I /B /C:"/unit" >nul  && set MODE=unit
  echo %%~A | findstr /I /B /C:"/e2e"  >nul  && set MODE=e2e
  echo %%~A | findstr /I /B /C:"/watch" >nul && set WATCH=1
  echo %%~A | findstr /I /B /C:"/coverage" >nul && set COVERAGE=1
  echo %%~A | findstr /I /B /C:"/ui" >nul && set UI=1
  echo %%~A | findstr /I /B /C:"/nopause" >nul && set NOPAUSE_FLAG=1

  REM /filter:"text"
  echo %%~A | findstr /I /B /C:"/filter:" >nul && (
    set "FILTER=%%~A"
    set "FILTER=!FILTER:/filter:=!"
    set "FILTER=!FILTER:"=!"
  )

  REM /workspace:"path"
  echo %%~A | findstr /I /B /C:"/workspace:" >nul && (
    set "WORKSPACE=%%~A"
    set "WORKSPACE=!WORKSPACE:/workspace:=!"
    set "WORKSPACE=!WORKSPACE:"=!"
  )
)

REM CI disables pause automatically
if /I "%CI%"=="true" set NOPAUSE_FLAG=1

REM -------- Locate workspace --------
if defined WORKSPACE (
  if exist "%WORKSPACE%\package.json" (
    pushd "%WORKSPACE%" >nul
  ) else (
    echo Error: workspace "%WORKSPACE%" does not contain package.json
    exit /b 1
  )
)

REM -------- Sanity checks --------
if not exist "package.json" (
  echo Error: package.json not found. Run from the UI package directory or pass /workspace:"path".
  goto :maybePauseFail
)

where node >nul 2>&1
if errorlevel 1 (
  echo Error: Node.js is not installed or not in PATH.
  goto :maybePauseFail
)

pnpm --version >nul 2>&1
if errorlevel 1 (
  echo Error: pnpm is not installed or not in PATH
  echo        Install with: npm i -g pnpm
  goto :maybePauseFail
)

REM -------- Build command --------
set "CMD=pnpm"
set "ARGS="

REM Map modes to your scripts; adjust if your package.json uses different names
if "%MODE%"=="unit" (
  set "CMD=pnpm"
  set "ARGS=test"
) else if "%MODE%"=="e2e" (
  set "CMD=pnpm"
  set "ARGS=test:playwright"
) else (
  REM default combined suite
  set "CMD=pnpm"
  set "ARGS=test"
)

if defined WATCH (
  set "ARGS=%ARGS% --watch"
)

if defined COVERAGE (
  set "ARGS=%ARGS% --coverage"
)

if defined UI (
  REM Use Vitest UI directly
  set "CMD=pnpm"
  set "ARGS=vitest --ui"
)

if defined FILTER (
  set "ARGS=%ARGS% -- %FILTER%"
)

REM Pass any extra args through (those not parsed above)
REM (Crude approach: append original %*; Vitest/Playwright ignore unknowns gracefully)
set "ARGS=%ARGS% %*"

echo Running tests...
echo.
echo %CMD% %ARGS%
call %CMD% %ARGS%
set TEST_EXIT=%ERRORLEVEL%

if %TEST_EXIT% GEQ 1 (
  echo.
  echo Tests completed with failures. Exit code: %TEST_EXIT%
) else (
  echo.
  echo All tests passed!
)

echo.
echo Attempting to open a test dashboard/report...

REM -------- Find a report to open (first found wins) --------
set "CANDIDATES="
REM Custom dashboard
set "CANDIDATES=%CANDIDATES% src\test\test-report\dashboard.html"
set "CANDIDATES=%CANDIDATES% src\test\test-report\index.html"
REM Vitest UI snapshot export (if you persist it)
set "CANDIDATES=%CANDIDATES% .vitest\index.html"
REM Playwright report
set "CANDIDATES=%CANDIDATES% playwright-report\index.html"
REM Coverage (c8/istanbul)
set "CANDIDATES=%CANDIDATES% coverage\index.html"
set "CANDIDATES=%CANDIDATES% coverage\lcov-report\index.html"

set "OPENED="
for %%F in (%CANDIDATES%) do (
  if not defined OPENED (
    if exist "%%F" (
      echo Opening: %%F
      start "" "%%F"
      set "OPENED=1"
    )
  )
)

if not defined OPENED (
  echo No known dashboard/report found. Skipped opening.
)

goto :end

:maybePauseFail
if not defined NOPAUSE_FLAG (
  echo.
  pause
)
exit /b 1

:end
if defined WORKSPACE popd >nul
if not defined NOPAUSE_FLAG (
  echo.
  pause
)
exit /b %TEST_EXIT%