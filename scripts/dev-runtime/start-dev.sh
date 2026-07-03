#!/usr/bin/env bash
# POSIX dev server starter — runs dev:watch in repo root (or SKAFFU_ROOT).
set -euo pipefail

resolve_root() {
	if [[ -n "${SKAFFU_ROOT:-}" && -d "$SKAFFU_ROOT" ]]; then
		echo "$(cd "$SKAFFU_ROOT" && pwd)"
		return
	fi
	local git_root
	git_root="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || true)"
	if [[ -n "$git_root" ]]; then
		echo "$git_root"
		return
	fi
	echo "Could not resolve repo root. Set SKAFFU_ROOT or run from a git clone." >&2
	exit 1
}

ROOT="$(resolve_root)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
	echo "Installing dependencies in $ROOT ..."
	npm ci
fi

if [[ ! -f .env ]]; then
	if [[ -f .env.example ]]; then
		echo "No .env — running npm run setup:agent ..."
		npm run setup:agent -- --skip-migrate
	else
		echo "No .env found — copy .env.example before login/OpenAI." >&2
	fi
fi

echo "Starting dev:watch in $ROOT"
exec npm run dev:watch
