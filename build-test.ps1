#!/usr/bin/env powershell
$ErrorActionPreference = 'Stop'

Write-Host "=== VägVänner Build Test ===" -ForegroundColor Cyan
Set-Location "C:\Users\riadh\Desktop\Nouveau dossier\react\maw9a3 småknung\samakning-nouveau"

Write-Host "Working directory:" (Get-Location)
Write-Host "Node version:" (node -v)
Write-Host "npm version:" (npm -v)

$env:CI = "false"
$env:DISABLE_ESLINT_PLUGIN = "true"

Write-Host "`nRunning build..." -ForegroundColor Yellow
npx --yes react-scripts@5.0.1 build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild SUCCESS" -ForegroundColor Green
    
    # Run postbuild scripts if present
    if (Test-Path "scripts\generate-ride-pages.cjs") {
        Write-Host "Running generate-ride-pages.cjs..." -ForegroundColor Yellow
        node scripts\generate-ride-pages.cjs
    }
    
    if (Test-Path "scripts\generate-sitemap.cjs") {
        Write-Host "Running generate-sitemap.cjs..." -ForegroundColor Yellow
        node scripts\generate-sitemap.cjs
    }
    
    Write-Host "Full build complete!" -ForegroundColor Green
} else {
    Write-Host "`nBuild FAILED with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
