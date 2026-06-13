#!/usr/bin/env bash
# One-command cloud agent bootstrap: .env from example, minimal vars, npm ci.
# See docs/CLOUD_AGENT_SETUP.md

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
	echo "Creating .env from .env.example"
	cp .env.example .env
else
	echo ".env already exists — keeping existing secrets"
fi

# Append only missing keys; never overwrite user values.
ensure_env_var() {
	local key="$1"
	local value="$2"
	if grep -qE "^${key}=" .env 2>/dev/null; then
		return 0
	fi
	echo "${key}=${value}" >> .env
	echo "Added ${key} to .env"
}

ensure_env_var USE_PGLITE true
ensure_env_var PUBLIC_ORIGIN http://localhost:5173
ensure_env_var ADMIN_PASSWORD cloud-agent-dev
ensure_env_var EMAIL_SENDING_DISABLED true

echo "Running npm ci…"
npm ci

echo "Cloud bootstrap complete. Run: npm run quality:ci"
