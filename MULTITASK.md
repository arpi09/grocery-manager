# Multitask coordination

## Safety backup (nothing lost)

| Ref | Commit | Contents |
|-----|--------|----------|
| `backup/wip-before-worktree-split` | `81118eb` | **Full** combined WIP (admin + tests + AI + uncommitted) |
| `backup/wip-before-worktree-split-tag` | `81118eb` | Same, tagged |

To inspect or recover any file:

```powershell
git show backup/wip-before-worktree-split:path/to/file
git checkout backup/wip-before-worktree-split -- path/to/file
```

## Worktrees

| Agent | Path | Branch | Latest commit |
|-------|------|--------|---------------|
| **Dev runtime** | `home-pantry-dev` | `chore/dev-runtime` | Auto-restart dev server |
| AI features | `home-pantry` | `feat/openai-enhancements` | OpenAI /inkop |
| Admin UI | `home-pantry-admin` | `feature/admin-interface` | Admin panel |
| Tests | `home-pantry-tests` | `feat/integration-test-suite` | Vitest + integration |

```powershell
git worktree list
```

## Dev runtime agent

**Worktree:** `C:\Users\ArvidPilhall\Projects\home-pantry-dev` · **Branch:** `chore/dev-runtime`  
Charter: `AGENTS-DEV-RUNTIME.md` (in dev worktree).

Starts and monitors the dev server — **you should not restart manually** when other agents change env/DB/hooks.

```powershell
cd C:\Users\ArvidPilhall\Projects\home-pantry-dev
npm run dev:start:ai    # dev:watch on the AI worktree (usual)
npm run dev:health      # ping localhost:5173
```

## Dev server (all agents)

| Command | When |
|---------|------|
| `npm run dev:watch` | **Default for local dev.** Restarts Vite when `.env`, `hooks.server.ts`, DB init/seed, or `drizzle/` change. |
| `npm run dev` | Plain Vite (fine if you only edit UI; HMR handles most `.svelte` / route changes). |

### What reloads without restart

- Most `.svelte`, CSS, and many `+page` / `+server` edits → Vite HMR.

### What needs a restart (handled by `dev:watch`)

- `.env` (e.g. `ADMIN_PASSWORD`, `OPENAI_API_KEY`)
- `src/hooks.server.ts`
- `src/lib/infrastructure/db/**` (init, seed, schema)
- `drizzle/*.sql`

### Agent duty

1. If no dev server is running in the project terminal, start **`npm run dev:watch`** in the background (not `dev` only).
2. After changing env / hooks / DB / migrations, **do not ask the user to restart** — `dev:watch` does it.
3. Only ask the user if the server failed to start (port in use, crash on boot).

## Rules

- Stay in assigned paths; stop if you need a file owned by another agent.
- Rebase on `origin/master` often: `git fetch origin && git rebase origin/master`
- Small, frequent commits; **no push** until: `Approved to push [branch name]`
- Never merge into `master` from agent branches.

## First-time setup per new worktree

```powershell
cd C:\Users\ArvidPilhall\Projects\home-pantry-tests   # or -admin
npm ci
```

## Checks

| Worktree | Commands |
|----------|----------|
| Tests | `npm test`, `npm run test:integration` |
| Admin | `npm test`, manual `/admin` |
| AI | `npm test`, `npm run check`, manual `/inkop` |

## Shared files (coordinate before editing)

- `AppHeader.svelte` — admin vs AI nav
- `hooks.server.ts` — admin guard + activity
- `README.md`, `package.json`, drizzle migrations
