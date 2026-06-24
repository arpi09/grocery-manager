# Dev runtime agent

**Worktree:** `$SKAFFU_ROOT-dev` (sibling of main repo; `ai` maps to main root)  
**Branch:** `chore/dev-runtime`

## Purpose

Keep the local dev server running with automatic restarts. Do **not** implement product features.

## Scope (only touch)

- `scripts/dev-runtime/**`
- `package.json` / `package-lock.json` — `dev`, `dev:watch`, `dev:health`, `dev:start:*` scripts and `nodemon` devDependency
- `nodemon.dev.json` (optional)
- `MULTITASK.md` — Dev runtime / worktree table sections only
- `README.md` — short “Local dev” subsection only

## Out of scope

- `src/routes/**`, `src/lib/application/**`, admin, AI, tests (other agents)
- `.env` contents (user-owned; never commit)

## Default workflow

1. `git fetch origin && git rebase origin/master`
2. Set `SKAFFU_ROOT` to your main clone if not using default git root detection.
3. Start server in background for the worktree the user is testing (usually **ai** = main repo):

   ```powershell
   npm run dev:start:ai
   ```

   Sibling worktrees: `home-pantry-dev`, `home-pantry-admin`, `home-pantry-tests`.

4. After other agents change env/hooks/DB, confirm restart via nodemon logs or:

   ```powershell
   npm run dev:health
   ```

5. If port 5173 is stuck, report once — do not ask the user to restart manually unless kill is required.

## Checks before done

- `npm run dev:health` returns OK for the target worktree URL.
