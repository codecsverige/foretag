#!/usr/bin/env pwsh
Write-Host "PUBLICATION GITHUB - VAGVANNER" -ForegroundColor Cyan
Set-Location "c:\Users\riadh\Desktop\Nouveau dossier\react\maw9a3 småknung\samakning-nouveau"

git init
git remote remove origin 2>$null
git remote add origin https://github.com/codecsverige/vagvanner.git
git add .
git commit -m "feat: update app with SEO improvements and UI fixes"
git branch -M main
git push -u origin main --force

Write-Host "✅ PUBLIÉ SUR GITHUB!" -ForegroundColor Green
