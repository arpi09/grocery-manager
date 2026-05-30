# Backup Cursor / local setup for account migration (no secrets uploaded).
# Safe to commit — copies only to private/backups/ inside the repo (gitignored via private/).

param(
	[string]$RepoRoot = $PSScriptRoot + '\..'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path $RepoRoot).Path

Write-Host '=== Home Pantry — Cursor setup backup ===' -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot"
Write-Host ''
Write-Warning 'COMMIT NEVER: .env, private/backups/, or any file containing API keys or passwords.'
Write-Host ''

$backupsDir = Join-Path $RepoRoot 'private\backups'
if (-not (Test-Path $backupsDir)) {
	New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

$envPath = Join-Path $RepoRoot '.env'
if (Test-Path $envPath) {
	$stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
	$dest = Join-Path $backupsDir ".env.backup.$stamp"
	Copy-Item -Path $envPath -Destination $dest -Force
	Write-Host "Copied .env -> $dest" -ForegroundColor Green
}
else {
	Write-Host 'No .env found — copy .env.example to .env after restore.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '--- Copy manually to a folder OUTSIDE the repo (e.g. Desktop) ---' -ForegroundColor Cyan
@(
	".env  ->  $RepoRoot\.env"
	"private\  (entire folder)  ->  $RepoRoot\private"
	"Optional chat history:"
	"  $env:USERPROFILE\.cursor\projects\*\agent-transcripts\"
) | ForEach-Object { Write-Host "  $_" }

Write-Host ''
Write-Host '--- From git clone (no extra copy) ---' -ForegroundColor Cyan
@(
	'.cursor\rules\  (Project Rules)'
	'docs\  (public onboarding + FIREBASE, EMAIL, CAPTCHA)'
	'.env.example'
) | ForEach-Object { Write-Host "  $_" }

$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
	Write-Host ''
	Write-Host '--- Git ---' -ForegroundColor Cyan
	Push-Location $RepoRoot
	try {
		& git status -sb
		Write-Host ''
		& git log -1 --oneline
	}
	finally {
		Pop-Location
	}
}
else {
	Write-Host ''
	Write-Host 'git not in PATH — run git status and git log -1 manually.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Next: see private\CURSOR_MIGRATION.md and private\BACKUP_CHECKLIST.md' -ForegroundColor Cyan
