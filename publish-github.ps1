# Script de publication GitHub
$projectPath = "c:\Users\riadh\Desktop\Nouveau dossier\react\maw9a3 småknung\samakning-nouveau"
$repoUrl = "https://github.com/codecsverige/vagvanner.git"

Write-Host "🚀 Publication sur GitHub en cours..." -ForegroundColor Cyan
Write-Host "Projet: $projectPath" -ForegroundColor Yellow
Write-Host "Repository: $repoUrl" -ForegroundColor Yellow

Set-Location $projectPath

try {
    # Configuration Git si nécessaire
    Write-Host "`n📁 Configuration du repository..." -ForegroundColor Green
    
    # Vérifier si .git existe
    if (-not (Test-Path ".git")) {
        Write-Host "Initialisation du repository Git..." -ForegroundColor Yellow
        git init
    }
    
    # Configurer le remote
    Write-Host "Configuration du remote origin..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin $repoUrl
    
    # Configuration utilisateur (optionnel)
    git config user.name "codecsverige" 2>$null
    git config user.email "codecsverige@users.noreply.github.com" 2>$null
    
    # Ajouter tous les fichiers
    Write-Host "`n📦 Ajout des fichiers..." -ForegroundColor Green
    git add .
    
    # Créer le commit
    Write-Host "`n💾 Création du commit..." -ForegroundColor Green
    $commitMessage = "feat: complete app update with SEO improvements, UI fixes, and privacy controls

- Reorganized footer sections and removed duplicates
- Normalized My Rides list item density
- Fixed UserProfilePage ReferenceError
- Added SEO fallback content control
- Excluded private routes from sitemap
- Added noindex tags to private/auth pages
- Updated robots.txt for better privacy
- Generated static ride pages for SEO
- Complete build with optimized bundle (212.62 kB)
- Generated sitemap with 21 URLs"

    git commit -m $commitMessage
    
    # Pousser vers GitHub
    Write-Host "`n🌐 Publication sur GitHub..." -ForegroundColor Green
    git branch -M main
    git push -u origin main --force
    
    Write-Host "`n✅ Publication réussie!" -ForegroundColor Green
    Write-Host "🔗 Votre repository: https://github.com/codecsverige/vagvanner" -ForegroundColor Cyan
    
    # Afficher le statut final
    Write-Host "`n📊 Statut final:" -ForegroundColor Yellow
    git status --short
    git log -1 --oneline
    
} catch {
    Write-Host "`n❌ Erreur lors de la publication:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`n🔍 Diagnostic:" -ForegroundColor Yellow
    Write-Host "Git status:" -ForegroundColor White
    git status
    Write-Host "`nGit remotes:" -ForegroundColor White
    git remote -v
}

Write-Host "`n✨ Script terminé." -ForegroundColor Magenta
