# Dependency health — npm audit, Dependabot, refresh cadence

**Last updated:** 2026-06-24 · **Owner:** arpi09

Manual scan cadence: monthly or before major releases. Runtime gate: `npm audit --omit=dev --audit-level=high` in CI (`reusable-quality.yml`).

---

## Dependabot (automated)

Config: [`.github/dependabot.yml`](../.github/dependabot.yml)

| Setting | Value |
|---------|-------|
| Schedule | Weekly, Monday 06:00 Europe/Stockholm |
| Groups | `npm-production-minor-patch`, `npm-development-minor-patch` |
| Commit prefix | `chore(deps)` |
| Open PR limit | 10 |

### PR metadata (labels + assignee)

| Label | Meaning |
|-------|---------|
| `dependencies` | All Dependabot PRs |
| `dependencies:production` | Grouped production minor/patch |
| `dependencies:development` | Grouped development minor/patch |
| `dependencies:major` | Major semver — **no auto-merge** |

Assignee: **arpi09** (via Dependabot config).

Labels are created idempotently by [`.github/workflows/dependabot-automerge.yml`](../.github/workflows/dependabot-automerge.yml) (`gh label create … || true`).

### Auto-merge

Workflow: [`.github/workflows/dependabot-automerge.yml`](../.github/workflows/dependabot-automerge.yml)

- Grouped **patch/minor** PRs → `gh pr merge --auto --squash` after `pr-gate / pr-gate` is green.
- **Major** PRs → labeled `dependencies:major`, manual review only.
- **Repo setting required:** GitHub → Settings → General → **Allow auto-merge** (solo maintainer must enable once).
- Merging deps to `master` does **not** deploy prod — deploy stays manual ([CI_CD.md](./CI_CD.md)).

### CHANGELOG

- Per-PR append is **skipped** for deps (`dependencies` label or `chore(deps)` title) — see `scripts/changelog-append-pr.mjs`.
- Monthly rollup: [`.github/workflows/changelog-deps-monthly.yml`](../.github/workflows/changelog-deps-monthly.yml) (1st of month + `workflow_dispatch`).

---

## Manual refresh commands

```bash
npm ci
npm audit --omit=dev --audit-level=high   # runtime CVE gate (matches CI)
npm audit                                  # full tree (dev included)
npm outdated
```

---

## CI path tier for deps PRs

Dependabot-only changes classify as **low-risk** in `scripts/ci-path-tier.mjs` — lint + check + unit, no build/integration. See [CI_CD.md](./CI_CD.md).

---

## Related

- [CI_CD.md](./CI_CD.md) — workflows table, branch protection
- [RELEASES.md](./RELEASES.md) — CalVer; deps rollup in CHANGELOG not per-PR
- [ENGINEERING_HEALTH.md](./ENGINEERING_HEALTH.md) — posture snapshot
