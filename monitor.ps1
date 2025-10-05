# AIBOS-UI Development Monitor - Simple & Clean
param(
    [string]$Action = "start",
    [int]$Port = 3000,
    [switch]$Help
)

# Simple color output
function Write-Success { Write-Host "SUCCESS: $args" -ForegroundColor Green }
function Write-Error { Write-Host "ERROR: $args" -ForegroundColor Red }
function Write-Info { Write-Host "INFO: $args" -ForegroundColor Cyan }

# Show help
function Show-Help {
    Write-Host ""
    Write-Host "AIBOS-UI Development Monitor" -ForegroundColor Magenta
    Write-Host "=============================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Usage: .\monitor.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Action <string>    Action: start, build, test, monitor" -ForegroundColor White
    Write-Host "  -Port <int>         Port for dashboard (default: 3000)" -ForegroundColor White
    Write-Host "  -Help               Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\monitor.ps1                    # Complete workflow" -ForegroundColor White
    Write-Host "  .\monitor.ps1 -Action build      # Build only" -ForegroundColor White
    Write-Host "  .\monitor.ps1 -Action monitor    # Dashboard only" -ForegroundColor White
    Write-Host ""
}

# Check tools
function Test-Tools {
    Write-Info "Checking required tools..."
    
    $tools = @("node", "pnpm", "git")
    foreach ($tool in $tools) {
        try {
            $version = & $tool --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$tool is installed"
            } else {
                Write-Error "$tool is not installed"
                return $false
            }
        } catch {
            Write-Error "$tool is not installed"
            return $false
        }
    }
    return $true
}

# Install dependencies
function Install-Deps {
    Write-Info "Installing dependencies..."
    try {
        pnpm install
        if ($LASTEXITCODE -ne 0) { throw "Root install failed" }
        
        Set-Location "packages/ui"
        pnpm install
        if ($LASTEXITCODE -ne 0) { throw "UI install failed" }
        
        Set-Location "../.."
        Write-Success "Dependencies installed"
    } catch {
        Write-Error "Install failed: $_"
        exit 1
    }
}

# Build project
function Build-Project {
    Write-Info "Building project..."
    try {
        Set-Location "packages/ui"
        pnpm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
        
        Set-Location "../.."
        Write-Success "Project built"
    } catch {
        Write-Error "Build failed: $_"
        exit 1
    }
}

# Run tests
function Test-Project {
    Write-Info "Running tests..."
    try {
        Set-Location "packages/ui"
        pnpm run test
        if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
        
        Set-Location "../.."
        Write-Success "Tests passed"
    } catch {
        Write-Error "Tests failed: $_"
        exit 1
    }
}

# Start monitoring dashboard
function Start-Monitor {
    Write-Info "Starting monitoring dashboard..."
    try {
        $monitorPath = Join-Path $PSScriptRoot "monitor"
        $indexPath = Join-Path $monitorPath "index.html"
        
        if (-not (Test-Path $indexPath)) {
            Write-Error "Dashboard not found at: $indexPath"
            exit 1
        }
        
        # Start Python HTTP server
        $serverJob = Start-Job -ScriptBlock {
            param($Path, $Port)
            Set-Location $Path
            python -m http.server $Port
        } -ArgumentList $monitorPath, $Port
        
        Start-Sleep -Seconds 2
        
        # Open browser
        $url = "http://localhost:$Port"
        Start-Process $url
        Write-Success "Dashboard started at $url"
        
        Write-Info "Press Ctrl+C to stop dashboard"
        try {
            while ($true) { Start-Sleep -Seconds 1 }
        } finally {
            Stop-Job $serverJob
            Remove-Job $serverJob
            Write-Success "Dashboard stopped"
        }
    } catch {
        Write-Error "Dashboard failed: $_"
        exit 1
    }
}

# Complete workflow
function Start-Complete {
    Write-Host ""
    Write-Host "AIBOS-UI Development Monitor" -ForegroundColor Magenta
    Write-Host "===========================" -ForegroundColor Magenta
    Write-Host ""
    
    if (-not (Test-Tools)) {
        Write-Error "Required tools missing"
        exit 1
    }
    
    Install-Deps
    Build-Project
    Test-Project
    
    Write-Info "Starting development server..."
    Set-Location "packages/ui"
    $devJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        pnpm run dev
    }
    Set-Location "../.."
    
    Start-Monitor
    
    # Cleanup
    if ($devJob) {
        Stop-Job $devJob
        Remove-Job $devJob
    }
}

# Main script
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $scriptDir
    
    switch ($Action.ToLower()) {
        "start" { Start-Complete }
        "build" { Build-Project }
        "test" { Test-Project }
        "monitor" { Start-Monitor }
        default {
            Write-Error "Unknown action: $Action"
            Show-Help
            exit 1
        }
    }
} catch {
    Write-Error "Script failed: $_"
    exit 1
}