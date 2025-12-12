<#!
VägVänner | Deploy to Firebase Hosting (PowerShell)

Usage examples:
	# Deploy current build/ as-is (no rebuild), using default project from .firebaserc or prior "firebase use"
	./scripts/deploy.ps1

	# Deploy to a specific project ID/alias
	./scripts/deploy.ps1 -Project vagvanner-prod

	# Rebuild then deploy
	./scripts/deploy.ps1 -Rebuild

Notes:
	- Uses npx to run firebase-tools and react-scripts to avoid PATH issues.
	- If not logged in, you'll be prompted to log in to Firebase in a browser.
	- If -Rebuild is set, Node 18.x is recommended by package.json engines.
!#>

param(
	[string]$Project,
	[switch]$Rebuild,
	[switch]$DryRun,
	[string]$Token
)

$ErrorActionPreference = 'Stop'
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

function Write-Info($msg){ Write-Host $msg -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host $msg -ForegroundColor Yellow }
function Write-Ok($msg){ Write-Host $msg -ForegroundColor Green }
function Write-Err($msg){ Write-Host $msg -ForegroundColor Red }

function Run-OrThrow([string]$Cmd){
	Write-Host "→ $Cmd" -ForegroundColor DarkCyan
	iex $Cmd
	if ($LASTEXITCODE -ne 0) { throw "Command failed: $Cmd" }
}

try {
	Write-Info "== VägVänner | Deploy to Firebase Hosting =="

	# 1) Show local tool versions (informational)
	try {
		$nodeV = (node -v) 2>$null; if ($nodeV) { Write-Host "Node: $nodeV" }
		$npmV  = (npm -v) 2>$null;  if ($npmV)  { Write-Host "npm:  $npmV" }
	} catch {}

	if ($Rebuild) {
		Write-Info "Rebuild requested. Installing deps and building…"
		# Clean install deps
		Run-OrThrow "npm ci"
		# Build via npx to avoid missing local bin; then generate static pages/sitemap if scripts exist
		Run-OrThrow "npx --yes react-scripts@5.0.1 build"
		if (Test-Path "scripts/generate-ride-pages.cjs") { Run-OrThrow "node scripts/generate-ride-pages.cjs" }
		if (Test-Path "scripts/generate-sitemap.cjs")     { Run-OrThrow "node scripts/generate-sitemap.cjs" }
		if (Test-Path "scripts/generate-sitemap.js")      { Run-OrThrow "node scripts/generate-sitemap.js" }
	} else {
		Write-Info "Skipping rebuild. Deploying existing build/ folder."
	}

	if ($DryRun) {
		Write-Warn "Dry run enabled. Skipping actual deploy."
		exit 0
	}

	# 2) Ensure Firebase CLI available via npx; login if needed
	Write-Info "Checking Firebase CLI…"
	Run-OrThrow "npx --yes firebase-tools --version"

		# Optional: Use provided CI token
		if ($Token) {
			Write-Info "Using provided FIREBASE_TOKEN for auth."
			$env:FIREBASE_TOKEN = $Token
		}

	# 3) Select project (optional)
	$projectArg = ""
	if ($Project) {
		Write-Info "Target project: $Project"
		$projectArg = " --project `"$Project`""
	} else {
		Write-Warn "No -Project specified. Using default from .firebaserc or previous 'firebase use'."
	}

	# 4) Deploy hosting
	Write-Info "Deploying to Firebase Hosting…"
	Run-OrThrow "npx --yes firebase-tools deploy --only hosting$projectArg"

	Write-Ok "✅ Deploy complete."
}
catch {
	Write-Err "❌ Deploy failed: $_"
	Write-Warn "Tips:"
	Write-Host " - Sign in: npx firebase-tools login" -ForegroundColor Yellow
	Write-Host " - Set project: npx firebase-tools use <projectIdOrAlias>" -ForegroundColor Yellow
	Write-Host " - Rebuild then deploy: ./scripts/deploy.ps1 -Rebuild -Project <id>" -ForegroundColor Yellow
	exit 1
}
