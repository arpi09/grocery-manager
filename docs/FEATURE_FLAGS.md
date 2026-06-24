# Feature flags — Skaffu

> **Source of truth for prod:** [`apphosting.yaml`](../apphosting.yaml) (`RUNTIME` env at deploy).
> **Code registry:** [`src/lib/server/feature-flags.ts`](../src/lib/server/feature-flags.ts) — all `is*Enabled()` reads.
> **Client booleans:** [`src/routes/+layout.server.ts`](../src/routes/+layout.server.ts) (subset passed to every page).
> **Local dev:** [`.env.example`](../.env.example) (many brain flags commented with `false` — local often ≠ prod).

**Relaterat:** [CURRENT_REALITY.md](./CURRENT_REALITY.md) · [RELEASE_MODEL.md](./RELEASE_MODEL.md) · [LEARNING_ENGINE.md](./LEARNING_ENGINE.md)

---

## Default patterns

Same env key can behave differently depending on which helper reads it:

| Pattern | On when | Off when | Used for |
|---------|---------|----------|----------|
| **`isEnvTrue`** (`exactTrue`) | env **exactly** `true` | missing or any other value | UX v2 canaries, legacy surfaces, W1 share, experiments |
| **`isEnvEnabledDefaultOn`** (`defaultOn`) | missing or **not** `false` | env `false` | Brain feedback, home v2, learning, proactive cron |
| **`!== 'false'`** (`notFalse`) | same as default-on | env `false` | Receipt AI batch, global shelf-life DB, recipe/photo LLM passes |

**Prod effective value** = `apphosting.yaml` if set → otherwise **code default** from pattern above.

**Local tip:** Uncomment `*_ENABLED=false` lines in `.env` to mirror prod-off behaviour; prod has most product flags **on** (see tables below).

---

## UX v2 surfaces

| Env key | Label | Code default | Prod (`apphosting.yaml`) | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|--------------------------|----------------|---------------------|-------------------|
| `HOME_UX_V2_ENABLED` | Home UX v2 — Household Briefing | **on** (`defaultOn`) | `true` | `homeUxV2Enabled` | `/hem` → `HomeV2Page` (timeline, waste cards, replenishment fold) instead of legacy dashboard | Replenishment / insights data for cards; empty state if no history |
| `SHOPPING_UX_V2_ENABLED` | Shopping UX v2 — Plan + Shop | **off** (`exactTrue`) | `true` | `shoppingUxV2Enabled` | `/inkop` Plan/Shop modes; checklist in overflow drawer (flag-off: inline grid) | Shopping list items |
| `PANTRY_UX_V2_ENABLED` | Pantry UX v2 — shelf view | **off** (`exactTrue`) | `true` | `pantryUxV2Enabled` | `/inventory` shelf zones + use-soon; redirects when off | Active inventory items |

---

## Home & legacy layout

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `HOME_REDESIGN_V1_ENABLED` | Home redesign v1 (legacy premium layout) | **off** (`exactTrue`) | `true` | `homeRedesignV1Enabled` | Fallback `/hem` layout when `HOME_UX_V2` off; v2 wins when both on | — |
| `HOME_BRIEFING_AI_ENABLED` | Home briefing AI one-liner | **on** (`defaultOn`) | `true` | — (server-only) | Nano one-liner on `/hem` via `hem/+page.server.ts` | Briefing context from home load |
| `PRICE_MEMORY_V1_ENABLED` | Price memory v1 read surfaces | **off** (`exactTrue`) | `true` | `priceMemoryV1Enabled` | Price chip/tooltip on item edit; settings discovery; import hints | `receipt_price_captured` / price history |

---

## Brain feedback & ranking

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `BRAIN_FEEDBACK_V1_ENABLED` | Brain feedback v1 | **on** (`defaultOn`) | `true` | `brainFeedbackV1Enabled` | Replenishment belief line + **Stämmer / Inte riktigt** (not emoji thumbs); `POST /api/brain/feedback` | `replenishmentSuggestions.length > 0`; `canEdit`; needs receipt purchase history |
| `REPLENISHMENT_RANK_ENABLED` | Nano rank top replenishment | **on** (`defaultOn`) | `true` | — | Re-orders top replenishment suggestions (`replenishment-rank.ts`) | Replenishment candidates exist |
| `BRAIN_PROACTIVE_ENABLED` | Brain proactive automation | **on** (`defaultOn`) | `true` | — | Cron/push: Sunday briefing, pre-shop, partner nudges, Kivra import toast; smart-fill gate | Push subscription; household context |

**Visibility note:** On `/inkop`, replenishment + feedback sit inside collapsed `<details>` **"Dags att köpa igen?"** — easy to miss even when flags are on.

---

## Learning (mostly silent)

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `SHELF_LIFE_LEARNING_ENABLED` | Household shelf-life learning | **on** (`defaultOn`) | `true` | — | Predictor + receipt inference; Memory Explorer gate on `/hem`, `/inkop` | Household edits / receipt lines |
| `LOCATION_LEARNING_ENABLED` | Storage location learning | **on** (`defaultOn`) | `true` | — | Location hints in receipt/scan parse; rules in Memory Explorer | Location feedback events |
| `REPLENISHMENT_LEARNING_ENABLED` | Replenishment accept/dismiss log | **on** (`defaultOn`) | `true` | — | Persists feedback from `/api/brain/feedback` (requires feedback flag too) | Feedback POSTs |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | Receipt expiry estimates UX | **on** (falls back to shelf-life learning if unset) | `true` | `shelfLifeEstimatesInReceipt` | **Uppskattat** dates in receipt review + scan; `/api/receipt/parse` shelf-life batch | Explicit `true`/`false` overrides learning fallback |
| `STORE_RECOMMENDATION_V0_ENABLED` | Store recommendation v0 experiment | **off** (`exactTrue`) | `true` | — | Registered in flag snapshot; telemetry domain only today — no major UI surface wired | — |

Memory Explorer: `/settings/memory` when any learning flag effective + `showMemoryExplorer` on hem/inkop.

---

## Receipt & AI backend

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `RECEIPT_AI_BATCH_ENABLED` | OpenAI shelf-life batch on receipt | **on** (`notFalse`) | `true` | — | Batch expiry inference in `receipt-shelf-life-predictions.ts` | Receipt parse + `OPENAI_API_KEY` |
| `GLOBAL_SHELF_LIFE_DB_ENABLED` | Global shelf-life keyword DB | **on** (`notFalse`) | `true` | — | Expanded keyword DB for category hints | — |
| `RECIPE_REFINEMENT_ENABLED` | Recipe generation 2nd LLM pass | **on** (`notFalse`) | `true` | — | Optional refinement in `recipe-generation.ts` | Meal intent + inventory |
| `PHOTO_VALIDATION_ENABLED` | Photo-round 2nd validation LLM | **on** (`notFalse`) | `true` | — | Second pass on `/api/inventory/photo-scan` | Photo scan upload |
| `AUTO_FINISH_ENABLED` | Auto-finish expired items (cron) | **off** (`exactTrue`) | `true` | — | `POST /api/cron/auto-expiry-sweep` — only users who opt in in settings | Expired inventory in grace window + user opt-in |

---

## Acquisition & sharing

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | W1 public shopping list share | **off** (`exactTrue`) | `true` (BUILD+RUNTIME) | `shareLinkEnabled` | `/lista/[token]` guest join; share menu on `/inkop`; post-onboarding share prompt | Household list + share API |

---

## Kill switches & Tier C

Not all of these live in `feature-flags.ts`, but they gate prod behaviour alongside product flags.

| Env key | Label | Code default | Prod | Layout boolean | UI / backend effect | Data requirements |
|---------|-------|--------------|------|----------------|---------------------|-------------------|
| `EMAIL_SENDING_DISABLED` | Global email kill switch | **off** (send when not `true`) | `false` | — | Blocks Resend except owner PMF digest cron | — |
| `STRIPE_CHECKOUT_DISABLED` | Pro checkout kill switch | **on** in `.env.example` | `true` | — | Blocks Stripe checkout/portal even if admin toggle on | Stripe secrets configured |
| `PUBLIC_CITY_FEED_ENABLED` | Grannskafferiet city feed (Tier C) | **off** (`=== 'true'`) | not set → **off** | — | `/delningar` + Mer nav entry | Min supply seed (`PUBLIC_CITY_FEED_MIN_SUPPLY`) |
| `KIVRA_FORWARD_ENABLED` | Kivra inbound forward (Tier C) | **off** (`true`/`1`/`yes`) | not set → **off** | — | `POST /api/inbound/kivra` | Resend inbound + domain |
| `MARKET_V01_DISABLED` | Grannskafferiet Market v0.1 emergency off | **off** | not set → market follows admin DB | `marketLiveEnabled` (DB+env) | `/grannskafferiet/marknad` cron + UI | Admin toggle in app settings |

---

## Quick prod snapshot (@ master `apphosting.yaml`)

**Explicitly on in yaml:** all UX v2 flags, brain feedback/rank/proactive, learning trio, home redesign, price memory, W1 share, receipt estimates, store recommendation v0, receipt AI batch, global shelf-life DB, recipe/photo LLM passes, auto-finish cron.

**On via code default only when absent from yaml:** none for Brain (all listed explicitly as of 2026-06-23).

**Off via code default:** Tier C / kill switches only (see table below).

**Tier C / kill switches off unless noted:** city feed, Kivra forward; `STRIPE_CHECKOUT_DISABLED=true`; email sending enabled in prod.

---

## Local dev cheat sheet

From [`.env.example`](../.env.example) — uncomment to **disable** locally:

```bash
# SHELF_LIFE_LEARNING_ENABLED=false
# BRAIN_FEEDBACK_V1_ENABLED=false
# HOME_UX_V2_ENABLED=false
# SHOPPING_UX_V2_ENABLED=true   # example: force on locally (needs exact true)
```

Prod brain backend is largely **on**; missing UI is usually **data** (no receipt history → no replenishment → no feedback), not flags.

---

## Maintenance

When adding a flag:

1. Register env key + `is*Enabled()` in `feature-flags.ts` (and `getAllFeatureFlagSnapshot` if admin readout exists).
2. Set prod value in `apphosting.yaml` on merge (deploy = publish).
3. Pass to layout only if client components need it.
4. Update this file in the same PR.
