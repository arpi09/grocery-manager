#!/usr/bin/env bash
# Post-deploy smoke: curl public routes and fail on non-200 (catches prod 500s).
# Used by .github/workflows/deploy.yml and documented in docs/PROD_SMOKE.md.

set -euo pipefail

BASE_URL="${BASE_URL:-https://skaffu.com}"
BASE_URL="${BASE_URL%/}"

paths=(
	"/"
	"/login"
	"/guider"
)

fail=0

for path in "${paths[@]}"; do
	url="${BASE_URL}${path}"
	code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 -L "$url" || echo "000")
	if [ "$code" != "200" ]; then
		echo "::error::Smoke failed: ${url} returned HTTP ${code} (expected 200)"
		fail=1
	else
		echo "OK: ${url} → ${code}"
	fi
done

if [ "$fail" -ne 0 ]; then
	echo "::error::Production smoke failed — treat deploy as FAILED even if Firebase deploy succeeded."
	echo "Rollback example: gh workflow run \"Deploy to production\" --ref master -f sha=<last-good-sha>"
	exit 1
fi

echo "Production smoke passed (${#paths[@]} URLs at ${BASE_URL})."
