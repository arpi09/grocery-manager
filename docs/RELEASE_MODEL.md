# Release model — Skaffu

*Phase 0 (docs). Canonical policy for how features reach production.*

**Relaterat:** [DEPLOY.md](./DEPLOY.md) · [CURRENT_REALITY.md](./CURRENT_REALITY.md) · [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md)

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **master = truth** | `apphosting.yaml` on `master` is the intended production config. Feature code merges with its final flag values already set on master. |
| **deploy = publish** | **Deploy to production** publishes the current `master` SHA. Deploy is not a separate “activation” step after merge. |
| **Kill switches only** | Env flags are for emergency off, Tier C experiments, and infra toggles — not gradual rollout of Tier A/B product. |
| **No post-merge flag flip** | Do **not** merge code with flags off and plan to flip `apphosting.yaml` after merge. Merge the final flag state; deploy once. |

---

## Workflow

1. **Branch** — implement on `feat/*` or `fix/*` with final flag values in `apphosting.yaml` (or `.env` for local-only flags).
2. **Merge** — merge to `master` when G0 / CI is green. Master now describes what prod should be.
3. **Deploy** — coordinator runs **Deploy to production** when ready (~12–20 min, full gates). See [DEPLOY.md](./DEPLOY.md).
4. **Kill switch (emergency)** — set flag `false` on `master`, deploy. Data and code remain; feature surface hides. Re-enable only with explicit decision + deploy.

---

## Flag categories

| Category | Examples | When to change |
|----------|----------|----------------|
| **Product (Tier A/B)** | `PUBLIC_SHOPPING_LIST_SHARE_ENABLED`, `SHELF_LIFE_LEARNING_ENABLED`, `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | Same PR / merge as the feature — final value on master before deploy |
| **Kill switch / infra** | `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED` | Off by default; flip on master + deploy when ready |
| **Tier C / experiment** | `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED` | Stay off until explicit product request; not part of core loop release train |
| **Stub / deferred** | Migration `0049` favorites, LLM tiers | Off until implementation exists |

Local dev: `.env` overrides; prod truth is `apphosting.yaml` on master.

---

## What this replaces

- **Prod vs master flag tables** in [CURRENT_REALITY.md](./CURRENT_REALITY.md) — replaced by kill-switch summary + this doc.
- **“Merge code only, flags off, enable post-deploy”** — deprecated in [LEARNING_ENGINE.md](./LEARNING_ENGINE.md) and [BRAIN_V1_PRODUCT_INTEGRATION.md](./BRAIN_V1_PRODUCT_INTEGRATION.md).
- **Gradual flag rollout** as a release step — use branch + merge + deploy instead.

Skill `skaffu-feature-flag-rollout` remains for kill switches, Tier C, and infra env — not for activating Tier A/B after merge.

---

## Coordinator checklist

| Step | Owner | Gate |
|------|-------|------|
| Flag values match feature intent on branch | Implementation agent | G0 |
| `apphosting.yaml` on master = intended prod | Coordinator at merge | CI green |
| Deploy when releasing | Coordinator | Deploy workflow all green |
| Update [CURRENT_REALITY.md](./CURRENT_REALITY.md) prod SHA after deploy | Coordinator | [PROD_SMOKE.md](./PROD_SMOKE.md) |

**Forbidden:** merge → separate PR that only flips flags → deploy, unless the flip is a documented emergency kill-switch reversal.
