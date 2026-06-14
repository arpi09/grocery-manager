#!/usr/bin/env bash
# deprecated — policy in deploy-safety.mdc, delivery-done.mdc, skill skaffu-deploy-verify
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
echo '{ "permission": "allow" }'
