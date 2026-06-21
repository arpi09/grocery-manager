# Engineering Health â€” snapshot

**Baseline:** 2026-06-21 Â· Node 24 Â· `npm audit --omit=dev` â†’ 0 runtime CVEs Â· ~260 unit Â· 44 integration Â· CI quality ~15 min cap Â· [DEPENDENCY_HEALTH.md](./DEPENDENCY_HEALTH.md).

Branch strategy: work on `feat/engineering-health-*`; cherry-pick isolated commits after prod is green. Do not merge during active deploy lockdown.

---

## Posture (summary)

| Area | Grade | Note |
|------|-------|------|
| Dependencies | Good | Patch drift only; no runtime CVEs; Dependabot weekly â€” [DEPENDENCY_HEALTH.md](./DEPENDENCY_HEALTH.md) |
| Code quality | Mixed | Low TODO noise; several 700â€“1000 line UI organisms |
| Test coverage | Mixed | Strong domain/unit; weak wedge flows (`/inkop`, `lista` guest) |
| Test efficiency | Needs work | Integration serial; monolithic `quality:ci` |
| CI/CD | Good design | Reusable quality + artifact reuse; G1b SHA-gate blocks deploy |
| Architecture | Good V1 | Learning engine ports/adapters; flag sprawl |
| Agent efficiency | Good | `quick:*` + `gate:fast`; G0 = `quick:dev` only |

**Current deploy blocker:** no green `quality / quality` on target SHA (G1b) â€” not a flake. Fix: green `quality:ci` on commit, then manual deploy.

---

## Script tiers (implemented)

| Script | Blocks deploy? | Notes |
|--------|----------------|-------|
| `quick:lint` | No | TS/JS-only edits (~30â€“60 s) |
| `quick:check` | No | sync + svelte-check (~1â€“2 min) |
| `quick:unit` | No | vitest only |
| `quick:types` | No | svelte-check without sync |
| `quick:dev` | No â€” **agent default G0** | lint + locales + server-imports + unit |
| `quick:marketing` | No | quick:dev + landing variants |
| `gate:fast` | No | optional pre-merge (~5â€“7 min) |
| `quality:integration` | Yes (subset) | server/DB touches |
| `pr:gate` / `quality:ci` | Yes | CI mirror â€” not pre-push |
| `nightly` | No (audit warn-only) | |

Cloud agents (paused): [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) â€” use coordinator + local agents instead.

---

## Top 10 tracker

| # | Task | Status |
|---|------|--------|
| 1 | Add `quick:dev` npm script | **Done** |
| 1b | Split `quick:lint/check/unit` + `gate:fast` | **Done** |
| 2 | Create dependency tracking doc ([DEPENDENCY_HEALTH.md](./DEPENDENCY_HEALTH.md)) | **Done** |
| 3 | Integration test parallelism pilot | **Done** (PGlite per-file; `fileParallelism: true`) |
| 4 | `lista/[token]` guest join integration test | **Done** (11 tests in `lista-guest.integration.test.ts`) |
| 5 | `receipt-import.ts` focused integration test | **Done** (`receipt-import.integration.test.ts` + purchase mapper unit tests) |
| 6 | Duo wedge product-events test coverage | **Done** (`product-events.test.ts` allowlist + lista acquisition) |
| 7 | Patch dependency bump PR | **Done** (this branch) |
| 8 | CI: parallel fast + integration jobs + path-tier | **Done** |
| 9 | Split `LearningEngineService` | Delay until Brain on prod |
| 10 | Feature flags registry + CURRENT_REALITY sync | **Done** (this branch) |

**Do not start during deploy:** ShoppingListPanel / ReceiptBulkAddFlow splits (high wedge merge conflict).

**Owner (not code):** Add Turnstile hostnames `skaffu.com` + `www.skaffu.com` before custom-domain traffic â€” [CAPTCHA.md](./CAPTCHA.md#owner-checklist--skaffucom-hostnames-user_local).

---

## Batch 3 â€” owner field-test driven

After Batch 1â€“2 deploy, pick **1â€“2 friction points** from your own use (not roadmap):

| If you noticeâ€¦ | Track |
|----------------|-------|
| InkÃ¶p/lista friction | Shopping V2 polish, checkoff-bridge |
| Kvitto/PDF issues | Receipt fixtures + import UX |
| Onboarding drop-off | Startguide/activation steps |
| Hem feels noisy | Home UX v2 micro-polish (not redesign) |
| Brain/memory unclear | Memory Explorer + expiry copy |

No feature code in this section â€” update when owner testing surfaces the next wedge.

---

## Feature flags registry

Central readers: [`src/lib/server/feature-flags.ts`](../src/lib/server/feature-flags.ts). Domain modules (`*-flag.ts`) re-export for backward-compatible imports. Prod vs yaml values: [CURRENT_REALITY.md](./CURRENT_REALITY.md#feature-flags-prod-vs-master-yaml).

| Registry key | Env var | Reader | Module re-export |
|--------------|---------|--------|------------------|
| `SHELF_LIFE_LEARNING` | `SHELF_LIFE_LEARNING_ENABLED` | `isShelfLifeLearningEnabled` | `shelf-life-learning-flag.ts` |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | `isShelfLifeEstimatesInReceiptEnabled` | `shelf-life-learning-flag.ts` |
| `LOCATION_LEARNING` | `LOCATION_LEARNING_ENABLED` | `isLocationLearningEnabled` | `location-learning-flag.ts` |
| `REPLENISHMENT_LEARNING` | `REPLENISHMENT_LEARNING_ENABLED` | `isReplenishmentLearningEnabled` | `replenishment-learning-flag.ts` |
| `SHOPPING_LIST_SHARE` | `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | `isShoppingListShareEnabled` | `shopping-list-share-flag.ts` |

Full audit rationale: Engineering Health plan (coordinator upload). Refresh quarterly or after major CI/architecture changes.
