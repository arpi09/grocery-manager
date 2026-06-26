#!/usr/bin/env bash
# Create GCP service account for GitHub Actions Firebase App Hosting deploy (ADC).
# Does NOT commit or print secret values — writes key JSON to a local file you choose.
#
# Prerequisites: gcloud CLI, logged in with permission to create SAs and grant IAM on the project.
#
# Usage:
#   bash scripts/setup-firebase-deploy-sa.sh [output-json-path]
#
# Then set GitHub secret (from repo root, key file is gitignored):
#   gh secret set FIREBASE_SERVICE_ACCOUNT < ./github-deploy-sa-key.json
#   gh secret remove FIREBASE_TOKEN   # legacy CI token — no longer used
set -euo pipefail

PROJECT="${GCP_PROJECT:-home-pantry-4bee5}"
SA_NAME="${DEPLOY_SA_NAME:-github-deploy}"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
KEY_FILE="${1:-./github-deploy-sa-key.json}"

if ! command -v gcloud >/dev/null 2>&1; then
	echo "::error::gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
	exit 1
fi

echo "Project:  ${PROJECT}"
echo "SA:       ${SA_EMAIL}"
echo "Key file: ${KEY_FILE}"
echo ""

if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT" >/dev/null 2>&1; then
	echo "Service account already exists."
else
	echo "Creating service account ${SA_NAME}..."
	gcloud iam service-accounts create "$SA_NAME" \
		--display-name="GitHub Actions Firebase deploy" \
		--project="$PROJECT"
fi

grant_role() {
	local role="$1"
	echo "Granting ${role} to ${SA_EMAIL}..."
	gcloud projects add-iam-policy-binding "$PROJECT" \
		--member="serviceAccount:${SA_EMAIL}" \
		--role="${role}" \
		--quiet >/dev/null
}

# Minimum for firebase deploy --only apphosting (see docs/DEPLOY.md)
grant_role "roles/firebaseapphosting.admin"
grant_role "roles/iam.serviceAccountUser"

if [ -f "$KEY_FILE" ]; then
	echo "::warning::${KEY_FILE} already exists — refusing to overwrite. Pass a different path or remove the file."
	exit 1
fi

echo "Creating JSON key..."
gcloud iam service-accounts keys create "$KEY_FILE" \
	--iam-account="$SA_EMAIL" \
	--project="$PROJECT"

echo ""
echo "Done. Key written to: ${KEY_FILE}"
echo ""
echo "Next steps (do NOT commit the key file):"
echo "  1. gh secret set FIREBASE_SERVICE_ACCOUNT < ${KEY_FILE}"
echo "  2. gh secret remove FIREBASE_TOKEN   # optional — legacy token no longer used by deploy.yml"
echo "  3. Merge deploy workflow changes, then run Deploy to production"
echo ""
echo "Docs: docs/DEPLOY.md#firebase-deploy-service-account"
