param(
	[ValidateSet('ai', 'admin', 'tests', 'dev', 'main')]
	[string]$Worktree = 'ai'
)

function Get-RepoRoot {
	if ($env:SKAFFU_ROOT -and (Test-Path $env:SKAFFU_ROOT)) {
		return (Resolve-Path $env:SKAFFU_ROOT).Path
	}
	$gitRoot = git -C $PSScriptRoot rev-parse --show-toplevel 2>$null
	if ($LASTEXITCODE -eq 0 -and $gitRoot) {
		return (Resolve-Path $gitRoot).Path
	}
	Write-Error 'Could not resolve repo root. Set SKAFFU_ROOT or run from a git worktree.'
	exit 1
}

$mainRoot = Get-RepoRoot
$parent = Split-Path $mainRoot -Parent
$repoName = Split-Path $mainRoot -Leaf

$roots = @{
	ai    = $mainRoot
	main  = $mainRoot
	admin = Join-Path $parent "$repoName-admin"
	tests = Join-Path $parent "$repoName-tests"
	dev   = Join-Path $parent "$repoName-dev"
}

$target = $roots[$Worktree]
if (-not (Test-Path $target)) {
	Write-Error "Worktree path not found: $target (create with npm run worktree:setup or git worktree add)"
	exit 1
}

Set-Location $target

if (-not (Test-Path 'node_modules')) {
	Write-Host "Installing dependencies in $target ..."
	npm ci
	if ($LASTEXITCODE -ne 0) {
		exit $LASTEXITCODE
	}
}

if (-not (Test-Path '.env')) {
	if (Test-Path '.env.example') {
		Write-Host 'No .env — running npm run setup:agent ...'
		npm run setup:agent -- --skip-migrate
	} else {
		Write-Host 'No .env found — copy .env.example and set secrets before login/OpenAI.'
	}
}

Write-Host "Starting dev:watch in $target"
npm run dev:watch
