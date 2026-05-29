# Run Drizzle migrations against Cloud SQL using DATABASE_URL from the environment or .env.
# Does not read passwords from arguments — set DATABASE_URL yourself (see docs/FIREBASE_DEPLOY.md).
param(
	[switch]$FromEnvFile
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if ($FromEnvFile) {
	$envPath = Join-Path $repoRoot '.env'
	if (-not (Test-Path $envPath)) {
		Write-Error ".env not found at $envPath"
	}
	Get-Content $envPath | ForEach-Object {
		if ($_ -match '^\s*#' -or $_ -notmatch '^\s*(\w+)\s*=\s*(.*)$') { return }
		$name = $Matches[1].Trim()
		$value = $Matches[2].Trim().Trim('"').Trim("'")
		Set-Item -Path "env:$name" -Value $value
	}
}

if (-not $env:DATABASE_URL) {
	Write-Host @"
DATABASE_URL is not set.

Local migrate (public IP + authorized network):
  1. Add your IP in Cloud SQL → Connections → Authorized networks
  2. In .env set USE_PGLITE=false and:
     DATABASE_URL=postgresql://pantry_app:YOUR_PASSWORD@34.158.71.215:5432/pantry
  3. Run: .\scripts\db-migrate-cloudsql.ps1 -FromEnvFile

Or one-shot (PowerShell):
  `$env:USE_PGLITE='false'
  `$env:DATABASE_URL='postgresql://pantry_app:YOUR_PASSWORD@34.158.71.215:5432/pantry'
  npm run db:migrate

See docs/FIREBASE_DEPLOY.md for App Hosting socket URL.
"@
	exit 1
}

if ($env:USE_PGLITE -eq 'true' -or $env:USE_PGLITE -eq '1') {
	Write-Warning 'USE_PGLITE is true; set USE_PGLITE=false when migrating Cloud SQL.'
}

npm run db:migrate
