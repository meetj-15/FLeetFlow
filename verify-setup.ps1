# FleetFlow Setup Verification Script
# Run this after cloning to verify your environment

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FleetFlow Setup Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = 0

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    if ($nodeVersion -match "v(\d+)") {
        $major = [int]$Matches[1]
        if ($major -ge 18) {
            Write-Host " ✓ $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host " ✗ $nodeVersion (Need v18+)" -ForegroundColor Red
            $errors++
        }
    }
} catch {
    Write-Host " ✗ Not installed" -ForegroundColor Red
    $errors++
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " ✓ v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ✗ Not installed" -ForegroundColor Red
    $errors++
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -NoNewline
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -eq "Running") {
            Write-Host " ✓ Service running" -ForegroundColor Green
        } else {
            Write-Host " ⚠ Service stopped (needs to be started)" -ForegroundColor Yellow
            $errors++
        }
    } else {
        Write-Host " ✗ Not installed" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host " ⚠ Cannot verify" -ForegroundColor Yellow
}

# Check .env files
Write-Host "Checking environment files..." -NoNewline
$envMissing = @()
if (!(Test-Path "server/.env")) { $envMissing += "server/.env" }
if (!(Test-Path "client/.env")) { $envMissing += "client/.env" }
if ($envMissing.Count -eq 0) {
    Write-Host " ✓ Found" -ForegroundColor Green
} else {
    Write-Host " ✗ Missing: $($envMissing -join ', ')" -ForegroundColor Red
    $errors++
}

# Check node_modules
Write-Host "Checking dependencies..." -NoNewline
$depsExist = (Test-Path "node_modules") -and (Test-Path "client/node_modules") -and (Test-Path "server/node_modules")
if ($depsExist) {
    Write-Host " ✓ Installed" -ForegroundColor Green
} else {
    Write-Host " ⚠ Run: npm run install:all" -ForegroundColor Yellow
    $errors++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "  ✓ Setup looks good!" -ForegroundColor Green
    Write-Host "  Run: npm run dev" -ForegroundColor Green
} else {
    Write-Host "  ✗ $errors issue(s) found" -ForegroundColor Red
    Write-Host "  See QUICKSTART.md for help" -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan
