#!/usr/bin/env bash
# One-time: grant project-level IAM roles for the App Hosting runtime compute SA.
# Run after backend exists — avoids firebase-tools >=14.10 calling setIamPolicy on every deploy.
# Safe to re-run (gcloud add-iam-policy-binding is idempotent).
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
COMPUTE_SA="firebase-app-hosting-compute@${PROJECT}.iam.gserviceaccount.com"

ROLES=(
	roles/firebaseapphosting.computeRunner
	roles/firebase.sdkAdminServiceAgent
	roles/developerconnect.readTokenAccessor
	roles/storage.objectViewer
)

if ! command -v gcloud >/dev/null 2>&1; then
	echo "::error::gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
	exit 1
fi

echo "Project:    ${PROJECT}"
echo "Compute SA: ${COMPUTE_SA}"
echo ""

for role in "${ROLES[@]}"; do
	echo "Granting ${role}..."
	gcloud projects add-iam-policy-binding "$PROJECT" \
		--member="serviceAccount:${COMPUTE_SA}" \
		--role="${role}" \
		--quiet >/dev/null
done

echo ""
echo "Done. With firebase-tools 14.9.0 deploy skips project setIamPolicy when SA + objectViewer exist."
echo "Also run: bash scripts/grant-apphosting-secrets.sh (Secret Manager bindings)"
