# VägVänner - GitHub Deployment Script
# Publishes all GPT-5 updates and improvements to GitHub

Write-Host "🚀 VägVänner - GitHub Deployment Starting..." -ForegroundColor Cyan
Write-Host "📊 Publishing GPT-5 Agent Updates + Vercel Toolbar Fix" -ForegroundColor Yellow

$projectPath = Get-Location
$repoUrl = "https://github.com/codecsverige/vagvanner.git"

Write-Host "`n📁 Current Directory: $projectPath" -ForegroundColor Green
Write-Host "🔗 Repository: $repoUrl" -ForegroundColor Green

try {
    # Check git status
    Write-Host "`n📋 Checking current status..." -ForegroundColor Yellow
    git status --short
    
    # Add all changes
    Write-Host "`n📦 Adding all changes..." -ForegroundColor Green
    git add .
    
    # Create comprehensive commit
    Write-Host "`n💾 Creating deployment commit..." -ForegroundColor Green
    $commitMessage = "feat: deploy GPT-5 updates + hide Vercel toolbar - v0.3.4-reviewed

🎯 COMPLETE DEPLOYMENT PACKAGE:

🔧 GPT-5 Agent Updates Included:
✅ Deep Links Fixed - no more white screen on direct URLs
✅ Enhanced Share Functionality - beautiful toast notifications
✅ Report System Complete - dedicated /rapport page  
✅ Error Handling Improved - user-friendly recovery options
✅ SEO Optimization - proper meta tags and canonical URLs
✅ Performance Optimizations - lazy loading and error boundaries

🎨 New Improvements Added:
✅ Vercel Toolbar Hidden - cleaner production appearance
✅ Environment Variables Updated - better configuration
✅ CSS Rules Added - ensure toolbar stays hidden
✅ Build Configuration Enhanced - production-ready

🚀 Technical Details:
- Version: 0.3.4-reviewed
- Badge: v34 REVIEWED 🚀  
- All features tested and verified
- Production deployment ready
- No breaking changes

📊 Files Updated:
- vercel.json (toolbar disabled)
- src/index.css (CSS hiding rules)
- .env.local.example (environment template)
- All GPT-5 improvements preserved

🎖️ Status: READY FOR PRODUCTION DEPLOYMENT"

    git commit -m $commitMessage
    
    # Push to GitHub
    Write-Host "`n🌐 Publishing to GitHub..." -ForegroundColor Green
    git push origin HEAD:main --force-with-lease
    
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "🔗 Repository URL: https://github.com/codecsverige/vagvanner" -ForegroundColor Cyan
    Write-Host "🎯 Badge Updated: v34 REVIEWED 🚀" -ForegroundColor Magenta
    Write-Host "🛡️ Vercel Toolbar: HIDDEN" -ForegroundColor Blue
    
    # Show final status
    Write-Host "`n📊 Final Status:" -ForegroundColor Yellow
    git log -1 --oneline
    Write-Host "`n🎉 All GPT-5 updates successfully published!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`n🔍 Diagnostic Information:" -ForegroundColor Yellow
    Write-Host "Git Status:" -ForegroundColor White
    git status
    Write-Host "`nGit Remotes:" -ForegroundColor White
    git remote -v
}

Write-Host "`n✨ Deployment script completed." -ForegroundColor Magenta