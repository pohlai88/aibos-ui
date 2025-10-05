# AIBOS-UI Development Dashboard Launcher
# PowerShell script to start the development dashboard with all dependencies

param(
    [string]$Port = "3001",
    [switch]$Install,
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
    Gray = "Gray"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Show-Help {
    Write-ColorOutput "AIBOS-UI Development Dashboard Launcher" "Blue"
    Write-ColorOutput "=======================================" "Blue"
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\dashboard.ps1 [options]" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Options:" "Yellow"
    Write-ColorOutput "  -Port <number>    Port to run dashboard on (default: 3001)" "White"
    Write-ColorOutput "  -Install          Install required dependencies" "White"
    Write-ColorOutput "  -Help             Show this help message" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" "Yellow"
    Write-ColorOutput "  .\dashboard.ps1                    # Start dashboard on port 3001" "White"
    Write-ColorOutput "  .\dashboard.ps1 -Port 3002          # Start dashboard on port 3002" "White"
    Write-ColorOutput "  .\dashboard.ps1 -Install            # Install dependencies first" "White"
    Write-ColorOutput ""
    Write-ColorOutput "Features:" "Yellow"
    Write-ColorOutput "  • Real-time milestone tracking" "White"
    Write-ColorOutput "  • Mermaid diagrams for architecture" "White"
    Write-ColorOutput "  • Error monitoring and analysis" "White"
    Write-ColorOutput "  • Component status overview" "White"
    Write-ColorOutput "  • Next steps recommendations" "White"
    Write-ColorOutput ""
}

if ($Help) {
    Show-Help
    exit 0
}

# Check if we're in the right directory
$DashboardPath = Join-Path $PSScriptRoot "dashboard"
if (-not (Test-Path $DashboardPath)) {
    Write-ColorOutput "❌ Dashboard directory not found!" "Red"
    Write-ColorOutput "Please run this script from the packages/ui directory" "Yellow"
    exit 1
}

Write-ColorOutput "🚀 AIBOS-UI Development Dashboard Launcher" "Blue"
Write-ColorOutput "=========================================" "Blue"
Write-ColorOutput ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-ColorOutput "✅ Node.js detected: $nodeVersion" "Green"
} catch {
    Write-ColorOutput "❌ Node.js is not installed or not in PATH" "Red"
    Write-ColorOutput "Please install Node.js from https://nodejs.org/" "Yellow"
    exit 1
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm not found"
    }
    Write-ColorOutput "✅ pnpm detected: $pnpmVersion" "Green"
} catch {
    Write-ColorOutput "❌ pnpm is not installed or not in PATH" "Red"
    Write-ColorOutput "Installing pnpm..." "Yellow"
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Failed to install pnpm" "Red"
        exit 1
    }
    Write-ColorOutput "✅ pnpm installed successfully" "Green"
}

# Install dependencies if requested or if missing
$NodeModulesPath = Join-Path $DashboardPath "node_modules"
$PackageJsonPath = Join-Path $DashboardPath "package.json"

if ($Install -or (-not (Test-Path $NodeModulesPath))) {
    Write-ColorOutput "📦 Installing dashboard dependencies..." "Blue"
    
    # Ensure package.json exists
    if (-not (Test-Path $PackageJsonPath)) {
        Write-ColorOutput "❌ package.json not found in dashboard directory" "Red"
        Write-ColorOutput "Creating basic package.json..." "Yellow"
        
        $packageJson = @{
            name = "aibos-ui-dashboard"
            version = "1.0.0"
            description = "Development dashboard for AIBOS-UI"
            type = "module"
            scripts = @{
                start = "node server.mjs"
                dev = "node server.mjs"
            }
            dependencies = @{
                express = "^4.21.2"
            }
            engines = @{
                node = ">=16.0.0"
            }
        } | ConvertTo-Json -Depth 3
        
        $packageJson | Out-File -FilePath $PackageJsonPath -Encoding UTF8
        Write-ColorOutput "✅ Created package.json" "Green"
    }
    
    # Install dependencies
    Set-Location $DashboardPath
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        Write-ColorOutput "✅ Dependencies installed successfully" "Green"
    } catch {
        Write-ColorOutput "❌ Failed to install dependencies: $($_.Exception.Message)" "Red"
        Set-Location $PSScriptRoot
        exit 1
    } finally {
        Set-Location $PSScriptRoot
    }
}
}

# Check if dashboard files exist
$RequiredFiles = @(
    "index.html",
    "dashboard.js",
    "monitor.mjs",
    "server.mjs"
)

$MissingFiles = @()
foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $DashboardPath $file
    if (-not (Test-Path $filePath)) {
        $MissingFiles += $file
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-ColorOutput "❌ Missing dashboard files:" "Red"
    foreach ($file in $MissingFiles) {
        Write-ColorOutput "   • $file" "Red"
    }
    Write-ColorOutput "Please ensure all dashboard files are present" "Yellow"
    exit 1
}

Write-ColorOutput "✅ All dashboard files found" "Green"

# Check if port is available
try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
    $listener.Stop()
    Write-ColorOutput "✅ Port $Port is available" "Green"
} catch {
    Write-ColorOutput "❌ Port $Port is already in use" "Red"
    Write-ColorOutput "Please choose a different port or stop the service using port $Port" "Yellow"
    exit 1
}

# Start the dashboard
Write-ColorOutput ""
Write-ColorOutput "🎯 Starting Development Dashboard..." "Blue"
Write-ColorOutput "Port: $Port" "White"
Write-ColorOutput "URL: http://localhost:$Port" "White"
Write-ColorOutput ""
Write-ColorOutput "🌐 Browser will open automatically..." "Green"
Write-ColorOutput "Press Ctrl+C to stop the dashboard" "Yellow"
Write-ColorOutput ""

# Set environment variable for port
$env:PORT = $Port

# Start the server
Set-Location $DashboardPath

# Start server in background
$serverJob = Start-Job -ScriptBlock {
    param($path, $port)
    Set-Location $path
    $env:PORT = $port
    node server.mjs
} -ArgumentList $DashboardPath, $Port

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Check if server started successfully
$jobState = Get-Job $serverJob
if ($jobState.State -eq "Failed") {
    Write-ColorOutput "❌ Server job failed to start" "Red"
    $errorOutput = Receive-Job $serverJob
    Write-ColorOutput "Error details: $errorOutput" "Red"
    Set-Location $PSScriptRoot
    Remove-Job $serverJob -Force
    exit 1
}

# Try to open browser
Write-ColorOutput "🌐 Opening dashboard in browser..." "Green"
try {
    Start-Process "http://localhost:$Port"
    Write-ColorOutput "✅ Dashboard opened in browser!" "Green"
} catch {
    Write-ColorOutput "⚠️  Could not auto-open browser. Please manually open: http://localhost:$Port" "Yellow"
}

# Show server output
Write-ColorOutput "📊 Dashboard is running. Press Ctrl+C to stop." "Blue"
Write-ColorOutput "Server logs:" "Gray"
Write-ColorOutput "===========" "Gray"

# Monitor server output
while ($serverJob.State -eq "Running") {
    $output = Receive-Job $serverJob -ErrorAction SilentlyContinue
    if ($output) {
        Write-Host $output
    }
    Start-Sleep -Milliseconds 500
}

# Get final output
$finalOutput = Receive-Job $serverJob
if ($finalOutput) {
    Write-Host $finalOutput
}

# Cleanup
Set-Location $PSScriptRoot
if ($serverJob) {
    Remove-Job $serverJob -Force
}

