param(
	[ValidateSet('ai', 'admin', 'tests', 'dev', 'main')]
	[string]$Worktree = 'ai'
)

$roots = @{
	ai    = 'C:\Users\ArvidPilhall\Projects\home-pantry'
	admin = 'C:\Users\ArvidPilhall\Projects\home-pantry-admin'
	tests = 'C:\Users\ArvidPilhall\Projects\home-pantry-tests'
	dev   = 'C:\Users\ArvidPilhall\Projects\home-pantry-dev'
	main  = 'C:\Users\ArvidPilhall\Projects\home-pantry'
}

$target = $roots[$Worktree]
if (-not (Test-Path $target)) {
	Write-Error "Worktree path not found: $target"
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

if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
	Write-Host "No .env found — copy .env.example and set secrets before relying on login/OpenAI."
}

Write-Host "Starting dev:watch in $target"
npm run dev:watch
