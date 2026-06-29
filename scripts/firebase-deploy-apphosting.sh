#!/usr/bin/env bash
# Deploy App Hosting with retry on transient IAM 409 (concurrent setIamPolicy).
# CI: requires GOOGLE_APPLICATION_CREDENTIALS from google-github-actions/auth (FIREBASE_SERVICE_ACCOUNT secret).
# Local: gcloud auth application-default login, or GOOGLE_APPLICATION_CREDENTIALS pointing at a SA key file.
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
BACKEND="${2:-home-pantry}"
MAX_ATTEMPTS="${FIREBASE_DEPLOY_MAX_ATTEMPTS:-8}"
INITIAL_DELAY_SECONDS="${FIREBASE_DEPLOY_RETRY_DELAY_SECONDS:-45}"

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
	npx firebase-tools@latest experiments:disable pintags \
		--project "$PROJECT" \
		--non-interactive 2>/dev/null || true
}

deploy_once() {
	disable_pintags
	npx firebase-tools@latest deploy \
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

attempt=1
delay_seconds="$INITIAL_DELAY_SECONDS"
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

	if is_iam_409 "$log_file" && [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
		sleep_for="$(random_jitter "$delay_seconds")"
		echo "::warning::Transient IAM 409 (concurrent policy changes) on attempt ${attempt}/${MAX_ATTEMPTS} — retrying full deploy in ${sleep_for}s (base ${delay_seconds}s + jitter)"
		rm -f "$log_file"
		sleep "$sleep_for"
		delay_seconds=$((delay_seconds * 2))
		attempt=$((attempt + 1))
		continue
	fi

	if grep -qE 'HTTP Error: 403|Policy update access denied|Permission .* denied' "$log_file"; then
		echo "::error::Deploy SA lacks IAM permission (403) — fix GCP roles on github-deploy@, do not retry. See docs/DEPLOY.md#firebase-deploy-service-account"
	fi
	rm -f "$log_file"
	exit "$exit_code"
done
