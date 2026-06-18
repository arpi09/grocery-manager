# Shopping V2 — Implementation Plan (Plan + Trip modes)

## Success condition

User can open `/inkop`, add a memory suggestion, press **Börja handla**, complete the trip, and update the pantry — **without** using the legacy checkbox list as the primary surface.

## KPIs

| Priority | Metric | Target / cadence |
|----------|--------|------------------|
| **Primary** | `trip_completed` / `trip_started` | **> 60%** completion rate |
| **Secondary** | `memory_suggestion_added` | Monitor weekly |

## Locked product rules (v1)

- **No skip / snooze / remind later** in Shop mode — core loop is Plan → Shop → Pick → Pantry only.
- **Max 3 memory suggestions** visible in Plan mode — no carousel, horizontal scroll, or “show more”.

**Scope:** `/inkop` only · **Flag:** `SHOPPING_UX_V2_ENABLED`  
**Copy source:** [`copy/shopping-v2.sv.md`](copy/shopping-v2.sv.md), [`copy/shopping-v2.en.md`](copy/shopping-v2.en.md)  
**Design lock:** [`LOCK.md`](LOCK.md) · Mockups: [`screens/shopping-plan.html`](screens/shopping-plan.html), [`screens/shopping-trip.html`](screens/shopping-trip.html)

**Not in this phase:** Home Household Briefing, Pantry Shelf View.

---

## 1. Scope

| In | Out |
|----|-----|
| Replace checkbox CRUD list as **primary** surface when flag on | New routes (stay on `/inkop`) |
| Plan mode: memory-first suggestions + pill summary | Illustration variants or new art |
| Shop mode: focus item, progress, peek queue, large checkoff | Dual SV+EN on same production screen |
| Mode toggle Plan ↔ Shop (client state machine) | Full removal of legacy list (keep behind flag off) |
| Legacy `ShoppingListPanel` + `ReplenishmentSection` fold when flag off | Home / Pantry implementation |
| Pantry bridge on checkoff (existing `shopping-to-pantry` domain) | Server-persisted "trip session" (v1 = client-only) |
| Telemetry for trip lifecycle | |

**Route:** `/inkop` (unchanged). Optional query `?mode=shop` for deep-link from Home later; default `plan`.

---

## 2. Interaction model

### 2.1 State machine (client-only trip session)

```
                    ┌─────────────┐
         flag off   │  LEGACY     │
                    │  checkbox   │
                    └─────────────┘

flag on:
                    ┌─────────────┐
         load       │    PLAN     │◄────────────────┐
                    └──────┬──────┘                 │
                           │ start shop / toggle    │ back / complete
                           ▼                        │
                    ┌─────────────┐                 │
                    │    SHOP     │─────────────────┘
                    │  (focus)    │
                    └──────┬──────┘
                           │ last item checked
                           ▼
                    ┌─────────────┐
                    │  COMPLETE   │ → pantry CTA or back to PLAN
                    └─────────────┘
```

**Persistence (v1):**

- **Mode** + **focus index** in `sessionStorage` key `skaffu-shopping-v2-{householdId}` (mirrors existing `home-pantry-inkop-replenishment-open` pattern).
- **Checked state** = existing `shopping_list_items.checked` via `ShoppingListService.toggleChecked` — no new DB table for trip session.
- On flag off or household switch: clear session key.

**ShoppingTripService (client presenter layer):**

- Pure functions over unchecked items: `getFocusItem()`, `getPeekQueue(n=3)`, `getProgress()`, `advanceAfterCheck()`.
- Does **not** duplicate CRUD; delegates mutations to existing form actions / API.

### 2.2 Mode toggle UX

- **Plan:** full-width segmented control below page title (mockup). Both tabs keyboard-focusable; `role="tablist"` / `role="tab"`.
- **Shop:** compact toggle in top bar + text link "Planera" / "Plan" (`shopping.v2.shop.backToPlan`).
- Switching Plan → Shop: if list empty, stay on Plan with inline message (`shopping.v2.shop.progressEmpty`).
- Switching Shop → Plan: preserve list state; no auto-uncheck.
- Emit `shopping_mode_switched` with `{ from, to, uncheckedCount }`.

### 2.3 Trip progress & checkoff

- Progress bar: `picked / total` unchecked at trip start + checked during session. SR text via `shopping.v2.shop.progressAria`.
- **Focus item:** largest text on screen; illustration optional (final `shopping-trip.svg`).
- **Primary CTA:** `min-height: 3.5rem` (56px) — `shopping.v2.shop.pickCta`.
- On pick: existing `toggleChecked` action → optional pantry bridge sheet (reuse `ShoppingToPantrySheet`) → advance focus index → `trip_item_checked`.
- **Peek queue:** horizontal scroll of next 3 unchecked names + `+N till` pill; not interactive in v1 (no jumping to item).

### 2.4 Memory-first suggestions (Plan mode)

- **Replace** collapsed `<details>` suggestions fold as primary surface when flag on.
- Reuse data: `replenishmentSuggestions` + `dedupeByKey` from `inventoryIntelligenceService.getHomeIntelligence` (same as today `+page.server.ts` load).
- New presentation: `MemorySuggestionCard` rows (icon, name, cadence line, + Lägg till).
- Accept path: existing `/api/replenishment/accept` — **must** call `invalidateAll()` after success (fix gap in current `ReplenishmentSection` which only filters local state).
- Dismiss / brain feedback: optional v1 — keep `ReplenishmentSection` logic in molecule or share accept handler.
- Section label: `shopping.v2.memory.sectionLabel` ("Skaffu minns") — not "AI förslag".

### 2.5 List summary (Plan mode)

- Pills for count + first ~3 item names + `+N till` — **not** checkbox rows on primary surface.
- "Börja handla" CTA switches to Shop mode (not navigation).
- Overflow menu: export, smart fill, share, "Visa som checklista" opens legacy panel in drawer or below fold.

### 2.6 ReplenishmentSection integration

| Flag | Behavior |
|------|----------|
| `SHOPPING_UX_V2` off | Current layout: `ShoppingListPanel` + `<details>` fold with `ReplenishmentSection` + `SmartShoppingFill` |
| `SHOPPING_UX_V2` on | `ShoppingV2PlanView` with `MemorySuggestionList` (replenishment data) + `TripSummaryPills`; legacy list in overflow/drawer only |
| Both | `SmartShoppingFill` moves to overflow until Home V2 links recipe → list |

---

## 3. Atomic design component map

### Atoms (create or extend)

| Component | Path | Notes |
|-----------|------|-------|
| `ProgressBar` | `src/lib/components/atoms/ProgressBar.svelte` | 8px track, ARIA `progressbar` |
| `SegmentedControl` | `src/lib/components/atoms/SegmentedControl.svelte` | Mode toggle; or extend `Toggle` pattern |
| `Pill` | `src/lib/components/atoms/Pill.svelte` | List summary chips |
| `SceneIllustration` | `src/lib/components/atoms/SceneIllustration.svelte` | Wrapper for final SVGs from `static/illustrations/v2/` |

### Molecules

| Component | Path | Notes |
|-----------|------|-------|
| `ShoppingModeToggle` | `src/lib/components/molecules/ShoppingModeToggle.svelte` | Plan/Shop tabs |
| `MemorySuggestionCard` | `src/lib/components/molecules/MemorySuggestionCard.svelte` | Replenishment row |
| `TripSummaryPills` | `src/lib/components/molecules/TripSummaryPills.svelte` | Count + name pills |
| `TripProgressHeader` | `src/lib/components/molecules/TripProgressHeader.svelte` | Meta + bar |
| `FocusItemCard` | `src/lib/components/molecules/FocusItemCard.svelte` | Name + detail + illus |
| `PeekQueueRow` | `src/lib/components/molecules/PeekQueueRow.svelte` | Horizontal next items |
| `ShoppingPickButton` | `src/lib/components/molecules/ShoppingPickButton.svelte` | 56px CTA |
| `TripCompleteCard` | `src/lib/components/molecules/TripCompleteCard.svelte` | Completion state |

### Organisms

| Component | Path | Notes |
|-----------|------|-------|
| `ShoppingV2PlanView` | `src/lib/components/organisms/ShoppingV2PlanView.svelte` | Plan mode layout |
| `ShoppingV2ShopView` | `src/lib/components/organisms/ShoppingV2ShopView.svelte` | Shop mode layout |
| `ShoppingV2Page` | `src/lib/components/organisms/ShoppingV2Page.svelte` | Mode router + session |
| `ShoppingLegacyDrawer` | `src/lib/components/organisms/ShoppingLegacyDrawer.svelte` | Checkbox list overflow |

### Templates / routes

| File | Change |
|------|--------|
| `src/routes/inkop/+page.svelte` | Branch on `data.shoppingUxV2Enabled` |
| `src/routes/inkop/+page.server.ts` | Pass flag + unchanged load payload |

### Domain / client services

| File | Role |
|------|------|
| `src/lib/domain/shopping-trip.ts` | Pure trip index/progress helpers |
| `src/lib/client/shopping-trip-session.ts` | sessionStorage read/write |
| `src/lib/client/shopping-trip.service.ts` | `ShoppingTripService` — orchestrates focus/peek over items |

---

## 4. SOLID boundaries

| Layer | Responsibility |
|-------|----------------|
| `ShoppingListService` | CRUD, check state, add suggested items — **unchanged** |
| `ShoppingTripService` (client) | Presentation order, focus index, mode — **no DB** |
| `PurchasePatternService` / intelligence | Replenishment suggestion **data** — unchanged |
| `ReplenishmentSection` / `MemorySuggestionCard` | UI; accept → API |
| `shopping-ux-v2-flag.ts` | Re-export `isShoppingUxV2Enabled` from `feature-flags.ts` |
| `+page.server.ts` | Load flag + list data; actions stay on existing shopping actions |

**Presenters:** `buildPlanHeader()`, `buildMemoryLine(suggestion)` in `src/lib/domain/shopping-v2-presenter.ts` (pure, testable).

---

## 5. Data / API

### Existing (reuse)

| Action / endpoint | Use in V2 |
|-------------------|-----------|
| `+page.server.ts` actions: `addItem`, `toggleChecked`, `removeItem`, `clearChecked`, `smartFill` | Checkoff, add, remove |
| `/api/replenishment/accept` | Memory card "+ Lägg till" |
| `/api/replenishment/dismiss` | Optional dismiss |
| `shoppingToPantryService` + sheet | Post-checkoff pantry bridge |
| `inventoryIntelligenceService.getHomeIntelligence` | `replenishmentSuggestions`, `dedupeByKey` |

### New state (v1)

| Item | Decision |
|------|----------|
| Trip session DB | **No** — client sessionStorage only |
| Trip sort order | Use existing `sortOrder` on list items; peek = next unchecked by sort |
| Store name in subtitle | Optional: from last receipt merchant or user ritual label — defer if no data |
| `invalidateAll` on accept | **Yes** — fix in memory accept handler |

### Load payload addition

```ts
shoppingUxV2Enabled: isShoppingUxV2Enabled()
```

Pass through `+layout.server.ts` if needed for nav consistency (optional).

---

## 6. i18n

- Add `shopping.v2` namespace to `src/lib/i18n/locales/sv.json` and `en.json` from copy package.
- Register keys in `messages.ts` if using strict `MessageKey` typing.
- **Do not** add EN strings to SV production components.
- Legacy `shopping.*` keys remain for flag-off path.

---

## 7. Telemetry (`pmf.ts` migration)

Add to `PRODUCT_EVENT_TYPES` in `src/lib/domain/pmf.ts`:

| Event | Payload | When |
|-------|---------|------|
| `trip_started` | `{ uncheckedCount, source: 'cta' \| 'toggle' \| 'deeplink' }` | Enter Shop mode with items |
| `trip_item_checked` | `{ itemId, position, remaining }` | Successful pick |
| `trip_completed` | `{ total, durationMs? }` | Last item checked |
| `shopping_mode_switched` | `{ from, to, uncheckedCount }` | Toggle Plan/Shop |

- Emit via `trackProductEvent` (client) — same pipeline as `replenishment_fold_opened`.
- Add to `schema.ts` product_event enum if DB-enforced.
- Keep existing `shopping_checkoff_to_pantry`, `shared_checkoff` for pantry bridge.

---

## 8. WCAG AA

| Requirement | Implementation |
|-------------|----------------|
| Checkoff target 48–56px | `ShoppingPickButton` min-height 3.5rem |
| Keyboard | Toggle tabs roving tabindex; pick button Enter/Space; peek row arrow scroll |
| Focus visible | Use existing focus ring tokens from `app.css` |
| Progress | `role="progressbar"` + `aria-valuenow` / `aria-valuemax` + visible text |
| Live region | On pick: `aria-live="polite"` "{name} plockad" / "{name} picked" |
| Illustrations | `aria-hidden="true"` on decorative SVG; label on wrapper only |
| Color | Progress fill + warning bands not sole indicator (text always present) |

Run `e2e/accessibility.spec.ts` on `/inkop` with flag on.

---

## 9. Mobile-first

| Target | Guideline |
|--------|-----------|
| Viewport | 390×844 primary; safe areas via `--content-bottom-safe` |
| Thumb zone | Pick CTA bottom third of focus zone; mode toggle top |
| One-handed | No required horizontal precision except peek scroll |
| Plan scroll depth | Memory (max 3–5 cards) + summary + CTA visible without scroll on typical list (≤9 items) |
| Shop scroll depth | Progress + focus + CTA above fold; peek at bottom |
| Bottom nav | Unchanged — Inköp tab active |

---

## 10. Rollout

### Feature flag

```ts
// feature-flags.ts
SHOPPING_UX_V2: 'SHOPPING_UX_V2_ENABLED'
export function isShoppingUxV2Enabled(): boolean {
  return isEnvTrue(FEATURE_FLAG_ENV.SHOPPING_UX_V2);
}
```

```yaml
# apphosting.yaml
- variable: SHOPPING_UX_V2_ENABLED
  value: "false"
```

Local dev: `.env` `SHOPPING_UX_V2_ENABLED=true` for USER_LOCAL.

### Canary → full

1. Deploy with flag `false` (code ship, no user impact).
2. Enable `true` for internal households / staging.
3. **10% canary:** Firebase/App Hosting env per cohort if available, else manual household allowlist in app settings (future) — v1: manual enable week 1.
4. **Full:** flip yaml to `true` after 2 weeks green metrics.

### Kill criteria (consumer UX reset alignment)

Kill or revert flag to `false` if any **two** of these hold for 14 days post-canary:

| Signal | Threshold |
|--------|-----------|
| `/inkop` bounce rate | ↑ >25% vs legacy baseline |
| `trip_completed` / `trip_started` | < 30% completion |
| Shopping list weekly active (households with ≥1 checkoff) | ↓ >15% vs pre-ship |
| Critical E2E or prod smoke | Any regression on checkoff → pantry |
| Support / error rate on `/inkop` | ↑ >2× baseline |

Rollback = yaml `false` + deploy (kill switch only per release model). No data migration to undo.

---

## 11. Files touched (estimate ~18–24)

| Area | Files |
|------|-------|
| Flag | `feature-flags.ts`, `shopping-ux-v2-flag.ts`, `feature-flags.test.ts`, `apphosting.yaml`, `.env.example` |
| Route | `inkop/+page.svelte`, `inkop/+page.server.ts`, optional `+layout.server.ts` |
| Domain | `shopping-trip.ts`, `shopping-v2-presenter.ts`, tests |
| Client | `shopping-trip-session.ts`, `shopping-trip.service.ts` |
| Components | 4 atoms, 7 molecules, 4 organisms (see §3) |
| i18n | `sv.json`, `en.json`, maybe `messages.ts` |
| Telemetry | `pmf.ts`, `schema.ts`, `product-events/+server.ts` |
| Static | Copy final SVGs to `static/illustrations/v2/shopping-plan.svg`, `shopping-trip.svg` |
| Tests | unit + component + `e2e/shopping-v2.spec.ts` |
| Docs | `CURRENT_REALITY.md` flag row |

**Unchanged but referenced:** `ShoppingListService`, `ShoppingListPanel`, `ReplenishmentSection`, `ShoppingToPantrySheet`, `SmartShoppingFill`.

---

## 12. Test plan

### Unit

- `shopping-trip.ts`: progress, peek queue, empty list, last item
- `shopping-v2-presenter.ts`: subtitle variants, memory cadence lines

### Component (Vitest + @testing-library/svelte)

- `ShoppingModeToggle`: keyboard, active state
- `ShoppingV2ShopView`: pick advances focus (mock toggle action)
- `MemorySuggestionCard`: accept calls invalidate

### Integration

- `inkop` load with flag on returns `shoppingUxV2Enabled: true`
- `toggleChecked` action still works from Shop mode form

### E2E (`@deploy-critical`)

New `e2e/shopping-v2.spec.ts` (flag forced via env in test harness or test household setting):

1. Open `/inkop` → see Plan mode (no checkbox rows in primary view)
2. Toggle to Shop → focus item visible
3. Pick item → progress updates
4. Toggle back to Plan → pill summary reflects check

Extend `e2e/shopping.spec.ts`: when flag off, existing tests unchanged.

### Manual USER_LOCAL

- iPhone 390×844: Plan above-fold, Shop one-thumb pick
- Partner sync: checkoff visible on second device after refresh (existing realtime if any) or invalidate

---

## 13. Implementation sequence (PR slices)

1. **Flag + domain** — no UI change visible
2. **i18n keys** — copy package → json
3. **Atoms/molecules** — Storybook or mockup parity
4. **ShoppingV2PlanView** — memory + pills
5. **ShoppingV2ShopView** — focus + pick + progress
6. **Route branch + session** — wire flag
7. **Telemetry + invalidateAll fix**
8. **E2E + a11y**
9. **CURRENT_REALITY + canary enable**

---

## 14. Open decisions (resolve before PR 1)

| # | Question | Default |
|---|----------|---------|
| 1 | Trip label ("Fredagshandling") source | Weekly ritual weekday name if configured; else `shopping.v2.plan.titleDefault` |
| 2 | Legacy list in V2 | Collapsed drawer via overflow, not removed |
| 3 | Skip item in Shop mode | v1: omit skip; v1.1 if user testing requests |
| 4 | Illustration hosting | `static/illustrations/v2/` copies from `docs/design/.../final/` |
