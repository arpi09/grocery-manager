# Agent status

Live coordination board for parallel agents and feature branches. **Update this file** when starting, finishing, rebasing, or blocking.

**Related:** [OWNERSHIP.md](./OWNERSHIP.md) · [MULTITASK.md](./MULTITASK.md)

_Last verified with git: 2026-05-28 (local). Re-verify before merge/push._

---

## Coordinator rules (all agents)

| Rule | Detail |
|------|--------|
| **Push** | No push unless the user says exactly: `Approved to push [branch-name]` |
| **Scope** | Stop and request approval before editing outside [OWNERSHIP.md](./OWNERSHIP.md) |
| **Sync** | `git fetch origin` and rebase onto `origin/master` often; small, frequent commits |
| **Worktrees** | Propose new worktrees/agents with scope and conflict risk; **never create without approval** |
| **Dev runtime** | Ops only (`dev:watch`, health, migrations run report) — no feature code, merge, or push |

**Status report format:** Agent · Branch/worktree · Task · Files · Last commit · Last pull/rebase · Tests · Conflict risk · Ready for review · Next step

---

## Base branch

| Item | Value |
|------|--------|
| **Integration branch** | `master` @ `dda14b4` — _Merge branch 'feat/openai-enhancements' into master_ |
| **Remote** | `origin/master` (in sync with local `master` at last check) |
| **Safety ref** | `backup/wip-before-worktree-split` @ `81118eb` |

---

## Worktrees (isolated checkouts)

| Agent / role | Worktree path | Branch | Last commit | Last pull/rebase | Current task | Files changed | Blockers | Ready | Tests | Conflict | Next step |
|--------------|---------------|--------|-------------|------------------|--------------|---------------|----------|-------|-------|----------|-----------|
| **Main / feature** | `C:\Users\ArvidPilhall\Projects\home-pantry` | `feature/user-profile` (checkout) · `master` = `dda14b4` | `dda14b4` on branch tip; **large uncommitted WIP** | TBD | Profile menu + mixed WIP (analytics, theme, household tests) | See status below | Shares `AppHeader`, schema, inventory with other agents | **N** | Not run on WIP | **High** | Split WIP into branches; commit per feature; rebase on `master` |
| **Admin UI** | `home-pantry-admin` | `feature/admin-interface` | `5d2600f` Add admin interface… | Synced with `origin/feature/admin-interface` | Maintenance / error-logs follow-up | see branch | — | **Y** (merged to master) | TBD | Low | Rebase admin worktree if extending error logs |
| **Tests** | `home-pantry-tests` | `feat/integration-test-suite` | `ca8ef5c` Add Vitest unit and integration… | Synced with `origin` | Test suite ownership | see branch | — | **Y** (merged to master) | TBD | Low | Add tests for new features on this worktree |
| **Dev runtime** | `home-pantry-dev` | `chore/dev-runtime` | `449804e` Add Cursor dev-runtime subagent… | Synced with `origin/chore/dev-runtime` | Keep `dev:watch` / health running | `scripts/dev-runtime/**`, dev scripts | — | **Y** | `dev:health` | Low | Ops only — no feature edits |
| **E2E** | `home-pantry-e2e` | `feat/e2e-playwright` | `343de79` Document E2E setup… | **Ahead 2** of `origin/master` | Playwright smoke tests | `e2e/**`, `playwright.config.ts`, E2E docs | Not on `origin` yet | **Y** | Agent reported green (local) | Med | User approval to push `feat/e2e-playwright` |
| **AI / OpenAI** | `home-pantry` (shared) | `feat/openai-enhancements` | `e202b9b` Cursor rule: no manual dev restarts | Synced with `origin` | `/inkop`, recipes, image scan | see branch | Merged into `master`; branch may lag | **Y** | TBD | Low | Use for AI-only follow-ups |

---

## Main worktree — uncommitted snapshot (`feature/user-profile`)

> **Note:** Checkout is `feature/user-profile` but tip equals `master` (`dda14b4`). Many agents' work appears **uncommitted in one tree** — high conflict risk until split.

| Area | Paths (summary) |
|------|-----------------|
| Profile | `AppHeader`, `HeaderProfileMenu`, `profile.service*`, `routes/profile`, `drizzle/0004_user_profile.sql` |
| Theme | `theme.ts`, `theme-cookie.ts`, `theme.schemas.ts`, `drizzle/0005_user_theme_preference.sql` |
| Analytics | `AnalyticsDashboard.svelte`, `inventory-analytics*`, `routes/statistik/` |
| Household | `household.inventory.integration.test.ts`, inventory service/repo/schema |
| Inventory tests | `inventory.*.test.ts`, `integration-db.ts` |

| Field | Value |
|-------|--------|
| Blockers | Overlapping ownership — see [OWNERSHIP.md](./OWNERSHIP.md); admin-error-logs branch missing |
| Last pull/rebase | TBD |
| Test status | TBD (run `npm test`, `npm run check` before review) |
| Recommended next step | 1) Commit or branch per feature 2) Rebase each onto `master` 3) Resolve `AppHeader` / schema conflicts once |

---

## Feature branches (no dedicated worktree)

| Agent / role | Branch | Exists | Last commit | vs `master` | Task | Ready | Tests | Conflict | Next step |
|--------------|--------|--------|-------------|-------------|------|-------|-------|----------|-----------|
| **Expiring soon** | `feature/expiring-soon-home` | Yes | `62198f5` Show prominent Går ut snart… | ahead **2**, behind **2** | Home dashboard expiry section | **Y** | TBD | Med | Rebase onto `master`, run tests, merge or push after approval |
| **Nav redesign** | `feature/nav-redesign` | **No local branch** | TBD | — | Agent reported **done** | TBD | TBD | Med | Locate commits or recreate branch; merge before profile header conflicts |
| **Shared household** | `feature/shared-household` | **Missing** | TBD | — | In progress (background) | **N** | TBD | **High** (schema, inventory) | Create branch from `master` after approval; avoid editing main WIP |
| **Dark theme** | `feature/profile-dark-theme` | **Missing** | TBD | — | In progress (background) | **N** | TBD | Med | Branch from `master`; theme files overlap main WIP |
| **Analytics** | `feature/analytics-page` | Yes (at `dda14b4`) | same as `master` | even | `/statistik` dashboard | **N** (uncommitted on main) | TBD | Med | Commit on dedicated branch; one agent on `routes/statistik` |
| **User profile** | `feature/user-profile` | Yes | `dda14b4` | even | Profile menu + edit page | **N** (WIP uncommitted) | TBD | **High** | Finish commit; coordinate with nav-redesign |
| **Admin error logs** | `feature/admin-error-logs` | **Missing** | TBD | — | Admin error logging UI | **N** | TBD | Low–Med | Agent reported code ready — **commit on new branch** from `master` |
| **OpenAI** | `feat/openai-enhancements` | Yes | `e202b9b` | behind `master` (merged) | AI features | **Y** | TBD | Low | Archive or delete after merge hygiene |

---

## Background / ephemeral agents

| Agent | Branch / ref | Status | Notes |
|-------|--------------|--------|-------|
| Expiring-soon | `feature/expiring-soon-home` | **Done** (branch exists) | Ready after rebase + test |
| Nav-redesign | `feature/nav-redesign` | **Done** (reported) | Branch not found locally — **TBD** |
| Push-all | `be703393` | **TBD** | Commit **not found** in repo — agent may have finished or hash typo |
| Shared household | `feature/shared-household` | **In progress** | No branch yet; WIP may be on main worktree |
| Dark theme | `feature/profile-dark-theme` | **In progress** | No branch yet; theme files on main worktree |
| Analytics | `feature/analytics-page` | **In progress** | `statistik` route on main worktree (uncommitted) |
| Profile menu | `feature/user-profile` | **In progress** | Active checkout; uncommitted |
| Admin error logs | `feature/admin-error-logs` | **Done** (uncommitted) | Commit to branch — blocker was git in agent shell |

---

## Integration queue (suggested order)

1. `feature/expiring-soon-home` — rebase, test, merge to `master`
2. `feature/nav-redesign` — locate/restore branch, merge (before header churn)
3. `feature/admin-error-logs` — commit, review, merge
4. `feat/e2e-playwright` — push after approval; keep E2E green on `master`
5. Split main WIP → `feature/user-profile`, `feature/analytics-page`, `feature/profile-dark-theme`, `feature/shared-household`
6. `chore/dev-runtime` — merge dev scripts if not already on `master`

---

## Quick commands

```powershell
$git = "C:\Users\ArvidPilhall\AppData\Local\Programs\Git\cmd\git.exe"
& $git -C "C:\Users\ArvidPilhall\Projects\home-pantry" worktree list
& $git -C "C:\Users\ArvidPilhall\Projects\home-pantry" fetch origin
& $git -C "C:\Users\ArvidPilhall\Projects\home-pantry" rebase origin/master
```
