# PowerShell Script for Running Tests with Dashboard
# AI-BOS ERP UI Test Suite Runner

param(
    [switch]$Watch,
    [switch]$Coverage,
    [string]$Filter = "",
    [switch]$Help
)

if ($Help) {
    Write-Host "AI-BOS ERP UI Test Suite Runner" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\run-tests-with-dashboard.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Watch      Run tests in watch mode" -ForegroundColor White
    Write-Host "  -Coverage   Run tests with coverage report" -ForegroundColor White
    Write-Host "  -Filter     Filter tests by pattern" -ForegroundColor White
    Write-Host "  -Help       Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\run-tests-with-dashboard.ps1" -ForegroundColor White
    Write-Host "  .\run-tests-with-dashboard.ps1 -Watch" -ForegroundColor White
    Write-Host "  .\run-tests-with-dashboard.ps1 -Coverage" -ForegroundColor White
    Write-Host "  .\run-tests-with-dashboard.ps1 -Filter 'tokens'" -ForegroundColor White
    exit 0
}

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Header
    Write-Host " $Title" -ForegroundColor $Colors.Header
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Header
    Write-Host ""
}

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "❌ Error: package.json not found. Please run this script from the UI package directory." $Colors.Error
        exit 1
    }
    
    # Check if pnpm is available
    try {
        $pnpmVersion = pnpm --version
        Write-ColorOutput "✅ pnpm version: $pnpmVersion" $Colors.Success
    } catch {
        Write-ColorOutput "❌ Error: pnpm is not installed or not in PATH" $Colors.Error
        Write-ColorOutput "Please install pnpm: npm install -g pnpm" $Colors.Info
        exit 1
    }
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js version: $nodeVersion" $Colors.Success
    } catch {
        Write-ColorOutput "❌ Error: Node.js is not installed or not in PATH" $Colors.Error
        exit 1
    }
}

function Invoke-TestExecution {
    param(
        [bool]$WatchMode,
        [bool]$CoverageMode,
        [string]$TestFilter
    )
    
    Write-Header "Executing Tests"
    
    # Build the test command
    $testCommand = "pnpm test"
    
    if ($WatchMode) {
        $testCommand = "pnpm test:watch"
        Write-ColorOutput "🔄 Running tests in watch mode..." $Colors.Info
    } elseif ($CoverageMode) {
        $testCommand = "pnpm test:coverage"
        Write-ColorOutput "📊 Running tests with coverage..." $Colors.Info
    } else {
        Write-ColorOutput "🧪 Running test suite..." $Colors.Info
    }
    
    if ($TestFilter) {
        $testCommand += " -- $TestFilter"
        Write-ColorOutput "🔍 Filtering tests: $TestFilter" $Colors.Info
    }
    
    Write-ColorOutput "Command: $testCommand" $Colors.Info
    Write-Host ""
    
    # Execute the test command
    try {
        $startTime = Get-Date
        Invoke-Expression $testCommand
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-ColorOutput "✅ Tests completed successfully in $([math]::Round($duration, 2)) seconds" $Colors.Success
        
    } catch {
        Write-ColorOutput "❌ Test execution failed: $($_.Exception.Message)" $Colors.Error
        Write-ColorOutput "Check the output above for details." $Colors.Warning
        exit 1
    }
}

function Open-Dashboard {
    Write-Header "Opening Test Dashboard"
    
    $dashboardPath = Join-Path $PSScriptRoot "dashboard.html"
    
    if (-not (Test-Path $dashboardPath)) {
        Write-ColorOutput "❌ Dashboard not found at: $dashboardPath" $Colors.Error
        return
    }
    
    $dashboardUrl = "file:///$($dashboardPath.Replace('\', '/'))"
    
    Write-ColorOutput "📊 Opening dashboard..." $Colors.Info
    Write-ColorOutput "Dashboard URL: $dashboardUrl" $Colors.Info
    
    try {
        Start-Process $dashboardUrl
        Write-ColorOutput "✅ Dashboard opened successfully!" $Colors.Success
    } catch {
        Write-ColorOutput "❌ Failed to open dashboard automatically" $Colors.Error
        Write-ColorOutput "Please manually open: $dashboardUrl" $Colors.Warning
    }
}

function Show-Summary {
    Write-Header "Test Execution Summary"
    
    Write-ColorOutput "🎯 Test execution completed!" $Colors.Success
    Write-ColorOutput "📊 Dashboard is now available with detailed results" $Colors.Info
    Write-ColorOutput "🔄 You can refresh the dashboard to see updated results" $Colors.Info
    
    if ($Watch) {
        Write-ColorOutput "👀 Watch mode is active - tests will re-run on file changes" $Colors.Info
    }
    
    Write-Host ""
    Write-ColorOutput "Next steps:" $Colors.Header
    Write-ColorOutput "• Review the dashboard for detailed test analysis" $Colors.White
    Write-ColorOutput "• Check failure details and fix any issues" $Colors.White
    Write-ColorOutput "• Run specific tests with filters if needed" $Colors.White
    Write-Host ""
}

# Main execution
try {
    Write-ColorOutput "🧪 AI-BOS ERP UI Test Suite Runner" $Colors.Header
    Write-ColorOutput "====================================" $Colors.Header
    
    Test-Prerequisites
    Invoke-TestExecution -WatchMode $Watch -CoverageMode $Coverage -TestFilter $Filter
    
    if (-not $Watch) {
        Open-Dashboard
    }
    
    Show-Summary
    
} catch {
    Write-ColorOutput "❌ Script execution failed: $($_.Exception.Message)" $Colors.Error
    exit 1
}
