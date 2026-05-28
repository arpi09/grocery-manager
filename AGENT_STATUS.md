# Agent status

Live coordination board for parallel agents and feature branches.

**Related:** `OWNERSHIP.md` (on `docs/agent-coordination` @ `d59cbfd`) · `MULTITASK.md`

_Last verified: 2026-05-28 (local). Re-verify before merge/push._

---

## Coordinator rules

| Rule | Detail |
|------|--------|
| **Push** | Only after: `Approved to push [branch-name]` |
| **Dev runtime** | `dev:watch` in main worktree — no manual restart needed |

---

## 500 error (resolved)

| Item | Detail |
|------|--------|
| **Symptom** | HTTP 500 on `/login` and all pages |
| **Root cause** | Uncommitted WIP added `drizzle/0003_household.sql` with non-idempotent `ADD CONSTRAINT`, listed in `PGlite_INCREMENTAL_MIGRATIONS`, and migrations ran **twice** per boot (`openPglite` + `initDatabase`). Every dev restart re-applied constraints → PGlite error `constraint … already exists`. |
| **Fix applied** | Main worktree reset to clean `master` (`62198f5`). `init.ts`: removed duplicate `runPgliteIncrementalMigrations` in `initDatabase` (PGlite path). |
| **When restoring household/profile/theme WIP** | Make `0003_household.sql` constraints idempotent (`DO $$ … duplicate_object`) before re-adding to incremental list. |
| **Verify** | `curl http://localhost:5173/login` → **200**; logged-out `/` → **302** `/login` |

---

## Base branch

| Item | Value |
|------|--------|
| **master / origin/master** | `62198f5` — Går ut snart on home (expiring-soon merged & pushed) |
| **origin/feature/expiring-soon-home** | Same as master (`0` ahead / `0` behind) |

---

## Status by area

| Agent / area | Branch / worktree | Current task | Files changed | Last commit | Last pull/rebase | Test status | Conflict risk | Ready for review | Recommended next step |
|--------------|-------------------|--------------|---------------|-------------|------------------|-------------|---------------|------------------|----------------------|
| **Master / dev** | `master` @ main worktree | Clean; 500 fixed | `init.ts` (dup migration fix) | `62198f5` | In sync with `origin/master` | `npm test` ✅ 34; `npm run check` ✅ 0 errors | Low | **Y** (runtime) | Commit `init.ts` fix; split stashes into feature branches |
| **Expiring soon** | `feature/expiring-soon-home` | **Merged** | — | `62198f5` | Pushed = master | ✅ | Low | **Y** | Done |
| **E2E** | `feat/e2e-playwright` @ `home-pantry-e2e` | Playwright smoke | `e2e/**` | `343de79` | On origin | Agent-reported green | Med | **Y** | `Approved to push feat/e2e-playwright` |
| **Analytics** | `feature/analytics-page` @ `62198f5` | `/statistik` WIP in stash | stash@{0} (base `29ad7a5`) | Branch tip = master; analytics commit `29ad7a5` only in stash | — | TBD after pop | Med | **N** | Pop stash@{0} onto new branch from master; resolve conflicts |
| **User profile** | `feature/user-profile` @ `dda14b4` | Profile menu WIP | stash@{1}–@{3} | `dda14b4` (behind master) | Rebase needed | TBD | **High** | **N** | Rebase on `62198f5`; commit profile files only |
| **Shared household** | _(no branch)_ | Schema + inventory | Uncommitted was on master; see stashes | — | — | TBD | **High** | **N** | Create `feature/shared-household` from master; use idempotent `0003` |
| **Dark theme** | _(no branch)_ | Theme preference | Was mixed in master WIP | — | — | TBD | Med | **N** | Branch `feature/profile-dark-theme` after profile |
| **Nav redesign** | _(no branch)_ | Agent reported done | Unknown commits | TBD | — | TBD | Med | TBD | Locate commits or re-implement on branch |
| **Docs** | `docs/agent-coordination` | AGENT_STATUS / OWNERSHIP | `AGENT_STATUS.md`, `OWNERSHIP.md` | `d59cbfd` | — | N/A | Low | **Y** | Merge docs PR or copy this file to docs branch |
| **Dev runtime** | `chore/dev-runtime` @ `home-pantry-dev` | `dev:watch` | scripts | `449804e` | Synced | `dev:health` | Low | **Y** | Ops only |
| **Integration tests** | `feat/integration-test-suite` | Merged to master | — | `ca8ef5c` | — | ✅ | Low | **Y** | Add tests for new features |
| **Admin UI** | `feature/admin-interface` | Merged | — | `5d2600f` | — | TBD | Low | **Y** | — |

---

## Stashes (5)

| Stash | Branch context | Summary |
|-------|----------------|---------|
| `stash@{0}` | `feature/analytics-page` | Analytics + partial profile/household merge |
| `stash@{1}` | `feature/user-profile` | Push-all cleanup WIP (inventory/household-related) |
| `stash@{2}` | `feature/user-profile` | all-wip-before-analytics-clean |
| `stash@{3}` | `feature/user-profile` | wip before analytics |
| `stash@{4}` | `feature/expiring-soon-home` | pre-profile WIP |

**push-all:** Not run (requires per-branch approval).

---

## Merge order (recommended)

1. Keep **master** green (current state).
2. **feat/e2e-playwright** — push & PR after approval.
3. **feature/shared-household** — branch + idempotent migrations + tests.
4. **feature/user-profile** + **feature/profile-dark-theme** (rebase stashes).
5. **feature/analytics-page** from `stash@{0}` / `29ad7a5` content.
6. **docs/agent-coordination** — sync `AGENT_STATUS.md` / `OWNERSHIP.md`.
