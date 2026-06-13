# Skaffu — agent index

**Start här** för alla Cursor-agenter (coordinator + implementation).

| Läs först | Fil |
|-----------|-----|
| Prod vs master, flags, nav, tier | [CURRENT_REALITY.md](./CURRENT_REALITY.md) |
| Kärnloopen | `.cursor/rules/skaffu-core-loop.mdc` |
| Coordinator WIP/deploy | [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md) |
| Cloud Handoff + dispatch log | [AGENT_DISPATCH_LOG.md](./AGENT_DISPATCH_LOG.md), [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) |
| Deploy + smoke | [DEPLOY.md](./DEPLOY.md), [PROD_SMOKE.md](./PROD_SMOKE.md) |
| Retention playbook (human) | [FOUNDER_WEEKLY_HABIT.md](./FOUNDER_WEEKLY_HABIT.md) |

## Skills (namn i prompt)

| Skill | När |
|-------|-----|
| `skaffu-deploy-verify` | deploy, prod, release, rollback |
| `skaffu-core-loop-change` | hem, inkop, onboarding, nav, household |
| `skaffu-feature-flag-rollout` | `PUBLIC_*`, apphosting.yaml, W1/W2 flags |

## Rör inte (Tier C) utan explicit request

Grannskafferiet · Kivra forward · Stripe/Pro checkout · meal-AI hero · wrapped/statistik som primär yta

## G0 före push till master

`npm run check:locales && npm run check && npm test`
