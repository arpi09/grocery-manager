# Merge queue (Coordinator v2)

Ordered view of **open feature branches** vs `master`. Update when branches merge, rebase, or new work starts.

**Base:** `master` @ `3fad335` — *Complete modal migration across remaining UI surfaces.*

**Related:** [AGENT_STATUS.md](./AGENT_STATUS.md) · [OWNERSHIP.md](./OWNERSHIP.md)

_Last updated: 2026-05-29 (Coordinator v2)._

---

## Recommended merge order

| Order | Branch | Rationale |
|-------|--------|-----------|
| **1** | `feature/modal-blur-consistency` | Small UI-only delta on top of current master modal work; low conflict risk. |
| **2** | `feature/login-landing-redesign` | Login/register + E2E touch auth routes; merge after modal scrim so overlay UX is stable. |
| **3** | `feature/firebase-pipeline` | Drizzle journal, deploy workflow, large `package-lock` — **wait until Cloud SQL / deploy path is confirmed**; rebase immediately before merge. |
| **—** | `feature/admin-health-usage` | **Pause** — diverged from master (3↔3); branch mixes admin dashboard + scan phases; rebase or split before queueing. |
| **—** | `merge-scan-to-add` | **Pause** — integration branch (4↔4 diverged); resolve via `feature/scan-to-add` strategy instead of direct merge. |

---

## Active queue (commits ahead of `master`)

| Branch | Feature | Status | Tests (if known) | Conflict risk | Notes |
|--------|---------|--------|------------------|---------------|-------|
| `feature/modal-blur-consistency` | Unify modal scrim blur on overlay dismiss layers | Ready for review / merge | Not run this session | **Low** — `app.css`, `Modal.svelte`, nav/menus | 1 commit ahead; based on current `master`. |
| `feature/login-landing-redesign` | Product-style login landing + auth shell | In progress (1 commit ahead) | E2E auth specs touched — run `npm run test:e2e` before merge | **Medium** — `login/**`, `register/**`, shared auth components, `e2e/auth.spec.ts` | Rebase onto latest `master` before merge PR. |
| `feature/firebase-pipeline` | Drizzle `_journal.json` fix + GitHub Firebase deploy pipeline | Open; **not** on `master` | Add/run `migrations.test.ts` + CI when merging | **High** — `package-lock.json`, `drizzle/meta`, `.github/workflows`, `apphosting.yaml` | User **Cloud SQL setup in progress** — infra blocker. |
| `feature/admin-health-usage` | Admin health/usage dashboard (+ accidental scan WIP on branch) | **Stale / diverged** | Unknown | **High** — admin routes, `init.ts`, scan routes | Rebase onto `master` or extract admin-only commits. |

---

## At `master` tip (no unique commits vs local `master`)

These local branches match `master` (already merged or reset); safe to delete locally after verification:

| Branch | Notes |
|--------|--------|
| `feature/modal-ux-redesign` | Modal molecule migration landed on `master`. |
| `feature/multi-pantry` | Merged (`e9ca504`). |
| `feature/scan-to-add` | Aligned with `origin/feature/scan-to-add` / master. |
| `feature/shopping-list` | Aligned with remote. |
| `feature/unified-page-layout` | Aligned with remote. |
| `fix/app-crash` | Fix merged via master history. |
| `fix/login-admin` | On master. |

---

## Other local / remote branches (not in active queue)

| Branch | Ahead of master | Notes |
|--------|-----------------|-------|
| `merge-scan-to-add` | 4 (diverged 4↔4) | Merge integration attempt — do not merge until scan feature plan is explicit. |
| `chore/dev-runtime`, `feat/*`, older `feature/*`, `fix/*` | 0 or stale on remote | See `git branch -a`; most are historical or worktree leftovers. |
| `docs/agent-coordination` | Stale | Superseded by Coordinator v2 docs on `chore/coordinator-v2`. |

---

## Pre-merge checklist (each PR)

1. Rebase onto latest `master`.
2. `npm test && npm run test:integration && npm run check`
3. Touching auth/login: `npm run test:e2e`
4. Touching drizzle/deploy: run migration tests; confirm Firebase / Cloud SQL secrets with user.
5. User approval: **`Approved to push [branch-name]`** before push (see OWNERSHIP).
