# AI user rules snippet (cost mode)

Copy into **Cursor Settings → Rules → User Rules** or Claude Code user preferences.
Not committed to your account automatically — paste once per machine/account.

## English

```
Personal cost mode: max 1 subagent per request. No Multitask unless I say parallel. Default `quick:dev` not `pr:gate`. New chat for new features. No explore subagents — use grep/read in main agent via AGENTS.md and CODEBASE_MAP.
```

## Svenska

```
Kostnadsläge: max 1 subagent per förfrågan. Ingen Multitask om jag inte säger parallel. Kör `quick:dev` som standard, inte `pr:gate`. Ny chat per nytt featureområde. Inga explore-subagenter — använd grep/read via AGENTS.md och CODEBASE_MAP.
```

## Repo defaults (already in git)

These are reinforced by project rules — the snippet above adds account-level backup:

- [`.cursor/rules/personal-cost-always.mdc`](../.cursor/rules/personal-cost-always.mdc)
- [`.claude/rules/personal-cost-always.md`](../.claude/rules/personal-cost-always.md) (after `npm run sync:ai-tooling`)
