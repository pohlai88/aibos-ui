@echo off
REM AIBOS Utils Package Lock Setup Script
REM Sets up the lock protection system

echo 🔒 AIBOS Utils Package Lock Setup
echo =================================

REM Create scripts directory if it doesn't exist
if not exist "scripts" mkdir scripts

REM Initialize lock file with current file hashes
echo Initializing lock file with current file hashes...
node scripts/lock-guard.js update-hashes

REM Test the lock system
echo Testing lock system...
node scripts/lock-guard.js check

echo.
echo ✅ Lock system setup completed!
echo.
echo Available commands:
echo   pnpm run lock:status     - Check lock status
echo   pnpm run lock:check      - Verify package integrity
echo   pnpm run lock:update-hashes - Update lock file hashes
echo.
echo ⚠️  Package is now LOCKED and protected from unauthorized changes.
echo    See .approval-workflow.md for the approval process.
echo.
pause
