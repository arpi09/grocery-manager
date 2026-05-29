# Create or update ADMIN_PASSWORD for Firebase App Hosting without putting the value in shell history.
# Requires: Node.js (npx), Firebase CLI auth (firebase login), Blaze project home-pantry-4bee5.
#
# OPENAI_API_KEY is also bound in apphosting.yaml. Deploy can fail if that secret is missing even
# when the feature is optional — run a separate secrets:set + grantaccess for OPENAI_API_KEY, or
# adjust apphosting.yaml / console env. See docs/FIREBASE_DEPLOY.md.
param(
	[string]$Project = 'home-pantry-4bee5',
	[string]$Backend = 'home-pantry'
)

$ErrorActionPreference = 'Stop'

$npxCmd = Join-Path ${env:ProgramFiles} 'nodejs\npx.cmd'
if (-not (Test-Path -LiteralPath $npxCmd)) {
	$npxCmd = 'npx'
}

$tempFile = Join-Path $env:TEMP ("home-pantry-admin-password-{0}.txt" -f [guid]::NewGuid().ToString('N'))
New-Item -ItemType File -Path $tempFile -Force | Out-Null

Write-Host @"

Admin-lösenord för App Hosting (lagras bara i Google Secret Manager).

1) Notepad öppnas med en tom fil.
2) Skriv lösenordet på en rad, spara (Ctrl+S) och stäng Notepad.
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

	& $npxCmd -y firebase-tools@latest apphosting:secrets:set ADMIN_PASSWORD `
		--project $Project `
		--data-file $tempFile

	& $npxCmd -y firebase-tools@latest apphosting:secrets:grantaccess ADMIN_PASSWORD `
		--backend $Backend `
		--project $Project

	Write-Host "Klart. Secret ADMIN_PASSWORD är satt och backend '$Backend' har access."
	Write-Host 'Starta om / deploya App Hosting så RUNTIME får det nya värdet.'
}
finally {
	if (Test-Path -LiteralPath $tempFile) {
		Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
	}
}
