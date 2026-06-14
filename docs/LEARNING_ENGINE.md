# Learning Engine — Skaffu Brain V1

*Shelf-life prediction at receipt import and inventory. Code on `master`; flags in `apphosting.yaml` on master per [RELEASE_MODEL.md](./RELEASE_MODEL.md).*

**Relaterat:** [BRAIN_V1_PRODUCT_INTEGRATION.md](./BRAIN_V1_PRODUCT_INTEGRATION.md) · [CURRENT_REALITY.md](./CURRENT_REALITY.md) · [RELEASE_MODEL.md](./RELEASE_MODEL.md)

---

## What it does

Skaffu Brain V1 replaces scattered `guessShelfLife` calls with a **modular predictor chain** behind `LearningEngineService`:

1. **Household rule** — median `typical_days` per `(normalized_key, location)` when `sample_count >= 2`
2. **Heuristic** — keyword table in `src/lib/domain/shelf-life.ts`

No LLM tier in V1.

Every prediction is **observable and correctable**. User actions write to `learning_feedback` and update `household_shelf_life_rule`.

**Household-first:** learning is scoped to `household_id` + normalized product key.

---

## Architecture

| Layer | Path | Role |
|-------|------|------|
| Domain | `src/lib/domain/learning/` | Types, median math, expiry-source helpers |
| Application | `src/lib/application/learning/`, `predictors/` | `LearningEngineService`, predictors |
| Infrastructure | `repositories/learning-*.ts`, `adapters/*` | Drizzle persistence |
| Server | `di.ts`, `hooks.server.ts`, routes | DI; routes call `locals.learningEngineService` |

### Data model (migrations `0047`, `0048`)

- **`household_shelf_life_rule`** — materialized median shelf life per household + product key + location
- **`household_location_rule`** — learned default storage location per product key
- **`learning_feedback`** — audit log (`predictor_id`: `shelf_life`, `location`, `replenishment`)

`expiresOnSource` on inventory: `heuristic`, `household_learned`, or legacy `ai_inferred` (UI: **Uppskattat**).

---

## Feature flags

| Flag | Scope | Default | Reader |
|------|-------|---------|--------|
| `SHELF_LIFE_LEARNING_ENABLED` | server RUNTIME | `false` | `isShelfLifeLearningEnabled()` |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | BUILD+RUNTIME | `false` | `isShelfLifeEstimatesInReceiptEnabled()` |
| `LOCATION_LEARNING_ENABLED` | server RUNTIME | `false` | `isLocationLearningEnabled()` |
| `REPLENISHMENT_LEARNING_ENABLED` | server RUNTIME | `false` | `isReplenishmentLearningEnabled()` |

`PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` unset locally falls back to `SHELF_LIFE_LEARNING_ENABLED`.

### Rollback (kill switch)

Per [RELEASE_MODEL.md](./RELEASE_MODEL.md), flags are kill switches — not a post-merge activation lever. Flip flags to `false` on master and deploy to disable surface area. **No data loss:** rules and feedback remain; re-enable with explicit deploy.

| Action | Effect |
|--------|--------|
| Flags → `false` | Heuristik-only / no receipt estimate UI |
| Revert deploy without DB downgrade | Orphan tables OK |
| Per-rule **Återställ** in Settings | Deletes one materialized rule; feedback audit kept |

---

## Integration points (wired on master)

| Flow | Entry | Feedback |
|------|-------|----------|
| Scan bulk | `scan/+page.server.ts` `bulkCreate` | `recordLineShelfLifeFeedback` |
| Parse API | `api/receipt/parse/+server.ts` | Predictions when `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` |
| Email/Kivra import | `receipt-import.ts` | Same when `SHELF_LIFE_LEARNING_ENABLED` |
| Inventory create/infer | `inventory.service.ts` via brain inference adapter | — |
| Inventory edit | `item/[id]/edit/+page.server.ts` | `recordFeedback` + `learningCorrected` toast |
| Receipt review UI | `ReceiptBulkAddFlow.svelte` | `EstimatedBadge` + date fields when flag on |
| Inventory list / eat-first | `InventoryTableRow`, `EatFirstSection` | `EstimatedBadge` when `isEstimatedExpirySource` |
| Settings | `SuggestionsSettingsPanel` + `suggestions.actions.ts` | Per-rule reset |

---

## Deploy checklist

Per [RELEASE_MODEL.md](./RELEASE_MODEL.md): **master = truth**, **deploy = publish**. Merge feature + final flag values; deploy once.

1. Migrations `0047_learning_engine_v1.sql`, `0048_household_location_rule.sql` on prod DB (before or with deploy)
2. Merge Brain V1 to `master` with intended `apphosting.yaml` flag values (not “code only, flags off”)
3. Deploy to production
4. Smoke: scan → Uppskattat → save → edit expiry → Settings Förslag

> **Deprecated:** merge code with flags off, then flip `apphosting.yaml` in a follow-up merge/deploy. Do not use for new work.

---

## Tests

- Unit: `learning-engine.service.test.ts`, `shelf-life-predictor.test.ts`
- Integration: `learning-engine.integration.test.ts`, `scan-bulk.integration.test.ts`, `receipt-import.integration.test.ts`
- Repos: `household-shelf-life-rule.repository.test.ts`, `learning-feedback.repository.test.ts`
