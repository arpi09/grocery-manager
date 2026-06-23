# AGENTS.md — Skaffu agent entry

Cursor-standard startpunkt. Läs denna fil **före** bred kod-sökning.

## Läsordning

1. **Denna fil** — snabborientering
2. [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) — feature → routes → nyckelfiler (~15 features)
3. [`docs/CURRENT_REALITY.md`](docs/CURRENT_REALITY.md) — prod SHA, nav, flags, Tier C
4. [`docs/features/<feature>.md`](docs/features/) — djupdykning vid behov
5. [`ARCHITECTURE.md`](ARCHITECTURE.md) — lager, importregler, DI

## Lager (kort)

| Lager | Path | Regel |
|-------|------|-------|
| Domain | `src/lib/domain` | Inga framework-imports |
| Application | `src/lib/application` | Use cases, ports |
| Infrastructure | `src/lib/infrastructure` | Drizzle, repos, Lucia |
| Presentation | `src/routes`, `src/lib/components` | SvelteKit + Atomic Design |

Service-wiring: [`src/lib/server/di.ts`](src/lib/server/di.ts).

## G0 före push till master

```bash
npm run check:locales && npm run check && npm test
```

PR-gate (mer): `npm run gate:fast` — inkluderar `check:codebase-map`.

## Tier C / frozen

Pausa utan explicit user request: grannskafferiet, Kivra forward, Stripe/Pro, meal-AI hero, wrapped/statistik som primär yta.

→ [`.cursor/rules/skaffu-frozen-zones.mdc`](.cursor/rules/skaffu-frozen-zones.mdc) · [skaffu-core-loop.mdc](.cursor/rules/skaffu-core-loop.mdc)

## "Jag ska fixa X"

| Uppgift | Börja här |
|---------|-----------|
| Inköpslista / checkoff | [features/inkop.md](docs/features/inkop.md) |
| Skafferi / expiry | [features/inventory.md](docs/features/inventory.md) |
| Scan / kvitto / share_target | [features/scan-receipt.md](docs/features/scan-receipt.md) |
| Äta / veckoplan | [features/ata.md](docs/features/ata.md) |
| Onboarding → inkop | [features/onboarding.md](docs/features/onboarding.md) |
| Statistik / spend | [features/statistik.md](docs/features/statistik.md) |
| Settings / konto | [features/settings.md](docs/features/settings.md) |
| Household / delad lista | [features/household.md](docs/features/household.md) |
| Login / auth | [features/auth.md](docs/features/auth.md) |

## Deploy & prod

- Skills: `skaffu-deploy-verify`, `skaffu-core-loop-change`, `skaffu-release-model`
- Agent index: [`docs/INDEX.md`](docs/INDEX.md)
- Deploy: [`docs/DEPLOY.md`](docs/DEPLOY.md) · Smoke: [`docs/PROD_SMOKE.md`](docs/PROD_SMOKE.md)

## Kodnavigering

- Genererad route-lista: [`docs/generated/route-index.md`](docs/generated/route-index.md) (`npm run generate:route-index`)
- CI manifest-check: `npm run check:codebase-map`
- Regel: [`.cursor/rules/code-navigation.mdc`](.cursor/rules/code-navigation.mdc)

## Cost-conscious agent

Always-on regel: [`.cursor/rules/personal-cost-always.mdc`](.cursor/rules/personal-cost-always.mdc). Full policy: [coordinator-personal-cost-mode.mdc](.cursor/rules/coordinator-personal-cost-mode.mdc) · [coordinator-spawn-budget.mdc](.cursor/rules/coordinator-spawn-budget.mdc).

### Dev startup (ingen agent efter första setup)

```bash
npm ci && npm run setup:agent && npm run dev
```

### Prompt-mallar

**Liten fix:**
> Ändra bara [fil/komponent]. Kör `npm run quick:dev`. Ingen subagent.

**Större feature:**
> Implementera endast steg 1–3 i plan X. Max 8 filer. Kör `quick:dev` — inte `pr:gate`. Ingen parallell delegation.

**Deploy:**
> Push master om CI grön. Kör deploy workflow. Fixa bara blocker om CI failar.

### G0 vs pr:gate

| När | Kommando |
|-----|----------|
| Under arbete, varje agent-turn | `npm run quick:dev` (~2–3 min) |
| Innan merge till master | `npm run quick:dev` + `quality:integration` om DB/server |
| Innan deploy / stor release | `npm run pr:gate` **en gång** |

Agent ska **inte** köra full suite efter varje liten edit.

### Lean week checklist

1. Multitask off (default)
2. User rule: max 1 subagent, `quick:dev` default
3. Finish WIP — push/deploy committat arbete innan ny stor plan
4. En agent per feature — inte hela området i en Build
5. `pr:gate` en gång innan deploy, inte per subagent
6. Ny chat för varje nytt featureområde
7. Deploy själv med `gh workflow run` om agent redan committat
8. Model: Fast/Auto för kod; thinking bara för plan
9. Logga spawns i `private/SPAWN_BUDGET.md`

### Optional User Rule (Cursor settings)

Klistra in som Cursor User Rule under kostnadspress:

> Personal cost mode: max 1 subagent per request. No Multitask unless I say parallel. Default `quick:dev` not `pr:gate`. New chat for new features. No explore subagents — use grep/read in main agent.
