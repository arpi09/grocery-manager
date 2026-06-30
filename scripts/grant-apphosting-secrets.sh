#!/usr/bin/env bash
# One-time (or when adding a new secret): grant App Hosting backend access to Secret Manager secrets.
# Does NOT run during CI deploy — avoids extra setIamPolicy churn on every release.
# Safe to re-run when adding secrets; skips secrets that do not exist yet.
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
BACKEND="${2:-home-pantry}"
FIREBASE_TOOLS_VERSION="${FIREBASE_TOOLS_VERSION:-14.9.0}"

# Must match `secret:` entries in apphosting.yaml (RUNTIME bindings).
SECRETS=(
	DATABASE_URL
	ADMIN_PASSWORD
	OPENAI_API_KEY
	RESEND_API_KEY
	TURNSTILE_SECRET_KEY
	CRON_SECRET
	STRIPE_SECRET_KEY
	STRIPE_WEBHOOK_SECRET
	GOOGLE_CLIENT_ID
	GOOGLE_CLIENT_SECRET
	VAPID_PRIVATE_KEY
)

grant_one() {
	local name="$1"
	if ! npx "firebase-tools@${FIREBASE_TOOLS_VERSION}" apphosting:secrets:describe "$name" \
		--project "$PROJECT" \
		--non-interactive >/dev/null 2>&1; then
		echo "::notice::Skip $name — secret not created yet (run apphosting:secrets:set first)"
		return 0
	fi
	echo "Granting backend '$BACKEND' access to $name..."
	npx "firebase-tools@${FIREBASE_TOOLS_VERSION}" apphosting:secrets:grantaccess "$name" \
		--backend "$BACKEND" \
		--project "$PROJECT" \
		--non-interactive
}

for secret in "${SECRETS[@]}"; do
	grant_one "$secret"
done

echo "Done. Redeploy only when secret values or apphosting.yaml bindings change — not after grantaccess alone."
