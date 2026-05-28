# Multitask coordination

## Worktrees

| Agent | Path | Branch |
|-------|------|--------|
| **Dev runtime** | `home-pantry-dev` | `chore/dev-runtime` |
| AI features | `home-pantry` | `feat/openai-enhancements` |
| Admin UI | `home-pantry-admin` | `feature/admin-interface` |
| Tests | `home-pantry-tests` | `feat/integration-test-suite` |

```powershell
git worktree list
```

## Dev runtime agent

See **`AGENTS-DEV-RUNTIME.md`**.

- Keeps `dev:watch` running; restarts on env / hooks / DB / drizzle changes.
- Use `npm run dev:start:ai` (or `:admin`, `:tests`) to run the correct worktree.
- Use `npm run dev:health` to verify http://localhost:5173 responds.
- **Do not ask the user to restart manually** unless the port is blocked or boot fails.

## Other agents

- Product code: AI / Admin / Tests worktrees only.
- **No push** until: `Approved to push [branch name]`.
