# Agent status

Live coordination board for parallel agents and feature branches.

**Related:** `OWNERSHIP.md` · `MULTITASK.md`

_Last verified: 2026-05-28 (local). All agent WIP merged to `master` and pushed._

---

## Coordinator rules

| Rule | Detail |
|------|--------|
| **Push** | Only after: `Approved to push [branch-name]` |
| **Dev runtime** | `dev:watch` in main worktree — no manual restart needed |

---

## Base branch

| Item | Value |
|------|--------|
| **master / origin/master** | `5d8b498` — integrated E2E, household scope, profile, analytics, nav redesign, theme |
| **integrate/agent-wip** | Merged into master (same tip after merge) |

---

## Merge summary (2026-05-28)

| Source | Content merged |
|--------|----------------|
| `chore/e2e-on-master` | Playwright smoke, CI gate, AGENTS-E2E |
| `docs/agent-coordination` | `OWNERSHIP.md`, coordination docs |
| Stash `@{4}` + profile/household WIP | Shared household (`0003`), profile (`0004`), error log (`0005`), theme (`0006`) |
| Stash `@{2}` | Dark theme shell, household-scoped inventory, settings |
| Stash `@{0}` | Analytics `/statistik`, inventory analytics service |
| Nav redesign | `MainNav`, `nav-config`, profile menu |

**PGlite migrations (incremental):** `0003_household` → `0004_user_profile` → `0005_app_error` → `0006_user_theme_preference` (idempotent runner in `init.ts`).

---

## Test gate (master)

| Command | Result |
|---------|--------|
| `npm test` | ✅ 45 tests |
| `npm run test:integration` | ✅ 4 tests |
| `npm run check` | ✅ 0 errors |
| `npm run test:e2e` | ✅ 7 tests |

---

## Stashes (5 — keep until verified)

| Stash | Note |
|-------|------|
| `stash@{0}`–`@{4}` | Content largely on master; verify before `git stash drop` |

---

## Env vars (local dev)

Set in `.env` (see `.env.example`):

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin
- `DEFAULT_MEMBER_EMAIL` / `DEFAULT_MEMBER_PASSWORD` — shared household demo member
- `USE_PGLITE=true` — local embedded DB

After pull: reload app; if migrations fail on old PGlite data, remove `data/pantry/` once.
