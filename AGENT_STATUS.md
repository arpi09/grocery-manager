# Agent status

Live coordination board for parallel agents and feature branches.

**Related:** `OWNERSHIP.md` · `MULTITASK.md` · [DELIVERY_METRICS.md](./DELIVERY_METRICS.md)

_Last verified: 2026-05-29 (local). **`feature/scan-to-add`**: Phase 1–3 (streckkod, kvitto, snabbstart) — not pushed._

---

## Coordinator rules

| Rule | Detail |
|------|--------|
| **Push** | Only after: `Approved to push [branch-name]` |
| **Dev runtime** | `dev:watch` in main worktree — no manual restart needed |
| **Delivery metrics** | Coordinator updates [DELIVERY_METRICS.md](./DELIVERY_METRICS.md) after merge / weekly checkpoint |

---

## Recently merged to master

| Branch | Notes |
|--------|--------|
| `chore/firebase-project-home-pantry-4bee5` | Firebase project id `home-pantry-4bee5` (`.firebaserc`, `apphosting.yaml`) |
| `feature/pantry-invites-roles` | Invites + owner/editor/viewer roles, migration `0007` |

---

## Base branch

| Item | Value |
|------|--------|
| **master / origin.master** | `26ba088` |
| **feature/scan-to-add** | `/scan`, `/scan/kvitto`, `/scan/snabbstart` — MVP scan roadmap |

---

## PGlite migrations (incremental)

`0003_household` → … → **`0007_household_invites_roles`** → **`0008_shopping_list`**

Idempotent runner in `init.ts`. After pull on old PGlite data: remove `data/pantry/` once if migrations fail.

---

## Env vars (local dev)

Set in `.env` (see `.env.example`):

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin
- `DEFAULT_MEMBER_EMAIL` / `DEFAULT_MEMBER_PASSWORD` — shared household demo member (seeded as **editor**)
- `USE_PGLITE=true` — local embedded DB

---

## Active feature branch

| Branch | Status |
|--------|--------|
| `feature/shopping-list` | Household-scoped inköpslista at `/inkop` (tab Inköpslista + AI & ICA), migration `0008_shopping_list.sql` |

---

## Other branches (parallel)

| Branch | Status |
|--------|--------|
| `feature/admin-health-usage` | Admin hälsa & användning — utökade dashboard-kort på `/admin` |
| `feature/admin-interface` | Admin UI (worktree `home-pantry-admin`) - not on master |
| `feat/integration-test-suite` | Test worktree - largely on master |
| `docs/agent-coordination` | Stale (1 commit, 22 behind) |
| `feat/e2e-playwright` | Stale E2E docs (2 ahead, 22 behind) |
