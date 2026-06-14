# Brain V1 — Product integration

*How shelf-life learning connects to the weekly household loop — wired on `master`; release policy in [RELEASE_MODEL.md](./RELEASE_MODEL.md).*

**Relaterat:** [LEARNING_ENGINE.md](./LEARNING_ENGINE.md) · [BRAIN_ROADMAP.md](./BRAIN_ROADMAP.md) · [CURRENT_REALITY.md](./CURRENT_REALITY.md) · [RELEASE_MODEL.md](./RELEASE_MODEL.md)

---

## V1.1 — Product Row integration (not separate PR)

**V1.1 Visibility** (Uppskattat på mobil inventory) ships as **acceptance criteria** on UX Slice 1 / Product Row (`feat/ux-inventory-list-v1`, #52) — **not** `feat/brain-v1.1-inventory-estimated-badge`.

| What | Where |
|------|-------|
| AC owner | UX Slice 1 — `InventoryCompactRow` Product Row redesign |
| Requirement | `EstimatedBadge` when `isEstimatedExpirySource(expiresOnSource)` — diskret bredvid expiry |
| Desktop | `InventoryTableRow` already shows badge; adjust only if Product Row unify |
| Fallback | Minimal Brain-only patch only if Slice 1 blocked >1 week |

Full AC: [UX_COORDINATOR_BACKLOG.md](./UX_COORDINATOR_BACKLOG.md) § Slice 1 · roadmap: [BRAIN_ROADMAP.md](./BRAIN_ROADMAP.md).

---

## Household loop impact

```mermaid
flowchart LR
  Receipt[Kvitto / scan] --> Expiry[expires_on på vara]
  Expiry --> Pantry[Skafferi / lager]
  Pantry --> EatFirst[Ät först på /hem]
  EatFirst --> Consume[Ät / förbruka]
  Consume --> Feedback[learning_feedback]
  Feedback --> Rules[household_shelf_life_rule]
  Rules --> Receipt
```

| Loop step | Brain V1 contribution |
|-----------|------------------------|
| **Kvitto → skafferi** | `ShelfLifePredictor` at import; household rules replace heuristics after 2+ samples |
| **Skafferi → ät först** | `findExpiringBefore` ranks by `expires_on` ASC — all sources |
| **Korrigering** | Expiry edit in lager/kvitto → `learning_feedback` → rule update |
| **Nästa vecka** | Better expiry → sharper eat-first chips |

---

## Feature flags

| Flag | Receipt parse UI | Scan bulk save | Kivra import | Inventory badge | Settings Förslag |
|------|------------------|----------------|--------------|-----------------|------------------|
| `SHELF_LIFE_LEARNING_ENABLED` | — | Server infer + feedback | Yes | Yes (saved source) | Yes |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | Review UX + parse predictions | Hidden prediction fields | — | Unchanged | — |
| `LOCATION_LEARNING_ENABLED` | Location predictions in parse | Feedback on bulk save | Kivra import | — | Location rules panel |
| `REPLENISHMENT_LEARNING_ENABLED` | — | — | — | — | Accept/dismiss → `learning_feedback` |

### Rollback (kill switch)

Per [RELEASE_MODEL.md](./RELEASE_MODEL.md): set flags `false` on master and deploy. Heuristik-only / no receipt estimate UI; `household_*_rule` and `learning_feedback` data remain.

> **Deprecated:** treating flags as a post-merge activation step separate from the feature merge.

---

## Gating consistency (implemented)

| Step | Gate | Entry |
|------|------|-------|
| Parse API predictions | `isShelfLifeEstimatesInReceiptEnabled()` | `api/receipt/parse/+server.ts` |
| Scan page prop | same | `scan/+page.server.ts` `load` → `ReceiptBulkAddFlow` |
| Bulk create infer | `inferLineShelfLife` + `isShelfLifeLearningEnabled()` | `scan/+page.server.ts` `bulkCreate` |
| Bulk create location feedback | `recordLineLocationFeedback` + `isLocationLearningEnabled()` | `scan/+page.server.ts` `bulkCreate`, `ReceiptBulkAddFlow` |
| Email/Kivra import | `isShelfLifeLearningEnabled()` | `receipt-import.ts` |
| Kivra/receipt location feedback | `recordLineLocationFeedback` + `isLocationLearningEnabled()` | `receipt-import.ts` |
| Replenishment accept/dismiss | `recordPredictorFeedback` (gated in service) | `api/replenishment/accept`, `api/replenishment/dismiss` |
| Inventory display (desktop + eat-first) | `isEstimatedExpirySource()` | `InventoryTableRow.svelte`, `EatFirstSection.svelte` |
| Inventory display (mobil — V1.1) | same — **Slice 1 AC** | `InventoryCompactRow.svelte` via UX Product Row PR |
| Expiry correction | `isShelfLifeLearningEnabled()` | `item/[id]/edit/+page.server.ts` |
| Settings → Förslag | `shouldShowSuggestionsSection()` | `settings/+page.server.ts` |

Predictor chain: **household_rule** (LEARNING on + `sample_count >= 2`) → **heuristic** → **LLM stub** (null).

---

## Smoke checklist (post-deploy)

Run after deploy when Brain flags are **on** on master `apphosting.yaml` ([RELEASE_MODEL.md](./RELEASE_MODEL.md) — no separate flag-flip step).

**Owner:** `USER_LOCAL` — product owner on physical device (Turnstile, mobilkamera, real receipt). Agents link here from [CURRENT_REALITY.md](./CURRENT_REALITY.md); they do not substitute for this pass.

**Required before Phase 2 un-flag** ([BRAIN_ROADMAP.md](./BRAIN_ROADMAP.md) — brain flags assumed always-on).

1. Scan receipt → **Uppskattat** on line → save → lager badge
2. Edit expiry → toast *Tack — Skaffu justerar nästa gång* → re-import → household rule
3. `/hem` Eat First chips include item; estimated badge when source ≠ `user_set`
4. Settings → **Skaffu lär sig** → rule + **Återställ**

---

## Deferred (not V1)

- Migration `0049` (household favorites) — separate track
- `InkopDuoActionBar` — wedge UI, not shelf-life loop
- LLM tier, consumption-velocity sort, global learning
