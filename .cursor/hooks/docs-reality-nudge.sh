#!/usr/bin/env bash
# deprecated — policy in .mdc rules (skaffu-reality-sync.mdc, skaffu-core-loop.mdc)
set -euo pipefail
input="$(cat)"
extract_path() {
	if command -v jq >/dev/null 2>&1; then
		jq -r '.file_path // .path // .tool_input.path // .tool_input.file_path // empty' <<<"$input" 2>/dev/null || true
		return
	fi
	if command -v node >/dev/null 2>&1; then
		node -e 'const i=JSON.parse(require("fs").readFileSync(0,"utf8"));const t=i.tool_input||{};const p=i.file_path||i.path||t.path||t.file_path||"";if(p)process.stdout.write(String(p));' <<<"$input" 2>/dev/null || true
	fi
}
file_path="$(extract_path)"
if [ -z "$file_path" ]; then exit 0; fi
normalized="$(printf '%s' "$file_path" | tr '\\' '/')"
if printf '%s' "$normalized" | grep -Eiq 'nav-config|app-home|apphosting\.yaml|HomeDashboard|OnboardingGuide'; then
	echo '{"additional_context":"Uppdatera docs/CURRENT_REALITY.md i samma commit."}'
fi
exit 0
