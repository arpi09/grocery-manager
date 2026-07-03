# AI tooling — Cursor + Claude Code

Guide för att köra Skaffu med AI-agenter i **Cursor** eller **Claude Code** med samma repo-konfiguration.

## Snabbstart (båda verktygen)

```bash
git clone https://github.com/arpi09/grocery-manager.git
cd grocery-manager   # eller home-pantry lokalt
npm ci
npm run setup:agent
npm run verify:ai-tooling
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173).

`setup:agent` kopierar `.env.example` → `.env`, sätter PGlite/Turnstile-dev-defaults, kör migrate och **synkar** `.cursor/` → `.claude/` (agents, skills, rules).

## Paritetstabell

| Steg | Cursor | Claude Code |
|------|--------|-------------|
| Agent entry | [`AGENTS.md`](../AGENTS.md) | [`CLAUDE.md`](../CLAUDE.md) → AGENTS.md |
| Öppna projekt | Workspace root | `claude` i reporoten |
| Project rules | [`.cursor/rules/`](../.cursor/rules/) | [`.claude/rules/`](../.claude/rules/) (synkade) |
| Subagenter | [`.cursor/agents/`](../.cursor/agents/) + Task | [`.claude/agents/`](../.claude/agents/) + `/agents` |
| Skills | [`.cursor/skills/`](../.cursor/skills/) | [`.claude/skills/`](../.claude/skills/) (synkade) |
| Dev-server | `npm run dev` | `npm run dev` |
| Dev health | `npm run dev:health` | `npm run dev:health` |
| Verifiera setup | `npm run verify:ai-tooling` | Samma |
| User rules (konto) | Cursor Settings → Rules | Claude user prefs / `~/.claude/` |
| User rule-mall | [`docs/templates/AI_USER_RULES_SNIPPET.md`](templates/AI_USER_RULES_SNIPPET.md) | Samma snippet |

## Dev-server

**Minimum (alla plattformar):**

```bash
npm run dev
```

Auto-restart vid `.env` / hooks / DB:

```bash
npm run dev:watch
```

**Windows (valfritt, worktrees):**

```powershell
npm run dev:start:ai    # sibling worktree home-pantry-dev
npm run dev:health
```

**Mac/Linux:**

```bash
npm run dev:start       # sh wrapper → dev:watch i repo root
npm run dev:health      # node HTTP check
```

Worktrees (`home-pantry-dev`, `-admin`, `-tests`) är **avancerat** — se [`AGENTS-DEV-RUNTIME.md`](../AGENTS-DEV-RUNTIME.md).

## Synk och verifiering

| Script | Syfte |
|--------|--------|
| `npm run sync:ai-tooling` | Kopiera agents/skills, generera rules från `.cursor/rules/` |
| `npm run verify:ai-tooling` | Fail om CLAUDE.md, agents, skills eller rules saknas |

Kör `sync:ai-tooling` efter du ändrat `.cursor/agents/`, `.cursor/skills/` eller allowlistade rules.

## Single source of truth

| Innehåll | Authoritative | Genererat |
|----------|---------------|-----------|
| Subagenter | `.cursor/agents/` | `.claude/agents/` |
| Skills | `.cursor/skills/` | `.claude/skills/` |
| Kritiska regler | `.cursor/rules/*.mdc` (allowlist) | `.claude/rules/*.md` |
| Entry docs | `AGENTS.md` + `CLAUDE.md` | — (båda committade) |

Coordinator-regler (`coordinator-v2`, `security-agent`, …) finns bara i Cursor + [`CURSOR_COORDINATOR.md`](CURSOR_COORDINATOR.md).

## Cloud / Linux agents

Se [`CLOUD_AGENT_SETUP.md`](CLOUD_AGENT_SETUP.md) — `npm run dev`, inte PowerShell worktrees.

## Mer läsning

- [`ONBOARDING_DEVELOPER.md`](ONBOARDING_DEVELOPER.md) — ny utvecklare
- [`INDEX.md`](INDEX.md) — agent index
- [`CURSOR_COORDINATOR.md`](CURSOR_COORDINATOR.md) — coordinator, WIP, deploy
