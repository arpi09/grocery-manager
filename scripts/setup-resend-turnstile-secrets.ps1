# Create or update RESEND_API_KEY and TURNSTILE_SECRET_KEY for Firebase App Hosting.
# Requires: Node.js (npx), Firebase CLI auth (firebase login), Blaze project home-pantry-4bee5.
#
# Secrets are never echoed to the terminal. Each value is pasted in Notepad (like setup-admin-password-secret.ps1).
# PUBLIC_TURNSTILE_SITE_KEY is public — optional -PatchAppHostingFromEnv reads it from .env into apphosting.yaml.
param(
	[string]$Project = 'home-pantry-4bee5',
	[string]$Backend = 'home-pantry',
	[switch]$PatchAppHostingFromEnv
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$AppHostingYaml = Join-Path $RepoRoot 'apphosting.yaml'

$npxCmd = Join-Path ${env:ProgramFiles} 'nodejs\npx.cmd'
if (-not (Test-Path -LiteralPath $npxCmd)) {
	$npxCmd = 'npx'
}

function Set-SecretFromNotepad {
	param(
		[Parameter(Mandatory)]
		[string]$SecretName
	)

	$tempFile = Join-Path $env:TEMP ("home-pantry-{0}-{1}.txt" -f $SecretName.ToLower(), [guid]::NewGuid().ToString('N'))
	New-Item -ItemType File -Path $tempFile -Force | Out-Null

	Write-Host @"

Secret: $SecretName (Google Secret Manager only).

1) Notepad opens with an empty file.
2) Paste the secret on one line, save (Ctrl+S), close Notepad.
3) Return here and press Enter.

Temp file (deleted after upload): $tempFile

"@

	Start-Process -FilePath notepad.exe -ArgumentList $tempFile -Wait
	Read-Host 'Press Enter when Notepad is closed and the file is saved'

	try {
		$info = Get-Item -LiteralPath $tempFile
		if ($info.Length -eq 0) {
			Write-Error "Temp file is empty. $SecretName was not uploaded."
		}

		& $npxCmd -y firebase-tools@latest apphosting:secrets:set $SecretName `
			--project $Project `
			--data-file $tempFile

		& $npxCmd -y firebase-tools@latest apphosting:secrets:grantaccess $SecretName `
			--backend $Backend `
			--project $Project

		Write-Host "Done: $SecretName set and backend '$Backend' has access."
	}
	finally {
		if (Test-Path -LiteralPath $tempFile) {
			Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
		}
	}
}

Write-Host @"

Firebase App Hosting — Resend + Turnstile secrets

You will be prompted twice (Notepad) for:
  - RESEND_API_KEY
  - TURNSTILE_SECRET_KEY

Alternative (interactive CLI only, no Notepad):
  npx firebase apphosting:secrets:set RESEND_API_KEY --project $Project
  npx firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend $Backend --project $Project
  (repeat for TURNSTILE_SECRET_KEY)

PUBLIC_TURNSTILE_SITE_KEY is not a secret. Set it in Firebase Console (App Hosting → Environment)
or in apphosting.yaml (BUILD + RUNTIME), then redeploy.

"@

Set-SecretFromNotepad -SecretName 'RESEND_API_KEY'
Set-SecretFromNotepad -SecretName 'TURNSTILE_SECRET_KEY'

if ($PatchAppHostingFromEnv) {
	$envFile = Join-Path $RepoRoot '.env'
	if (-not (Test-Path -LiteralPath $envFile)) {
		Write-Warning '.env not found — skipped apphosting.yaml patch.'
	} else {
		$siteKeyLine = Select-String -Path $envFile -Pattern '^PUBLIC_TURNSTILE_SITE_KEY=' | Select-Object -First 1
		if (-not $siteKeyLine) {
			Write-Warning 'PUBLIC_TURNSTILE_SITE_KEY missing in .env — skipped patch.'
		} else {
			$siteKey = ($siteKeyLine.Line -split '=', 2)[1].Trim().Trim('"').Trim("'")
			if ($siteKey -match 'REPLACE_WITH|placeholder|your_' -or [string]::IsNullOrWhiteSpace($siteKey)) {
				Write-Warning 'PUBLIC_TURNSTILE_SITE_KEY in .env looks like a placeholder — skipped patch.'
			} else {
				$content = Get-Content -LiteralPath $AppHostingYaml -Raw
				$newContent = $content -replace '(?m)(- variable: PUBLIC_TURNSTILE_SITE_KEY\r?\n\s+value: ).*', "`${1}$siteKey"
				if ($newContent -ne $content) {
					Set-Content -LiteralPath $AppHostingYaml -Value $newContent -NoNewline -Encoding utf8
					Write-Host 'Updated apphosting.yaml PUBLIC_TURNSTILE_SITE_KEY from .env. Commit and redeploy.'
				} else {
					Write-Host 'apphosting.yaml already has PUBLIC_TURNSTILE_SITE_KEY set (no change).'
				}
			}
		}
	}
}

Write-Host @"

Next steps:
  1) Set PUBLIC_TURNSTILE_SITE_KEY in apphosting.yaml or Firebase Console if not done.
  2) Redeploy: gh workflow run release.yml  OR  npm run deploy:firebase  OR  push to main.

Verify:
  npx firebase apphosting:secrets:describe RESEND_API_KEY --project $Project
  npx firebase apphosting:secrets:describe TURNSTILE_SECRET_KEY --project $Project

"@
