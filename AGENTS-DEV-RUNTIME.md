# Dev runtime agent

**Worktree:** `C:\Users\ArvidPilhall\Projects\home-pantry-dev`  
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
2. Start server in background for the worktree the user is testing (usually **ai**):

   ```powershell
   npm run dev:start:ai
   ```

3. After other agents change env/hooks/DB, confirm restart via nodemon logs or:

   ```powershell
   npm run dev:health
   ```

4. If port 5173 is stuck, report once — do not ask the user to restart manually unless kill is required.

## Checks before done

- `npm run dev:health` exits 0 while `dev:watch` is running
- Scripts run on Windows PowerShell

## Commits

Small commits (scripts → package.json → docs). **No push** until: `Approved to push chore/dev-runtime`.
