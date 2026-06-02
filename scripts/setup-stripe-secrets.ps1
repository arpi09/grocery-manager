# Create or update Stripe secrets for Firebase App Hosting (Pro checkout).
# Requires: Node.js (npx), Firebase CLI auth (firebase login), Blaze project home-pantry-4bee5.
#
# Secrets are never echoed. Values are pasted in Notepad (see setup-resend-turnstile-secrets.ps1).
# STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_YEARLY are not secrets — set in apphosting.yaml or Firebase Console.
#
# Production webhook: Stripe Dashboard → Developers → Webhooks → Add endpoint
#   URL: https://skaffu.com/api/stripe/webhook
#   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
# Use that endpoint's signing secret (whsec_…) — NOT the secret from `stripe listen` (local dev only).
param(
	[string]$Project = 'home-pantry-4bee5',
	[string]$Backend = 'home-pantry'
)

$ErrorActionPreference = 'Stop'

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

Firebase App Hosting — Stripe secrets

You will be prompted twice (Notepad) for:
  - STRIPE_SECRET_KEY     (sk_test_… or sk_live_… from Stripe Dashboard → API keys)
  - STRIPE_WEBHOOK_SECRET (prod: signing secret from Dashboard webhook https://skaffu.com/api/stripe/webhook)

After secrets exist:
  1) Replace STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_YEARLY in apphosting.yaml (price_… from Products).
  2) Redeploy (push to master or npm run deploy:firebase).

Alternative (interactive CLI, values not in shell history if you type at prompt):
  npx firebase apphosting:secrets:set STRIPE_SECRET_KEY --project $Project
  npx firebase apphosting:secrets:grantaccess STRIPE_SECRET_KEY --backend $Backend --project $Project
  (repeat for STRIPE_WEBHOOK_SECRET)

"@

Set-SecretFromNotepad -SecretName 'STRIPE_SECRET_KEY'
Set-SecretFromNotepad -SecretName 'STRIPE_WEBHOOK_SECRET'

Write-Host @"

Next: update price IDs in apphosting.yaml, then redeploy.

Verify:
  npx firebase apphosting:secrets:describe STRIPE_SECRET_KEY --project $Project
  npx firebase apphosting:secrets:describe STRIPE_WEBHOOK_SECRET --project $Project

"@
