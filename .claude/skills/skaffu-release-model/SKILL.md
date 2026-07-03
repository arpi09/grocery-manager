---
name: skaffu-release-model
description: Skaffu release policy — master=truth, deploy=publish, kill switches only. Use when changing apphosting.yaml env, emergency off, Tier C experiments, or infra toggles — not post-merge feature activation.
---

# Release model

## Read first

[docs/CURRENT_REALITY.md](../../docs/CURRENT_REALITY.md) · skill `skaffu-deploy-verify` for deploy gates

## Principles

| Principle | Meaning |
|-----------|---------|
| **master = truth** | `apphosting.yaml` on `master` is intended prod config. Merge feature code with final flag values already on master. |
| **deploy = publish** | **Deploy to production** publishes the current `master` SHA. Deploy is not a separate activation step after merge. |
| **Kill switches only** | Env vars are for emergency off, Tier C, and infra — not gradual rollout of Tier A/B product. |
| **No post-merge flag flip** | Do **not** merge with flags off and plan to flip `apphosting.yaml` later. Merge final state; deploy once. |

## Workflow

1. **Branch** — implement on `feat/*` / `fix/*`; set final values in `apphosting.yaml` (or `.env` for local-only / Tier C).
2. **Merge** — merge to `master` when G0 / CI green. Master describes what prod should be.
3. **Deploy** — coordinator runs **Deploy to production** via `skaffu-deploy-verify`.
4. **Emergency kill** — set switch on `master`, deploy. Code/data remain; surface hides. Re-enable only with explicit decision + deploy.

## Flag categories

| Category | Examples | When to change |
|----------|----------|----------------|
| **Product (Tier A/B)** | `PUBLIC_SHOPPING_LIST_SHARE_ENABLED`, `SHELF_LIFE_*`, `LOCATION_LEARNING_ENABLED`, `REPLENISHMENT_LEARNING_ENABLED` | Same PR / merge as the feature — final value on master before deploy |
| **Kill switch / infra** | `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED` | Off by default; flip on master + deploy when ready |
| **Tier C / experiment** | `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED` | Stay off until explicit product request |
| **Stub / deferred** | `*_LLM_ENABLED`, `HOUSEHOLD_FAVORITES_ENABLED` | Off until implementation exists |

Registry: `src/lib/server/feature-flags.ts` (`FEATURE_FLAG_ENV`). Local dev: `.env`; prod truth: `apphosting.yaml` on master.

## Kill-switch checklist (emergency or infra)

- [ ] Change is intentional kill / Tier C / infra — not Tier A/B activation
- [ ] `apphosting.yaml` — BUILD + RUNTIME for `PUBLIC_*` (SvelteKit needs build-time public env)
- [ ] `.env.example` comment if devs need the override locally
- [ ] `docs/CURRENT_REALITY.md` if nav or user-visible surface changes
- [ ] Deploy via `skaffu-deploy-verify` — env changes require deploy, not merge alone

## apphosting.yaml allowlist

Prod env that affects runtime must be listed under `env:` in `apphosting.yaml`. When adding a key to `FEATURE_FLAG_ENV` or a new `PUBLIC_*` reader:

1. Add variable block with correct `availability` (BUILD for client-visible `PUBLIC_*`).
2. Grep repo: `rg 'variable: YOUR_KEY' apphosting.yaml` before merge.

No separate CI job — keep the allowlist in sync in the same PR as the code.

## Forbidden

- Merge → follow-up PR that only flips Tier A/B flags → deploy (unless documented emergency reversal).
- "Enable W1 / Brain after deploy" as a release step — ship final `apphosting.yaml` with the feature PR.
- Saying a feature is live without deploy + `PROD_SMOKE` for the target SHA.

## Tier C

Grannskafferiet, Kivra forward, Stripe/Pro checkout — pausa utan explicit user request ([skaffu-core-loop.mdc](../../.cursor/rules/skaffu-core-loop.mdc)).
