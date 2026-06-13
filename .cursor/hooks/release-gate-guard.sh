#!/usr/bin/env bash
set -euo pipefail
input="$(cat)"
extract_command() {
	if command -v jq >/dev/null 2>&1; then
		jq -r '.command // empty' <<<"$input" 2>/dev/null || true
		return
	fi
	if command -v node >/dev/null 2>&1; then
		node -e 'const i=JSON.parse(require("fs").readFileSync(0,"utf8"));if(i.command)process.stdout.write(String(i.command));' <<<"$input" 2>/dev/null || true
	fi
}
command="$(extract_command)"
if [ -z "$command" ]; then echo '{ "permission": "allow" }'; exit 0; fi
if printf '%s' "$command" | grep -Eiq 'git push origin master|gh pr create|gh workflow run deploy'; then
	cat <<'EOF'
{"permission":"ask","user_message":"Release gate: G0 körd? CI green på target SHA? Rollback-plan klar?","agent_message":"Before merge/deploy: run G0 (npm run check:locales && npm run check && npm test), confirm CI quality/quality is green on the target SHA, and note rollback (Firebase revert or git revert + redeploy). Hotfixes may proceed with coordinator approval."}
EOF
	exit 0
fi
echo '{ "permission": "allow" }'
