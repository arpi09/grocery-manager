# Agent status

Live coordination board for parallel agents and feature branches.

**Coordinator:** v2 — see [MERGE_QUEUE.md](./MERGE_QUEUE.md) for merge order; max **3** implementation agents in flight.

**Related:** [OWNERSHIP.md](./OWNERSHIP.md) · [MULTITASK.md](./MULTITASK.md) · [.cursor/rules/coordinator-v2.mdc](./.cursor/rules/coordinator-v2.mdc) · [DELIVERY_METRICS.md](./DELIVERY_METRICS.md)

_Last verified: 2026-05-29 (local)._

---

## Coordinator v2 (this repo)

| Rule | Detail |
|------|--------|
| **Agent creation** | **Coordinator only** — no implementation agent or worktree spawned by feature agents. |
| **WIP limit** | Max **3** concurrent implementation agents (excluding dev-runtime ops). |
| **Merge queue** | Single source of truth: [MERGE_QUEUE.md](./MERGE_QUEUE.md). |
| **Push** | Only after: `Approved to push [branch-name]` |
| **Dev runtime** | `dev:watch` in main worktree — no manual restart needed |
| **Delivery metrics** | Coordinator updates [DELIVERY_METRICS.md](./DELIVERY_METRICS.md) after merge / weekly checkpoint |

---

## Active work summary (WIP: 3 / 3)

| Slot | Branch | Focus | Status |
|------|--------|-------|--------|
| 1 | `feature/modal-blur-consistency` | Modal scrim blur unification | Ready to merge (1 commit ahead of `master`) |
| 2 | `feature/login-landing-redesign` | Login landing redesign | In progress (1 commit ahead) |
| 3 | `feature/firebase-pipeline` | Drizzle journal + Firebase CI deploy | **Blocked** — user Cloud SQL setup in progress |

**Paused (do not start new agents until a slot frees):** `feature/admin-health-usage` (diverged), `merge-scan-to-add` (integration branch).

---

## Blockers

| Blocker | Owner | Impact |
|---------|-------|--------|
| **Cloud SQL / Firebase deploy path** | User | Holds merge of `feature/firebase-pipeline` and production DB validation |
| **Diverged branches** | Coordinator | `feature/admin-health-usage`, `merge-scan-to-add` need rebase/split before new impl work |

---

## Recently merged to master

| Branch | Notes |
|--------|--------|
| Modal UX | Shared `Modal` molecule + migration (`5d4045e`, `3fad335`) |
| `feature/multi-pantry` | Multi-pantry support (`e9ca504`) |
| `chore/firebase-project-home-pantry-4bee5` | Firebase project id `home-pantry-4bee5` |
| `feature/pantry-invites-roles` | Invites + owner/editor/viewer roles, migration `0007` |

---

## Base branch

| Item | Value |
|------|--------|
| **master / origin.master** | `ee8fcd7` (pre-delivery-metrics merge) |
| **Coordinator docs branch** | `chore/coordinator-v2` (merged) |
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

## Branches aligned with master (no open commits)

`feature/shopping-list`, `feature/scan-to-add`, `feature/unified-page-layout`, `feature/modal-ux-redesign`, `fix/app-crash`, `fix/login-admin` — see [MERGE_QUEUE.md](./MERGE_QUEUE.md).

---

## Historical / stale (no active agent)

| Branch | Notes |
|--------|--------|
| `feature/admin-interface` | Admin UI worktree legacy |
| `feat/integration-test-suite` | Largely on master |
| `docs/agent-coordination` | Superseded by Coordinator v2 |
| `feat/e2e-playwright` | Stale E2E docs branch |
