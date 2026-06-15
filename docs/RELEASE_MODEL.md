# Release model — Skaffu

*CI/CD test tiers, deploy lanes, and rollback policy.*

**Relaterat:** [DEPLOY.md](./DEPLOY.md) · [CI_CD.md](./CI_CD.md) · [CURRENT_REALITY.md](./CURRENT_REALITY.md)

---

## Test tiers

| Tier | Trigger | E2E | Target time | Blocks prod? |
|------|---------|-----|-------------|--------------|
| **quick:dev** | Agent before commit | None | ~2–3 min | Local |
| **pr:gate** | PR + push `master` | None (E2E in `e2e.yml`) | ~3–5 min | Merge |
| **deploy:fast** | Deploy `tier=fast` or `auto` + low-risk | Critical `@deploy-critical` | ~8–15 min | Prod |
| **release:full** | Deploy `tier=full`, core paths | Full 3 shards | ~20–35 min | Prod |
| **nightly** | Schedule 03:00 UTC | Full + heavy specs | ~25–45 min | Signal only |

**Branch protection:** require **`pr-gate / pr-gate`** (update from `quality / quality` after merge).

---

## Deploy tiers

| `deploy_tier` | E2E | When |
|---------------|-----|------|
| **auto** | path-tier → fast or full | Normal releases |
| **fast** | Critical E2E | CSS, copy, low-risk |
| **full** | Full E2E × 3 | Core-loop paths |
| **hotfix** | Critical + double prod smoke | Urgent fix + `hotfix_reason` |

`skip_e2e` is **deprecated** — use `hotfix` (runs critical E2E, not zero E2E).

`verify-release` always requires successful E2E, deploy, and smoke.

---

## How to ship a small bugfix fast

1. `fix/*` branch, low-risk paths only.
2. `npm run quick:dev` locally.
3. Merge when `pr-gate` + PR critical E2E are green.
4. Deploy with `deploy_tier: auto` or `fast`.
5. Coordinator updates CURRENT_REALITY after smoke.

---

## Rollback

1. Deploy previous good SHA from CURRENT_REALITY with `deploy_tier=fast`.
2. If smoke fails → Firebase rollback / redeploy previous.

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **master = truth** | `apphosting.yaml` on master is intended prod config. |
| **deploy = publish** | Deploy workflow publishes the SHA — not a separate activation. |
| **Kill switches only** | Flags for emergency off, Tier C, infra — not gradual Tier A/B rollout. |

---

## Local scripts

| Script | Purpose |
|--------|---------|
| `npm run quick:dev` | Agent default |
| `npm run pr:gate` | Pre-merge CI parity (no audit) |
| `npm run deploy:fast` | pr:gate + critical E2E + pre-deploy smoke |
| `npm run test:e2e:critical` | `@deploy-critical` tests only |
| `npm run ci:path-tier` | Classify changed files |
