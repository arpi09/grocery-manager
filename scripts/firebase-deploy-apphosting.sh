#!/usr/bin/env bash
# Deploy App Hosting with retry on transient IAM 409 (concurrent setIamPolicy).
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
BACKEND="${2:-home-pantry}"
MAX_ATTEMPTS="${FIREBASE_DEPLOY_MAX_ATTEMPTS:-8}"
INITIAL_DELAY_SECONDS="${FIREBASE_DEPLOY_RETRY_DELAY_SECONDS:-45}"

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

is_iam_409() {
	local log_file="$1"
	grep -qE 'HTTP Error: 409|concurrent policy changes|setIamPolicy|ABORTED.*policy|There were concurrent policy changes' "$log_file"
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
		echo "::warning::Firebase IAM 409 on attempt ${attempt}/${MAX_ATTEMPTS} — retrying in ${sleep_for}s (base ${delay_seconds}s + jitter)"
		rm -f "$log_file"
		sleep "$sleep_for"
		delay_seconds=$((delay_seconds * 2))
		attempt=$((attempt + 1))
		continue
	fi

	rm -f "$log_file"
	exit "$exit_code"
done
