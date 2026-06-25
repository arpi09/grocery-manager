#!/usr/bin/env bash
# Deploy App Hosting with retry on transient IAM 409 (concurrent setIamPolicy).
set -euo pipefail

PROJECT="${1:-home-pantry-4bee5}"
BACKEND="${2:-home-pantry}"
MAX_ATTEMPTS="${FIREBASE_DEPLOY_MAX_ATTEMPTS:-4}"
DELAY_SECONDS="${FIREBASE_DEPLOY_RETRY_DELAY_SECONDS:-30}"

deploy_once() {
	npx firebase-tools@latest deploy \
		--only "apphosting:${BACKEND}" \
		--non-interactive \
		--project "$PROJECT"
}

is_iam_409() {
	local log_file="$1"
	grep -qE 'HTTP Error: 409|concurrent policy changes' "$log_file"
}

attempt=1
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
		echo "::warning::Firebase IAM 409 on attempt ${attempt}/${MAX_ATTEMPTS} — retrying in ${DELAY_SECONDS}s"
		rm -f "$log_file"
		sleep "$DELAY_SECONDS"
		DELAY_SECONDS=$((DELAY_SECONDS * 2))
		attempt=$((attempt + 1))
		continue
	fi

	rm -f "$log_file"
	exit "$exit_code"
done
