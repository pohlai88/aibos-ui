# Test Browser Opening Script
# This script tests if the browser opening functionality works

param(
    [string]$Url = "http://localhost:3001"
)

Write-Host "🧪 Testing browser opening functionality..." -ForegroundColor Blue
Write-Host "URL: $Url" -ForegroundColor White

# Method 1: PowerShell Start-Process
Write-Host "Method 1: PowerShell Start-Process" -ForegroundColor Yellow
try {
    Start-Process $Url
    Write-Host "✅ Method 1: SUCCESS - Browser should have opened!" -ForegroundColor Green
} catch {
    Write-Host "❌ Method 1: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: CMD start command
Write-Host "Method 2: CMD start command" -ForegroundColor Yellow
try {
    Start-Process -FilePath "cmd" -ArgumentList "/c", "start", $Url -WindowStyle Hidden
    Write-Host "✅ Method 2: SUCCESS - Browser should have opened!" -ForegroundColor Green
} catch {
    Write-Host "❌ Method 2: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: Direct browser executable
Write-Host "Method 3: Direct browser executable" -ForegroundColor Yellow
try {
    # Try common browser paths
    $browsers = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles}\Mozilla Firefox\firefox.exe",
        "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
    )
    
    $browserFound = $false
    foreach ($browser in $browsers) {
        if (Test-Path $browser) {
            Start-Process -FilePath $browser -ArgumentList $Url
            Write-Host "✅ Method 3: SUCCESS - Opened with $browser" -ForegroundColor Green
            $browserFound = $true
            break
        }
    }
    
    if (-not $browserFound) {
        Write-Host "❌ Method 3: FAILED - No browser executable found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Method 3: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Test completed! Check if your browser opened with the dashboard." -ForegroundColor Blue
Write-Host "If no browser opened, please manually navigate to: $Url" -ForegroundColor Yellow
