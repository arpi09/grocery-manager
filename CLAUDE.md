# CLAUDE.md — Skaffu (Claude Code entry)

Claude Code startpunkt. Läs denna fil **före** bred kod-sökning.

## Läsordning

1. **Denna fil** — snabborientering
2. [`AGENTS.md`](AGENTS.md) — full agent entry (features, G0, deploy)
3. [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) — feature → routes → nyckelfiler
4. [`docs/CURRENT_REALITY.md`](docs/CURRENT_REALITY.md) — prod SHA, nav, flags, Tier C
5. [`docs/AI_TOOLING.md`](docs/AI_TOOLING.md) — Cursor vs Claude Code parity

## Bootstrap

```bash
npm ci && npm run setup:agent && npm run dev
```

Verifiera AI-setup: `npm run verify:ai-tooling`

## Always-on policies

- **Dev server:** be aldrig användaren starta om manuellt — kör `npm run dev` eller delegera till subagenten `dev-runtime`.
- **Cost mode:** max 1 subagent per request; default `npm run quick:dev` (inte `pr:gate` efter varje edit).
- **Tier C frozen:** pausa grannskafferiet, Kivra forward, Stripe/Pro, meal-AI hero utan explicit user request.
- **Deploy:** claim aldrig prod utan grön Deploy workflow + smoke — skill `/skaffu-deploy-verify`.

## Subagenter (`.claude/agents/`)

| Agent | När |
|-------|-----|
| `dev-runtime` | Håll dev-server igång, `dev:health` efter env/DB-ändringar |
| `e2e` | Playwright i `e2e/` |

## Skills (`.claude/skills/`)

`/skaffu-deploy-verify` · `/skaffu-core-loop-change` · `/skaffu-release-model` · `/skaffu-prod-error-autofix` · `/skaffu-ship` · `/skaffu-coordinator`

Coordinator-session: starta med `/skaffu-coordinator` (bootar roll + CURRENT_REALITY — ingen inklistrad rollprompt behövs). Leverans till master: `/skaffu-ship`.

## G0

| När | Kommando |
|-----|----------|
| Under arbete | `npm run quick:dev` |
| Innan merge | `npm run pr:gate` |

Se [`AGENTS.md`](AGENTS.md) för feature-routing ("jag ska fixa X") och coordinator-detaljer.
