# Engineering Health — snapshot

**Baseline:** 2026-05-28 · Node 24 · `npm audit --omit=dev` → 0 runtime CVEs · ~260 unit · 44 integration · CI quality ~15 min cap.

Branch strategy: work on `feat/engineering-health-*`; cherry-pick isolated commits after prod is green. Do not merge during active deploy lockdown.

---

## Posture (summary)

| Area | Grade | Note |
|------|-------|------|
| Dependencies | Good | Patch drift only; no runtime CVEs |
| Code quality | Mixed | Low TODO noise; several 700–1000 line UI organisms |
| Test coverage | Mixed | Strong domain/unit; weak wedge flows (`/inkop`, `lista` guest) |
| Test efficiency | Needs work | Integration serial; monolithic `quality:ci` |
| CI/CD | Good design | Reusable quality + artifact reuse; G1b SHA-gate blocks deploy |
| Architecture | Good V1 | Learning engine ports/adapters; flag sprawl |
| Agent efficiency | Partial | `quick:dev` added; `private/DEPENDENCY_HEALTH.md` still missing |

**Current deploy blocker:** no green `quality / quality` on target SHA (G1b) — not a flake. Fix: green `quality:ci` on commit, then manual deploy.

---

## Script tiers (implemented)

| Script | Blocks deploy? |
|--------|----------------|
| `quick:dev` | No — agent default |
| `quick:marketing` | No |
| `quality:integration` | Yes (subset) |
| `quality:ci` / `release:gate` | Yes |
| `nightly` | No (audit warn-only) |

Cloud agents (paused): [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) — use coordinator + local agents instead.

---

## Top 10 tracker

| # | Task | Status |
|---|------|--------|
| 1 | Add `quick:dev` npm script | **Done** (this branch) |
| 2 | Create `private/DEPENDENCY_HEALTH.md` | Pending |
| 3 | Integration test parallelism pilot | **Done** (PGlite per-file; `fileParallelism: true`) |
| 4 | `lista/[token]` guest join integration test | Pending |
| 5 | `receipt-import.ts` focused integration test | Pending |
| 6 | Duo wedge product-events test coverage | Pending |
| 7 | Patch dependency bump PR | **Done** (this branch) |
| 8 | CI: parallel fast + integration jobs | Pending |
| 9 | Split `LearningEngineService` | Delay until Brain on prod |
| 10 | Feature flags registry + CURRENT_REALITY sync | **Done** (this branch) |

**Do not start during deploy:** ShoppingListPanel / ReceiptBulkAddFlow splits (high wedge merge conflict).

---

## Feature flags registry

Central readers: [`src/lib/server/feature-flags.ts`](../src/lib/server/feature-flags.ts). Domain modules (`*-flag.ts`) re-export for backward-compatible imports. Prod vs yaml values: [CURRENT_REALITY.md](./CURRENT_REALITY.md#feature-flags-prod-vs-master-yaml).

| Registry key | Env var | Reader | Module re-export |
|--------------|---------|--------|------------------|
| `SHELF_LIFE_LEARNING` | `SHELF_LIFE_LEARNING_ENABLED` | `isShelfLifeLearningEnabled` | `shelf-life-learning-flag.ts` |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | `isShelfLifeEstimatesInReceiptEnabled` | `shelf-life-learning-flag.ts` |
| `SHELF_LIFE_LLM` | `SHELF_LIFE_LLM_ENABLED` | `isShelfLifeLlmEnabled` | `shelf-life-learning-flag.ts` |
| `LOCATION_LEARNING` | `LOCATION_LEARNING_ENABLED` | `isLocationLearningEnabled` | `location-learning-flag.ts` |
| `LOCATION_LLM` | `LOCATION_LLM_ENABLED` | `isLocationLlmEnabled` | `location-learning-flag.ts` |
| `REPLENISHMENT_LEARNING` | `REPLENISHMENT_LEARNING_ENABLED` | `isReplenishmentLearningEnabled` | `replenishment-learning-flag.ts` |
| `HOUSEHOLD_FAVORITES` | `HOUSEHOLD_FAVORITES_ENABLED` | `isHouseholdFavoritesEnabled` | `household-favorites-flag.ts` |
| `SHOPPING_LIST_SHARE` | `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | `isShoppingListShareEnabled` | `shopping-list-share-flag.ts` |

Full audit rationale: Engineering Health plan (coordinator upload). Refresh quarterly or after major CI/architecture changes.
