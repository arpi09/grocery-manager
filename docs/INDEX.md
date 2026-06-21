# Skaffu — agent index

**Start här** för alla Cursor-agenter (coordinator + implementation).

| Läs först | Fil |
|-----------|-----|
| Agent entry (Cursor standard) | [AGENTS.md](../AGENTS.md) |
| Feature → routes → filer | [CODEBASE_MAP.md](./CODEBASE_MAP.md) |
| Prod SHA, nav, tier, kill switches | [CURRENT_REALITY.md](./CURRENT_REALITY.md) |
| Release policy (master=truth, deploy=publish) | [RELEASE_MODEL.md](./RELEASE_MODEL.md) |
| Kärnloopen | `.cursor/rules/skaffu-core-loop.mdc` |
| Coordinator WIP/deploy | [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md) |
| Coordinator planning | `coordinator-planning.mdc`, [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md) |
| Deploy + smoke | [DEPLOY.md](./DEPLOY.md), [PROD_SMOKE.md](./PROD_SMOKE.md) |
| Retention playbook (human) | [FOUNDER_WEEKLY_HABIT.md](./FOUNDER_WEEKLY_HABIT.md) |
| Household loop audit + weekly smoke | [HOUSEHOLD_LOOP_AUDIT.md](./HOUSEHOLD_LOOP_AUDIT.md) |

## Skills (namn i prompt)

| Skill | När |
|-------|-----|
| `skaffu-deploy-verify` | deploy, prod, release, rollback |
| `skaffu-core-loop-change` | hem, inkop, onboarding, nav, household |
| `skaffu-release-model` | Kill switches, Tier C, infra env - see [RELEASE_MODEL.md](./RELEASE_MODEL.md) |

## Rör inte (Tier C) utan explicit request

Grannskafferiet · Kivra forward · Stripe/Pro checkout · meal-AI hero · wrapped/statistik som primär yta

## G0 före push till master

`npm run check:locales && npm run check && npm test`
