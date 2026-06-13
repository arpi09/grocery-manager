# Feature Adoption Initiative — Skaffu

*Version: juni 2026. Adoption audit of seven shipped capabilities — discovery, activation, telemetry. No new major features.*

**Relaterade dokument:** [`HOUSEHOLD_GROWTH.md`](./HOUSEHOLD_GROWTH.md) · [`PRICE_MEMORY_STRATEGY.md`](./PRICE_MEMORY_STRATEGY.md) · [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) · [`drizzle/0046_household_os_events.sql`](../drizzle/0046_household_os_events.sql)

**Avgränsning:** Detta initiativ fokuserar på **synlighet och aktivering av befintliga funktioner** — discovery, copy, onboarding, telemetry. Uteslutet: nya större produktytor, produktionsdeploy eller flag-enablement.

---

## Executive summary

Skaffu already ships a strong **Household OS** layer (`HouseholdBriefing`, `InventoryIntelligenceService`, replenishment, waste, pantry health) on `/hem`, but adoption is capped because high-value surfaces compete for attention, several capabilities sit behind **collapsed "Mer på hem"** or **flag-gated** paths, and many features require **prior receipt/expiry data** before they appear. The biggest lever is not new product — it is making existing intelligence **visible by default**, tightening **post-receipt** and **post-list** loops, and closing **telemetry gaps** on briefing surfaces so adoption can be measured and iterated. Swedish-first copy is largely in place (`sv.json` / `en.json`); gaps are mostly **placement, empty/success states, and onboarding moments**, not missing translations.

---

## Per-capability scorecard

| Capability | Discover | Understand | Value path | Measurable | Adoption risk |
|------------|:--------:|:----------:|:----------:|:----------:|:-------------:|
| **1. Price Memory** | 2/5 | 3/5 | 3/5 | 3/5 | **High** |
| **2. Inventory Intelligence** | 3/5 | 4/5 | 4/5 | 3/5 | Medium |
| **3. Waste Prevention** | 4/5 | 4/5 | 4/5 | 4/5 | Low–Med |
| **4. Replenishment** | 3/5 | 4/5 | 3/5 | 5/5 | Medium |
| **5. Shopping Shares (W1)** | 1/5 | 3/5 | 2/5 | 4/5 | **Very high** |
| **6. Household Invites** | 3/5 | 3/5 | 2/5 | 4/5 | **High** |
| **7. Receipt Import + Autopilot** | 4/5 | 4/5 | 2/5 | 4/5 | Medium |

**Scoring:** 1 = buried / invisible · 5 = obvious in primary nav or home briefing.

---

## 1. Price Memory

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | Chip only in `PriceMemoryChip.svelte` → `InventoryTableRow.svelte`, `ReplenishmentSection.svelte`. No home briefing, nav, onboarding, or scan CTA. |
| **Understand** | `priceMemory.lastPaid` / `lastPaidWithStore` (sv/en). No tooltip explaining "from your receipts" or 365-day window. |
| **Value** | Needs receipt import with parsed `unitPrice` (`receipt-parse.ts`, `receipt_purchase_line` schema). Async fetch `/api/price-memory/last`. Silent empty when no data. |
| **Measurable** | `price_memory_viewed` (client, with `surface`). No capture-rate, empty-state, or first-price events. |
| **Adoption risk** | **High** — invisible until replenishment/inventory row; data-dependent. `PRICE_MEMORY_STRATEGY.md` is outdated (prices now in DB via `0044_receipt_price_memory.sql`). |

**Per-area gaps:** Hidden feature · weak empty (chip absent, no explanation) · no success state · poor discoverability · no first-run after receipt import.

---

## 2. Inventory Intelligence (Pantry Health)

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | `detectPantryHealthInsights()` via `InventoryIntelligenceService` → `HouseholdBriefing` (truncated) or standalone `PantryHealthInsights` when briefing absent. Stale also in `WeeklyRitualHero` / sync links. Not in nav. |
| **Understand** | Strong sv/en: `pantryHealth.stale`, `duplicate`, `overstock`. Briefing uses inline links, not section title "Skafferihälsa". |
| **Value** | One tap to `/inventory/synk`, `/inventory/merge`, or location. Needs ≥2 duplicates or overstock thresholds. |
| **Measurable** | `pantry_health_insight_shown` only from `PantryHealthInsights.svelte` — **not** from briefing health lines. `pantry_health_insight_clicked` (with `source: 'briefing'` on briefing). `home_briefing_viewed` includes counts. |
| **Adoption risk** | Medium — deprioritized when waste/replenishment dominate briefing budget (`briefingVisiblePantryHealth`). |

**Per-area gaps:** Duplicate surface logic (briefing vs standalone) · no "all good" success state · telemetry split · weak onboarding ("why stale matters").

---

## 3. Waste Prevention

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | Primary in `HouseholdBriefing` when `detectWasteAlert()` fires. Fallback `WastePreventionBanner` when briefing off. `EatFirstSection` in open disclosure when expiring. Expiring share in `EatFirstSection` (nearby/geo). |
| **Understand** | Clear `wastePrevention.copy` / `slowMoverCopy` / `action` (sv/en). |
| **Value** | Fast: briefing CTA → `#eat-first`. Requires items with `expiresOn` within `EXPIRING_SOON_DAYS`. |
| **Measurable** | `waste_alert_shown` (banner only), `waste_alert_clicked`, `waste_alert_resolved`, `waste_alert_actioned` (briefing). **Gap:** briefing waste card does not fire `waste_alert_shown`. |
| **Adoption risk** | Low when expiry data exists; zero visibility when users skip expiry (photo/barcode without dates). |

**Per-area gaps:** Missing shown telemetry on briefing · weak empty state for "no expiry dates set" · Grannskafferiet share buried in Eat First.

---

## 4. Replenishment

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | `HouseholdBriefing` (max 3 rows, compact). `/inkop`: inside `<details>` "Förslag", **open only when list empty** (`suggestionsOpen = hasSuggestions && !listHasItems`). Post-receipt loop CTA in briefing. |
| **Understand** | Good reason codes in `replenishment.reason.*`. Compact mode hides intro on home. Dedupe badges in briefing copy. |
| **Value** | Home: one-click "Lägg på listan". `/inkop`: extra fold expand when list populated. Price memory nested per row. |
| **Measurable** | Strong funnel: `replenishment_suggestion_shown/clicked/added/accepted/dismissed/actioned`, `duplicate_warning_*`, `receipt_loop_cta_*`. Dismiss server-only (OK). |
| **Adoption risk** | Medium — needs `receipt_purchase_line` history; **buried on `/inkop`** when users already use the list. |

**Per-area gaps:** Collapsed suggestions when list has items · no empty-state education on `/inkop` ("import receipt to unlock") · success = toast only.

---

## 5. Shopping Shares (W1)

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | `ShoppingListPanel` footer "Dela länk" — only if `PUBLIC_SHOPPING_LIST_SHARE_ENABLED=true` (**.env.example: off**). Same flag gates lista household banner. `/inkop` is header cart, not bottom tab. |
| **Understand** | Public `/lista/[token]` explains read-only snapshot well (`shoppingListShare.publicLead`). Footer label competes with Bring/AnyList export. |
| **Value** | Create list → footer share → clipboard/share sheet. Partner gets snapshot, not live sync; signup CTA = new solo household. |
| **Measurable** | Server: `shopping_list_share_created`. Public: `shopping_list_share_viewed`, `shopping_list_share_cta_clicked`. Missing: footer button click intent, share failures. |
| **Adoption risk** | **Very high** — flag off in prod, footer placement, W1 ≠ household join. |

**Per-area gaps:** Flag-hidden · weak in-app discoverability · lista→household bridge flag-gated · no in-app success ("link shared, invite partner for live sync").

---

## 6. Household Invites

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | Settings `#household`, global `HouseholdInvitePrompt` (solo + peak≥5 **or** day≥3 **or** export), `InkopHouseholdInviteBanner`, post-W1 `lista` banner (flag). Onboarding still points to settings, not invite. |
| **Understand** | Shopping-first copy (`householdInvite.*`). Settings still "Hushåll" admin frame. W4 share-invite creates **editor** role ([`share-invite/+server.ts`](../src/routes/api/household/share-invite/+server.ts) rad 22). |
| **Value** | Multi-step: prompt → `/settings` or share-invite API → `/invite/[token]` accept. Export path triggers `export_prompt` copy but modal timing is inventory/time-based. |
| **Measurable** | `household_invite_prompt_*`, `household_invite_created` (context: inkop/lista/settings). **Missing:** `household_invite_accepted`, settings-context on email invites. |
| **Adoption risk** | **High** — wrong moment for global modal; lista path flag-gated; no post-accept celebration. |

**Per-area gaps:** Settings-deep primary path · export not in global prompt gate (only `hasShoppingListExported` in inkop engagement) · missing accept telemetry · weak success state.

---

## 7. Receipt Import + Autopilot

### Analysis

| Question | Finding |
|----------|---------|
| **Discover** | Scan primary nav → hub → receipt tile. Home empty state + onboarding receipt path. **Autopilot in "Mer på hem"** (default closed); nudge block only after 3 dismissals. Post-import briefing finish + receipt loop CTA. |
| **Understand** | Receipt flow well documented in UI. `receiptAutopilot.intro` exists but hidden in nested disclosure. |
| **Value** | Import: upload → parse → review → bulk add (high friction). Autopilot patterns need repeat imports. Price memory compounds on same path. |
| **Measurable** | `receipt_import_started`, `receipt_uploaded/parsed`, `receipt_review_completed`, `receipt_autopilot_accepted`, `receipt_finish_accepted`, `receipt_loop_cta_*`. **Missing:** `receipt_autopilot_shown`, dismiss events. |
| **Adoption risk** | Medium — import discoverable; **autopilot and price memory adoption** low due to burial after first import. |

**Per-area gaps:** Autopilot buried · weak success after first import beyond briefing window · no telemetry on autopilot impressions.

---

## Cross-cutting gaps

| Gap | Impact |
|-----|--------|
| **"Mer på hem"** hides autopilot, engagement, savings, activity | Cuts ~50% of secondary feature discovery |
| **Household Briefing gating** (`hasActionableContent` + `totalItems > 0`) | When briefing off, fallback surfaces are weaker/duplicated |
| **`/inkop` not in bottom nav** | Shopping + replenishment + share underused on mobile |
| **Feature flags** W1 (`PUBLIC_SHOPPING_LIST_SHARE_ENABLED`), W2 (`PUBLIC_CITY_FEED_ENABLED`) | Zero prod adoption until deliberate enable |
| **Data prerequisites** | Receipt lines → replenishment/price memory; expiry dates → waste |
| **Telemetry inconsistency** | Briefing shows waste/health without `*_shown` events |
| **Success states** | Toasts only; no celebration for first replenishment accept, first price chip, invite accepted |
| **i18n** | sv/en parity good; needs tooltip/education keys, not new feature copy |

---

## Prioritized implementation tasks

| # | Capability | Problem | Proposed change | Effort | Lever | Files likely touched |
|---|------------|---------|-----------------|--------|-------|----------------------|
| 1 | Replenishment | Suggestions folded closed when list has items | Show count badge on `/inkop` summary; default `open` when `replenishment.length > 0`; optional one-line teaser above fold | S | discovery | `src/routes/inkop/+page.svelte`, `sv.json`/`en.json` |
| 2 | Receipt Import | Autopilot buried in "Mer på hem" | After first `receipt_review_completed`, surface compact autopilot **above** "Mer" for 7 days; strengthen `receipt_loop_cta` placement | M | activation | `HomeDashboard.svelte`, `receipt-import-session.ts`, `HouseholdBriefing.svelte` |
| 3 | Price Memory | Users don't know chip exists | Add `priceMemory.tooltip` + `aria-description` on chip; first-import toast "Pris sparas från kvitton"; show chip in briefing replenishment rows (already partial) | S | discovery | `PriceMemoryChip.svelte`, `sv.json`/`en.json`, `ReceiptBulkAddFlow.svelte` |
| 4 | Inventory Intelligence | `pantry_health_insight_shown` misses briefing | Fire shown events from `HouseholdBriefing` health lines with `source: 'briefing'` | S | measurable | `HouseholdBriefing.svelte`, `product-events.ts` |
| 5 | Waste Prevention | Briefing waste card missing `waste_alert_shown` | Mirror `WastePreventionBanner` tracking in briefing waste block | S | measurable | `HouseholdBriefing.svelte` |
| 6 | Shopping Shares | Flag off + footer burial | When flag on: promote "Dela länk" to panel action row with icon; post-share lista invite always (not only flag); copy diff vs export | M | discovery | `ShoppingListPanel.svelte`, `sv.json` |
| 7 | Household Invites | Global modal wrong moment | After `shopping_list_export`, show `export_prompt` modal within 24h (O4); add post-accept toast on `/hem` | M | activation | `household-invite-prompt.ts`, `HouseholdInvitePrompt.svelte`, `invite/[token]/+page.server.ts` |
| 8 | Replenishment | Empty `/inkop` suggestions | Empty state in fold: "Importera kvitto för köp-igen-förslag" + CTA to `/scan/kvitto` | S | activation | `ReplenishmentSection.svelte` or `inkop/+page.svelte`, i18n |
| 9 | Receipt Import | No autopilot impression metrics | Add `receipt_autopilot_shown`, `receipt_autopilot_dismissed` | S | measurable | `ReceiptAutopilotSection.svelte`, `pmf.ts`, `product-events.ts`, migration comment |
| 10 | Waste Prevention | No expiry → no waste UX | Pantry status line on home: "Lägg till utgångsdatum för påminnelser" when `withoutExpiryCount > 0` | S | discovery | `HomeDashboard.svelte`, i18n |
| 11 | Household Invites | No accept funnel metric | `household_invite_accepted` on `acceptInvite` | S | measurable | `invite/[token]/+page.server.ts`, `pmf.ts` |
| 12 | Price Memory | No capture measurement | `receipt_price_captured` (lines with unitPrice) on import complete | S | measurable | `receipt-import.ts` or bulk create action |
| 13 | Shopping Shares | No click-before-create | Client `shopping_list_share_clicked` on footer button | S | measurable | `ShoppingListPanel.svelte`, `client/product-events.ts` |
| 14 | Inventory Intelligence | "All good" invisible | Briefing success line when pantry healthy + no waste: "Skafferiet ser bra ut" | S | adoption | `household-briefing.ts`, `HouseholdBriefing.svelte`, i18n |
| 15 | All | `/inkop` discoverability | Bottom nav badge when `shoppingListCount > 0` or replenishment count | M | discovery | `nav-config.ts`, `MainNavMobile.svelte`, layout load |

---

## Top 10 quick wins (≤1 day each)

1. Fire `waste_alert_shown` from `HouseholdBriefing` waste card.
2. Fire `pantry_health_insight_shown` from briefing health lines.
3. Default-open `/inkop` suggestions fold when replenishment rows exist.
4. Add `priceMemory.tooltip` (sv/en) + accessible description on chip.
5. Replenishment empty CTA → receipt scan on `/inkop`.
6. `receipt_autopilot_shown` on `ReceiptAutopilotSection` mount.
7. `household_invite_accepted` server event on invite accept.
8. `shopping_list_share_clicked` before API call.
9. Post-receipt toast mentioning price memory + replenishment on `/inkop`.
10. Briefing subtitle one-liner explaining priority order ("Utgående först, sedan inköp").

---

## Suggested event additions (measurement gaps only)

| Event | When | Metadata |
|-------|------|----------|
| `receipt_autopilot_shown` | Autopilot section visible | `count`, `surface` (hem/mer) |
| `receipt_autopilot_dismissed` | Dismiss pattern/finish | `normalizedKey`, `kind` |
| `household_invite_accepted` | `acceptInvite` success | `context`, `role` |
| `shopping_list_share_clicked` | Footer share tap | `itemCount`, `memberCount` |
| `receipt_price_captured` | Import completes | `linesWithPrice`, `totalLines` |
| `price_memory_empty` | Chip fetch returns null (sampled) | `normalizedKey`, `surface` |
| `replenishment_fold_opened` | User expands `/inkop` suggestions | `hadListItems`, `suggestionCount` |

---

## Top 5 priorities (executive)

1. **Unbury replenishment on `/inkop`** — default-open suggestions + badge when the list already has items; highest-impact activation lever for an existing API.
2. **Strengthen post-receipt loop** — keep autopilot and receipt-loop CTAs above "Mer på hem" for a defined window after import; ties receipt → replenishment → price memory.
3. **Close briefing telemetry gaps** — `waste_alert_shown` and `pantry_health_insight_shown` from `HouseholdBriefing` so Household OS metrics match reality.
4. **Price memory education** — tooltip + first-import success copy; chip is built but invisible to users who don't know receipts power it.
5. **Shopping/household coordination** — when W1 flag is enabled, elevate share CTA and tighten lista → household invite bridge; add `household_invite_accepted` to measure expansion, not just invites sent.

---

## Relaterade dokument

| Dokument | Koppling |
|----------|----------|
| [`HOUSEHOLD_GROWTH.md`](./HOUSEHOLD_GROWTH.md) | Hushållsexpansion, W1/W4 invite-bryggor |
| [`PRICE_MEMORY_STRATEGY.md`](./PRICE_MEMORY_STRATEGY.md) | Prisminne från kvitton |
| [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) | Acquisition > activation |
| [`ACQUISITION_WEDGES.md`](./ACQUISITION_WEDGES.md) | W1 lista, W4 inkop-invite |
| [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) | Veckobaseline för adoption-mått |

---

*Genererat 2026-06-13. Revidera efter implementation av quick wins och PMF-baseline.*
