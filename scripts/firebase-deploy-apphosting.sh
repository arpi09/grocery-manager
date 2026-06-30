#!/usr/bin/env bash
# Deploy App Hosting with limited retry on transient IAM 409 (concurrent setIamPolicy).
# CI: requires GOOGLE_APPLICATION_CREDENTIALS from google-github-actions/auth (FIREBASE_SERVICE_ACCOUNT secret).
# Local: gcloud auth application-default login, or GOOGLE_APPLICATION_CREDENTIALS pointing at a SA key file.
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
BACKEND="${2:-home-pantry}"
# firebase-tools >=14.10 always calls project setIamPolicy on every apphosting deploy
# (ensureAppHostingComputeServiceAccount → provisionDefaultComputeServiceAccount).
# 14.9.0 only writes IAM when the compute SA is missing or storage.objectViewer is absent.
FIREBASE_TOOLS_VERSION="${FIREBASE_TOOLS_VERSION:-14.9.0}"
MAX_ATTEMPTS="${FIREBASE_DEPLOY_MAX_ATTEMPTS:-3}"
INITIAL_DELAY_SECONDS="${FIREBASE_DEPLOY_RETRY_DELAY_SECONDS:-30}"
MAX_TOTAL_RETRY_SECONDS="${FIREBASE_DEPLOY_MAX_RETRY_SECONDS:-300}"

assert_ci_auth() {
	if [ -z "${CI:-}" ]; then
		return 0
	fi
	if [ -n "${FIREBASE_TOKEN:-}" ]; then
		echo "::error::FIREBASE_TOKEN is not allowed in CI deploy. Remove the FIREBASE_TOKEN secret and use FIREBASE_SERVICE_ACCOUNT instead."
		echo "See docs/DEPLOY.md#firebase-deploy-service-account"
		exit 1
	fi
	if [ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
		echo "::error::CI deploy requires GOOGLE_APPLICATION_CREDENTIALS (set FIREBASE_SERVICE_ACCOUNT + google-github-actions/auth in deploy.yml)."
		echo "See docs/DEPLOY.md#firebase-deploy-service-account"
		exit 1
	fi
	echo "CI deploy auth: ADC (${GOOGLE_APPLICATION_CREDENTIALS})"
}

assert_ci_auth

random_jitter() {
	local base="$1"
	local spread=$((base / 4 + 1))
	echo $((base + RANDOM % spread))
}

# pintags (default-on in firebase-tools) can trigger Cloud Run PUT / IAM churn and 409 conflicts.
# Disable on every deploy — CI runners have no persistent firebase-tools config.
disable_pintags() {
	npx "firebase-tools@${FIREBASE_TOOLS_VERSION}" experiments:disable pintags \
		--project "$PROJECT" \
		--non-interactive 2>/dev/null || true
}

deploy_once() {
	disable_pintags
	npx "firebase-tools@${FIREBASE_TOOLS_VERSION}" deploy \
		--only "apphosting:${BACKEND}" \
		--non-interactive \
		--project "$PROJECT"
}

# Transient IAM 409 only — do NOT match bare "setIamPolicy" (appears in 403 errors too).
is_iam_409() {
	local log_file="$1"
	if grep -qE 'HTTP Error: 403|Policy update access denied|Permission .* denied' "$log_file"; then
		return 1
	fi
	grep -qE 'HTTP Error: 409|There were concurrent policy changes|concurrent policy changes' "$log_file"
}

# App Hosting rollout can finish before a final setIamPolicy 409 — treat as success when logs show release.
rollout_succeeded() {
	local log_file="$1"
	grep -qE 'Deploy complete|Released rollout|Rollout (complete|finished|succeeded)|✔.*apphosting' "$log_file"
}

attempt=1
delay_seconds="$INITIAL_DELAY_SECONDS"
total_retry_seconds=0
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
	log_file="$(mktemp)"
	set +e
	deploy_once 2>&1 | tee "$log_file"
	exit_code="${PIPESTATUS[0]}"
	set -e

	if [ "$exit_code" -eq 0 ]; then
		rm -f "$log_file"
		exit 0
	fi

	if is_iam_409 "$log_file" && rollout_succeeded "$log_file"; then
		echo "::warning::App Hosting rollout succeeded but final IAM sync returned 409 — treating deploy as success. Run \`bash scripts/grant-apphosting-secrets.sh\` once if secret IAM keeps racing."
		rm -f "$log_file"
		exit 0
	fi

	if is_iam_409 "$log_file" && [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
		sleep_for="$(random_jitter "$delay_seconds")"
		if [ $((total_retry_seconds + sleep_for)) -gt "$MAX_TOTAL_RETRY_SECONDS" ]; then
			echo "::error::IAM 409 retry budget exhausted (${total_retry_seconds}s slept, cap ${MAX_TOTAL_RETRY_SECONDS}s) after attempt ${attempt}/${MAX_ATTEMPTS}."
			echo "::error::Do not start parallel deploys. Run \`bash scripts/grant-apphosting-compute-roles.sh\` + \`bash scripts/grant-apphosting-secrets.sh\` once, then redeploy. See docs/DEPLOY.md#iam-during-deploy"
			rm -f "$log_file"
			exit 1
		fi
		echo "::warning::Transient IAM 409 (concurrent policy changes) on attempt ${attempt}/${MAX_ATTEMPTS} — retrying full deploy in ${sleep_for}s (base ${delay_seconds}s + jitter)"
		rm -f "$log_file"
		sleep "$sleep_for"
		total_retry_seconds=$((total_retry_seconds + sleep_for))
		delay_seconds=$((delay_seconds * 2))
		attempt=$((attempt + 1))
		continue
	fi

	if is_iam_409 "$log_file"; then
		echo "::error::IAM 409 (concurrent policy changes) after ${attempt}/${MAX_ATTEMPTS} deploy attempts — failing fast (no more full redeploys)."
		echo "::error::Pre-grant once: \`bash scripts/grant-apphosting-compute-roles.sh\` + \`bash scripts/grant-apphosting-secrets.sh\`. Ensure only one deploy runs (no Console auto-deploy + Actions). See docs/DEPLOY.md#iam-during-deploy"
	fi
	if grep -qE 'HTTP Error: 403|Policy update access denied|Permission .* denied' "$log_file"; then
		echo "::error::Deploy SA lacks IAM permission (403) — fix GCP roles on github-deploy@, do not retry. See docs/DEPLOY.md#firebase-deploy-service-account"
	fi
	rm -f "$log_file"
	exit "$exit_code"
done
