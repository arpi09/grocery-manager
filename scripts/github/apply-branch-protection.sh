#!/usr/bin/env bash
# Apply recommended branch protection on master (solo-friendly).
# Requires: gh auth with repo admin, GITHUB_REPOSITORY or run from repo root.
#
# Usage: bash scripts/github/apply-branch-protection.sh [branch]
set -euo pipefail

BRANCH="${1:-master}"
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "Applying branch protection to ${REPO}@${BRANCH}..."

gh api \
  -X PUT \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  -f required_status_checks='{"strict":true,"contexts":["pr-gate / pr-gate"]}' \
  -F required_pull_request_reviews='null' \
  -F enforce_admins=false \
  -F required_linear_history=false \
  -F allow_force_pushes=false \
  -F allow_deletions=false \
  -F block_creations=false \
  -F required_conversation_resolution=false \
  -F lock_branch=false \
  -F allow_fork_syncing=true

echo "Done. Require PR: enable manually in GitHub UI if desired (solo: 0 approvals OK)."
