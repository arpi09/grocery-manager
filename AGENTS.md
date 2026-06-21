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
