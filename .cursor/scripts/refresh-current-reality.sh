#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
today="$(date +%Y-%m-%d)"
master_sha=""
git rev-parse --short origin/master >/dev/null 2>&1 && master_sha="$(git rev-parse --short origin/master)"
prod_sha=""
prod_note=""
if command -v gh >/dev/null 2>&1; then
	prod_line="$(gh run list --workflow=deploy.yml -L 5 --json conclusion,headSha 2>/dev/null | jq -r '[.[]|select(.conclusion=="success")]|.[0].headSha//empty' 2>/dev/null || true)"
	[ -n "$prod_line" ] && prod_sha="${prod_line:0:7}" && prod_note="senaste lyckade Deploy to production" || prod_note="gh: ingen success deploy hittad"
else
	prod_note="gh ej tillgänglig"
fi
app_home=""
[ -f src/lib/navigation/app-home.ts ] && app_home="$(grep APP_HOME_PATH src/lib/navigation/app-home.ts | sed -E "s/.*= ['\"]([^'\"]+)['\"].*/\1/")"
cat <<EOF
# CURRENT_REALITY refresh hints ($today)
| Prod SHA | \`${prod_sha:-???????}\` — $prod_note |
| Master SHA | \`${master_sha:-???????}\` |
| APP_HOME_PATH | ${app_home:-/???} |
EOF
