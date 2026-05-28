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
| AI features | `home-pantry` | `feat/openai-enhancements` | OpenAI /inkop |
| Admin UI | `home-pantry-admin` | `feature/admin-interface` | Admin panel |
| Tests | `home-pantry-tests` | `feat/integration-test-suite` | Vitest + integration |

```powershell
git worktree list
```

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
