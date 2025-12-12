# Publish script: build and push changes to GitHub from Windows PowerShell
param(
  [string]$RemoteUrl,
  [string]$Branch = "main",
  [string]$CommitMessage
)

Write-Host "== VägVänner | Build & Publish ==" -ForegroundColor Cyan

function Ensure-GitRepo {
  $isRepo = & git rev-parse --is-inside-work-tree 2>$null
  if (-not $isRepo) {
    Write-Host "Initializing new git repository..." -ForegroundColor Yellow
    git init | Out-Null
  }
}

function Ensure-Remote {
  param([string]$Name = "origin", [string]$Url)
  $existing = & git remote get-url $Name 2>$null
  if (-not $existing) {
    if (-not $Url) {
      throw "No git remote set. Provide -RemoteUrl https://github.com/<user>/<repo>.git"
    }
    Write-Host "Setting git remote '$Name' => $Url" -ForegroundColor Yellow
    git remote add $Name $Url | Out-Null
  } else {
    Write-Host "Using existing remote '$Name' => $existing" -ForegroundColor Green
  }
}

function Ensure-Branch {
  param([string]$Name = "main")
  $current = (& git branch --show-current).Trim()
  if (-not $current) {
    # Create initial commit if none
    if (-not (Test-Path .gitignore)) { "node_modules/`r`nbuild/`r`n.env*" | Out-File -Encoding utf8 .gitignore }
    git add -A | Out-Null
    git commit -m "chore: initial commit" 2>$null | Out-Null
    git branch -M $Name | Out-Null
    $current = $Name
  }
  if ($current -ne $Name) {
    Write-Host "Switching to branch $Name" -ForegroundColor Yellow
    git checkout -B $Name | Out-Null
  }
}

function Run-OrThrow {
  param([string]$Cmd)
  Write-Host "→ $Cmd" -ForegroundColor DarkCyan
  iex $Cmd
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $Cmd" }
}

try {
  # 1) Git status
  Ensure-GitRepo
  Ensure-Remote -Url $RemoteUrl
  Ensure-Branch -Name $Branch

  # 2) Node/NPM versions (informational)
  try {
    $nodeV = (node -v) 2>$null; if ($nodeV) { Write-Host "Node: $nodeV" }
    $npmV  = (npm -v) 2>$null;  if ($npmV)  { Write-Host "npm:  $npmV" }
  } catch { }

  # 3) Install and build
  Run-OrThrow "npm ci"
  Run-OrThrow "npm run build"

  # 4) Commit and push
  git add -A
  if (-not $CommitMessage) {
    $CommitMessage = "chore: build + publish $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }
  # commit only if there are changes
  $changes = git status --porcelain
  if ($changes) {
    Run-OrThrow "git commit -m `"$CommitMessage`""
  } else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
  }
  Run-OrThrow "git push -u origin $Branch"

  Write-Host "✅ Published to GitHub ($Branch)." -ForegroundColor Green
  Write-Host "A CI workflow will verify the build on GitHub (see .github/workflows/ci-build.yml)." -ForegroundColor Green
} catch {
  Write-Host "❌ Publish failed: $_" -ForegroundColor Red
  Write-Host "Tip: Run with -RemoteUrl if no git remote is configured." -ForegroundColor Yellow
  exit 1
}
