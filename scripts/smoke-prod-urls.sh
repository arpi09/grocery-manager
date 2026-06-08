#!/usr/bin/env bash
# Production URL smoke: curl public routes and fail on non-200 or error HTML in body.
# Used by .github/workflows/deploy.yml (pre-deploy verify) and docs/PROD_SMOKE.md.

set -euo pipefail

BASE_URL="${BASE_URL:-https://skaffu.com}"
BASE_URL="${BASE_URL%/}"
SMOKE_DOUBLE_CHECK="${SMOKE_DOUBLE_CHECK:-true}"
SMOKE_PAUSE_SECONDS="${SMOKE_PAUSE_SECONDS:-30}"

paths=(
	"/"
	"/login"
	"/guider"
	"/guider/minska-matsvinn-hemma-app"
)

fail=0
tmpdir="${TMPDIR:-/tmp}"
body_dir=$(mktemp -d "${tmpdir}/smoke-prod.XXXXXX")
trap 'rm -rf "$body_dir"' EXIT

check_html_body() {
	local path="$1"
	local body_file="$2"
	local url="${BASE_URL}${path}"

	if grep -qi 'Internal Error' "$body_file"; then
		echo "::error::Smoke failed: ${url} HTML contains \"Internal Error\""
		fail=1
	fi
	if grep -qi 'status: 500' "$body_file" || grep -qi 'Error: 500' "$body_file"; then
		echo "::error::Smoke failed: ${url} HTML looks like a SvelteKit 500 page"
		fail=1
	fi
	if grep -qi 'process is not defined' "$body_file"; then
		echo "::error::Smoke failed: ${url} HTML references client crash \"process is not defined\""
		fail=1
	fi
}

smoke_pass() {
	local pass_label="$1"
	local pass_fail=0

	for path in "${paths[@]}"; do
		url="${BASE_URL}${path}"
		body_file="${body_dir}/${pass_label}-$(echo "$path" | tr '/' '_').html"
		code=$(curl -sS -o "$body_file" -w "%{http_code}" --max-time 30 -L "$url" || echo "000")
		if [ "$code" != "200" ]; then
			echo "::error::Smoke failed (${pass_label}): ${url} returned HTTP ${code} (expected 200)"
			pass_fail=1
		else
			echo "OK (${pass_label}): ${url} → ${code}"
			check_html_body "$path" "$body_file"
		fi
	done

	return "$pass_fail"
}

echo "Production smoke pass 1 (${#paths[@]} URLs at ${BASE_URL})"
if ! smoke_pass "pass1"; then
	fail=1
fi

if [ "$fail" -eq 0 ] && [ "$SMOKE_DOUBLE_CHECK" = "true" ]; then
	echo "Waiting ${SMOKE_PAUSE_SECONDS}s before second smoke pass (cold-start guard)…"
	sleep "$SMOKE_PAUSE_SECONDS"
	echo "Production smoke pass 2"
	if ! smoke_pass "pass2"; then
		fail=1
	fi
fi

if [ "$fail" -ne 0 ]; then
	echo "::error::Production smoke failed — treat deploy as FAILED even if Firebase deploy succeeded."
	echo "Rollback example: gh workflow run \"Deploy to production\" --ref master -f sha=<last-good-sha>"
	exit 1
fi

echo "Production smoke passed (${#paths[@]} URLs at ${BASE_URL})."
