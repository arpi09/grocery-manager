# Create or update OPENAI_API_KEY for Firebase App Hosting (receipt PDF, photo scan, recipes).
# Requires: Node.js (npx), Firebase CLI auth (firebase login), Blaze project home-pantry-4bee5.
param(
	[string]$Project = 'home-pantry-4bee5',
	[string]$Backend = 'home-pantry'
)

$ErrorActionPreference = 'Stop'

$npxCmd = Join-Path ${env:ProgramFiles} 'nodejs\npx.cmd'
if (-not (Test-Path -LiteralPath $npxCmd)) {
	$npxCmd = 'npx'
}

$tempFile = Join-Path $env:TEMP ("home-pantry-openai-key-{0}.txt" -f [guid]::NewGuid().ToString('N'))
New-Item -ItemType File -Path $tempFile -Force | Out-Null

Write-Host @"

OpenAI API-nyckel för App Hosting (kvittoscan, foto-produktscan, recept).

1) Notepad öppnas med en tom fil.
2) Klistra in nyckeln (sk-...) på en rad, spara (Ctrl+S) och stäng Notepad.
3) Kom tillbaka hit och tryck Enter.

Tempfil (raderas automatiskt efter upload): $tempFile

"@

Start-Process -FilePath notepad.exe -ArgumentList $tempFile -Wait
Read-Host 'Tryck Enter när Notepad är stängd och filen är sparad'

try {
	$info = Get-Item -LiteralPath $tempFile
	if ($info.Length -eq 0) {
		Write-Error 'Tempfilen är tom. Inget skickades till Firebase.'
	}

	& $npxCmd -y firebase-tools@latest apphosting:secrets:set OPENAI_API_KEY `
		--project $Project `
		--data-file $tempFile

	& $npxCmd -y firebase-tools@latest apphosting:secrets:grantaccess OPENAI_API_KEY `
		--backend $Backend `
		--project $Project

	Write-Host "Klart. Secret OPENAI_API_KEY är satt och backend '$Backend' har access."
	Write-Host 'Deploya om App Hosting så RUNTIME får nyckeln (dev-runtime behöver inte startas om manuellt).'
}
finally {
	if (Test-Path -LiteralPath $tempFile) {
		Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
	}
}
