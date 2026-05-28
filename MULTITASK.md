# Multitask coordination

Agent branches are merged into **`master`** for this repo phase. Worktrees may still exist locally for parallel work.

**Coordination docs:** [AGENT_STATUS.md](./AGENT_STATUS.md) (live agent/branch status) · [OWNERSHIP.md](./OWNERSHIP.md) (file ownership and shared-area rules)

## Safety backup

| Ref | Commit | Contents |
|-----|--------|----------|
| `backup/wip-before-worktree-split` | `81118eb` | Full combined WIP before worktree split |

## Worktrees (optional local)

| Agent | Path | Branch |
|-------|------|--------|
| **Dev runtime** | `home-pantry-dev` | `chore/dev-runtime` |
| AI features | `home-pantry` | `feat/openai-enhancements` |
| Admin UI | `home-pantry-admin` | `feature/admin-interface` |
| Tests | `home-pantry-tests` | `feat/integration-test-suite` |

## Dev runtime

- `npm run dev:watch` — auto-restart on `.env`, hooks, DB, drizzle
- `npm run dev:start:ai` — start dev server (usual)
- `npm run dev:health` — ping localhost:5173
- **Do not ask the user to restart manually** when `dev:watch` is running

## Checks on master

| Area | Commands |
|------|----------|
| Tests | `npm test`, `npm run test:integration` |
| Types | `npm run check` |
| E2E | `npx playwright install chromium`, then `npm run test:e2e` |
| Admin | `/admin` (admin user via `.env` `ADMIN_*`) |
| AI | `/inkop` (`OPENAI_API_KEY`) |

**Before push:** `npm test && npm run test:integration && npm run check && npm run test:e2e`
