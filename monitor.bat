@echo off
REM AIBOS-UI Development Monitor Batch Script
REM Alternative to PowerShell script for Windows users

setlocal enabledelayedexpansion

if "%1"=="help" goto :help
if "%1"=="install" goto :install
if "%1"=="build" goto :build
if "%1"=="test" goto :test
if "%1"=="lint" goto :lint
if "%1"=="clean" goto :clean
if "%1"=="monitor" goto :monitor
if "%1"=="docs" goto :docs
if "%1"=="deploy" goto :deploy
if "%1"=="start" goto :start

:start
echo.
echo ========================================
echo 🚀 AIBOS-UI Complete Development Workflow
echo ========================================
echo.

echo ✅ Checking required tools...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    goto :error
)
echo ✅ Node.js is installed

pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pnpm is not installed or not in PATH
    goto :error
)
echo ✅ pnpm is installed

echo.
echo 📦 Installing dependencies...
call pnpm install
if errorlevel 1 goto :error

cd packages\ui
call pnpm install
if errorlevel 1 goto :error
cd ..\..

echo.
echo 🔨 Building project...
cd packages\ui
call pnpm run build
if errorlevel 1 goto :error
cd ..\..

echo.
echo 🧪 Running tests...
cd packages\ui
call pnpm run test
if errorlevel 1 goto :error
cd ..\..

echo.
echo 🔍 Running linting...
cd packages\ui
call pnpm run lint
if errorlevel 1 goto :error
cd ..\..

echo.
echo 🚀 Starting development server...
cd packages\ui
start /B pnpm run dev
cd ..\..

echo.
echo 📊 Starting monitoring dashboard...
cd monitor
start /B python -m http.server 3000
cd ..

echo.
echo 🌐 Opening monitoring dashboard...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ========================================
echo ✅ Development Environment Ready!
echo ========================================
echo 📊 Monitoring Dashboard: http://localhost:3000
echo 🔧 Development Server: Running in background
echo 📝 Press any key to stop all services
echo ========================================
pause >nul

echo.
echo 🛑 Stopping all services...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo ✅ All services stopped
goto :end

:install
echo 📦 Installing dependencies...
call pnpm install
cd packages\ui
call pnpm install
cd ..\..
echo ✅ Dependencies installed
goto :end

:build
echo 🔨 Building project...
cd packages\ui
call pnpm run build
cd ..\..
echo ✅ Project built
goto :end

:test
echo 🧪 Running tests...
cd packages\ui
call pnpm run test
cd ..\..
echo ✅ Tests completed
goto :end

:lint
echo 🔍 Running linting...
cd packages\ui
call pnpm run lint
cd ..\..
echo ✅ Linting completed
goto :end

:clean
echo 🧹 Cleaning build artifacts...
cd packages\ui
call pnpm run clean
cd ..\..
echo ✅ Build artifacts cleaned
goto :end

:monitor
echo 📊 Starting monitoring dashboard...
cd monitor
start /B python -m http.server 3000
cd ..
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo ✅ Monitoring dashboard started
echo 📝 Press any key to stop monitoring dashboard
pause >nul
taskkill /F /IM python.exe >nul 2>&1
echo ✅ Monitoring dashboard stopped
goto :end

:docs
echo 📚 Generating documentation...
cd packages\ui
call pnpm run docs:generate
cd ..\..
echo ✅ Documentation generated
goto :end

:deploy
echo 🚀 Preparing for deployment...
cd packages\ui
call pnpm run build
call pnpm run test
call pnpm run lint
call pnpm run docs:generate
cd ..\..
echo ✅ Ready for production deployment
goto :end

:help
echo.
echo ========================================
echo AIBOS-UI Development Monitor Help
echo ========================================
echo Usage: monitor.bat [COMMAND]
echo.
echo Commands:
echo   start     Start complete development workflow
echo   install   Install dependencies only
echo   build     Build project only
echo   test      Run tests only
echo   lint      Run linting only
echo   clean     Clean build artifacts only
echo   monitor   Start monitoring dashboard only
echo   docs      Generate documentation only
echo   deploy    Prepare for production deployment
echo   help      Show this help message
echo.
echo Examples:
echo   monitor.bat           # Start complete workflow
echo   monitor.bat build     # Build project only
echo   monitor.bat test      # Run tests only
echo   monitor.bat monitor   # Start dashboard only
echo.
echo ========================================
goto :end

:error
echo.
echo ❌ Operation failed!
echo Please check the error messages above.
goto :end

:end
endlocal
