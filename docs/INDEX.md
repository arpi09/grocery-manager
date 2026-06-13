# Skaffu — agent index

**Start här** för alla Cursor-agenter (coordinator + implementation).

| Läs först | Fil |
|-----------|-----|
| Prod vs master, flags, nav, tier | [CURRENT_REALITY.md](./CURRENT_REALITY.md) |
| Kärnloopen | `.cursor/rules/skaffu-core-loop.mdc` |
| Coordinator WIP/deploy | [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md) |
| Cloud Handoff + dispatch log | [AGENT_DISPATCH_LOG.md](./AGENT_DISPATCH_LOG.md), [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) |
| Engineering health snapshot | [ENGINEERING_HEALTH.md](./ENGINEERING_HEALTH.md) |
| Deploy + smoke | [DEPLOY.md](./DEPLOY.md), [PROD_SMOKE.md](./PROD_SMOKE.md) |
| Retention playbook (human) | [FOUNDER_WEEKLY_HABIT.md](./FOUNDER_WEEKLY_HABIT.md) |

## Skills (namn i prompt)

| Skill | När |
|-------|-----|
| `skaffu-deploy-verify` | deploy, prod, release, rollback |
| `skaffu-core-loop-change` | hem, inkop, onboarding, nav, household |
| `skaffu-feature-flag-rollout` | `PUBLIC_*`, apphosting.yaml, W1/W2 flags |

## Cloud-safe first tasks

Docs-only och låg risk — se [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) och [AGENT_DISPATCH_LOG.md](./AGENT_DISPATCH_LOG.md).

1. **CURRENT_REALITY + INDEX sync** — master SHA, nav, flags från kod/yaml; prod SHA lämnas till coordinator
2. **Cloud Handoff docs** — dispatch log, PR template, usage policy (docs only)
3. **Dead-code / TODO audit** — grep-only → `docs/DEAD_CODE_AUDIT.md`
4. **Dependency health refresh** — `private/DEPENDENCY_HEALTH.md` + `npm outdated` (ingen lockfile utan godkännande)
5. **i18n / landing copy** — med `check:locales` och `quick:marketing`

**Cloud default gate (docs):** `npm run check:locales`. **Kod:** `npm run quick:dev`.

## Rör inte (Tier C) utan explicit request

Grannskafferiet · Kivra forward · Stripe/Pro checkout · meal-AI hero · wrapped/statistik som primär yta

## G0 före push till master

**Snabb default (agenter):** `npm run quick:dev` (~2–3 min)

**Full gate:** `npm run check:locales && npm run check && npm test` — eller `npm run quality:ci` / `release:gate` före merge till master
