#!/usr/bin/env bash
set -euo pipefail
input="$(cat)"
extract_path() {
	if command -v jq >/dev/null 2>&1; then
		jq -r '.tool_input.path // .tool_input.file_path // .tool_input.target_notebook // .tool_input.target // .path // .file_path // empty' <<<"$input" 2>/dev/null || true
		return
	fi
	if command -v node >/dev/null 2>&1; then
		node -e 'const i=JSON.parse(require("fs").readFileSync(0,"utf8"));const t=i.tool_input||i;const p=t.path||t.file_path||t.target_notebook||t.target||i.path||i.file_path||"";if(p)process.stdout.write(String(p));' <<<"$input" 2>/dev/null || true
	fi
}
file_path="$(extract_path)"
if [ -z "$file_path" ]; then echo '{ "permission": "allow" }'; exit 0; fi
normalized="$(printf '%s' "$file_path" | tr '\\' '/')"
if printf '%s' "$normalized" | grep -Eiq 'grannskafferiet|kivra|stripe'; then
	cat <<'EOF'
{"permission":"ask","user_message":"Tier C frozen zone — bekräfta explicit request.","agent_message":"This edit targets a Tier C frozen zone (grannskafferiet, Kivra, or Stripe). Confirm the user explicitly requested this area before proceeding."}
EOF
	exit 0
fi
echo '{ "permission": "allow" }'
