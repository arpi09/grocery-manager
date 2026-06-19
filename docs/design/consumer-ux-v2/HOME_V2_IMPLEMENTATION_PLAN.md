# Home V2 — Household Briefing (Concept A)

## Success condition

User opens `/hem`, sees **time-neutral greeting** + **status line** + **ONE För dig card** + **quick glance chips** — **without** relying on v5 dashboard widgets as the primary path when `HOME_UX_V2_ENABLED` is on.

## KPIs

| Priority | Metric | Target / cadence |
|----------|--------|------------------|
| **Primary** | `for_you_cta_tapped` → destination completed | **> 50%** completion (recipe add / replenishment accept / shop start / pantry view) |
| **Secondary** | `home_briefing_opened` | Monitor weekly |
| **Guard** | v5 widget scroll depth (when both flags off in canary) | N/A — v6 replaces v5 when shipped |

**Scope:** `/hem` only · **Flag:** `HOME_UX_V2_ENABLED`  
**Copy source:** [`copy/home-briefing.sv.md`](copy/home-briefing.sv.md), [`copy/home-briefing.en.md`](copy/home-briefing.en.md)  
**Design lock:** [`LOCK.md`](LOCK.md) · Mockup: [`screens/home.html`](screens/home.html)  
**Architecture template:** [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](SHOPPING_V2_IMPLEMENTATION_PLAN.md), [`PANTRY_V2_IMPLEMENTATION_PLAN.md`](PANTRY_V2_IMPLEMENTATION_PLAN.md)

**Replaces:** `HOME_REDESIGN_V1` (v5) when Home V2 ships — v5 stays until then; flag canary only.

---

## 1. Scope

| In | Out |
|----|-----|
| Replace v5 dashboard + legacy card grid as **primary** surface when flag on | New routes (stay on `/hem`) |
| Time-neutral greeting + single status sentence | Morning/evening hero bands (v5 pattern) |
| **One** primary För dig card (recipe → replenishment → expiring → shop ready) | Skip / snooze / carousel of cards |
| Quick glance chips (use soon, shopping, household, pantry) | Full v5 compact-row widgets |
| Hero + For you illustrations | Illustration variants or new art |
| Legacy `HomeDashboard` / `HomeRedesignDashboard` when flag off | Full removal of v5 (keep behind flags) |
| Deep-link to Shopping V2 shop mode, pantry shelf, settings | Nav rename beyond existing Tier A |

**Route:** `/hem` (unchanged). Shopping handoff: `/inkop?mode=shop` when list ready.

---

## 2. Interaction model

### 2.1 Flag branching

```
                    ┌─────────────┐
         flag off   │  LEGACY     │
                    │  v4 cards OR│
                    │  v5 if      │
                    │  HOME_REDESIGN_V1
                    └─────────────┘

flag on (HOME_UX_V2):
                    ┌─────────────┐
         load       │  BRIEFING   │
                    │  greeting   │
                    │  status     │
                    │  1× För dig │
                    │  chips      │
                    └─────────────┘
```

**Persistence (v1):** No briefing session DB. For-you priority recomputed on each load from intelligence + list + pantry.

### 2.2 Status line (single sentence)

Priority (first match wins):

1. `emptyPantry` — `totalItems === 0`
2. `useSoonAndList` — use-soon count > 0 **and** list ready (items + cadence weekday)
3. `useSoonOnly` — use-soon only
4. `listReady` — list ready for cadence weekday
5. `listItems` — list has items, no ritual weekday
6. `allGood` — quiet week

### 2.3 För dig card (one primary)

Priority (first match wins — **no skip concepts**):

1. **Recipe** — meal suggestion using expiring stock (when data available)
2. **Replenishment** — top memory suggestion
3. **Expiring** — nearest use-soon item
4. **Shop ready** — unchecked list items + cadence weekday

CTA routes: replenishment → accept API; expiring → pantry/item; shop ready → `/inkop?mode=shop`; recipe → add missing + shop (PR3+).

### 2.4 Quick glance chips

| Chip | Target |
|------|--------|
| Use soon | Pantry shelf / expiring filter |
| Shopping | `/inkop` (Plan or Trip per Shopping V2 flag) |
| Household synced | Settings / household |
| Pantry | `/inventory` (shelf when Pantry V2 on) |

---

## 3. Atomic design component map

### Atoms (create or extend)

| Component | Path | Notes |
|-----------|------|-------|
| `SceneIllustration` | existing | `home-hero.svg`, `for-you.svg` |
| `Pill` / chip | existing | Quick glance row |

### Molecules

| Component | Path | Notes |
|-----------|------|-------|
| `HomeBriefingHeader` | `src/lib/components/molecules/HomeBriefingHeader.svelte` | Brand + household switcher |
| `HomeBriefingGreeting` | `src/lib/components/molecules/HomeBriefingGreeting.svelte` | Time-neutral hi + status |
| `HomeBriefingForYouCard` | `src/lib/components/molecules/HomeBriefingForYouCard.svelte` | Single card + CTA |
| `HomeBriefingChips` | `src/lib/components/molecules/HomeBriefingChips.svelte` | Quick glance row |

### Organisms

| Component | Path | Notes |
|-----------|------|-------|
| `HomeV2BriefingView` | `src/lib/components/organisms/HomeV2BriefingView.svelte` | Full mockup layout |
| `HomeV2Page` | `src/lib/components/organisms/HomeV2Page.svelte` | Load/error wrapper |

### Templates / routes

| File | Change |
|------|--------|
| `src/routes/(app)/hem/+page.svelte` | Branch on `homeUxV2Enabled` |
| `src/routes/(app)/hem/+page.server.ts` | Pass flag + briefing inputs |
| `src/routes/+layout.server.ts` | Pass `homeUxV2Enabled` |

### Domain / client

| File | Role |
|------|------|
| `src/lib/domain/home-briefing.ts` | Status line + For-you priority (pure) |
| `src/lib/domain/home-briefing-presenter.ts` | i18n key + param assembly (PR2) |
| `src/lib/client/home-v2-telemetry.ts` | Events (PR4) |

---

## 4. SOLID boundaries

| Layer | Responsibility |
|-------|----------------|
| `inventoryIntelligenceService.getHomeIntelligence` | Replenishment + health data — **unchanged** |
| `home-briefing.ts` | Pure selection over load payload — **no DB** |
| `HomeV2BriefingView` | UI; CTAs delegate to existing actions/routes |
| `home-ux-v2-flag.ts` | Re-export `isHomeUxV2Enabled` from `feature-flags.ts` |
| `+page.server.ts` | Load summary, intelligence, cadence, flag |

---

## 5. Data / API

### Existing (reuse)

| Source | Use in V2 |
|--------|-----------|
| `getDashboard` | `expiringSoon`, `totalItems` |
| `getHomeIntelligence` | `replenishment` |
| `listUncheckedItems` | shopping count |
| `getHouseholdShoppingCadence` | weekday for status + shop-ready card |
| `/api/replenishment/accept` | Replenishment CTA |

### New state (v1)

| Item | Decision |
|------|----------|
| Briefing layout DB | **No** |
| Recipe card data | Defer to PR3 — domain types ready in PR1 |
| v5 coexistence | `HOME_UX_V2` wins when both on (document in rollout) |

---

## 6. i18n

- Namespace `home.v6.*` in `sv.json` and `en.json` from copy package.
- **Do not** add EN strings to SV production components.
- Legacy `home.v5.*` remains for flag-off v5 path.

---

## 7. Telemetry (`pmf.ts`)

Add to `PRODUCT_EVENT_TYPES` (PR4):

| Event | Payload | When |
|-------|---------|------|
| `home_briefing_opened` | `{ statusKey, forYouKind }` | Briefing load with flag on |
| `for_you_cta_tapped` | `{ kind, destination }` | Primary card CTA |
| `home_chip_tapped` | `{ chip }` | Quick glance chip |

---

## 8. WCAG AA

| Requirement | Implementation |
|-------------|----------------|
| Greeting | `h1` — time-neutral, no time-of-day surprise |
| Status | Visible text, not color-only |
| One card | Single `h2`/section label "För dig" |
| Chips | ≥ 48px touch targets, `aria-label` per chip |
| Illustrations | Decorative `aria-hidden`; `home.v6.*.illustrationAria` on wrapper |

Run `e2e/accessibility.spec.ts` on `/hem` with flag on (PR5).

---

## 9. Mobile-first

| Target | Guideline |
|--------|-----------|
| Viewport | 390×844 primary |
| Above fold | Greeting + status + För dig card top |
| Bottom nav | Unchanged — Hem tab active |

---

## 10. Rollout

### Feature flag

```ts
// feature-flags.ts
HOME_UX_V2: 'HOME_UX_V2_ENABLED'
export function isHomeUxV2Enabled(): boolean {
  return isEnvTrue(FEATURE_FLAG_ENV.HOME_UX_V2);
}
```

```yaml
# apphosting.yaml
- variable: HOME_UX_V2_ENABLED
  value: "false"
```

Local dev: `.env` `HOME_UX_V2_ENABLED=true` for USER_LOCAL.

### Canary → full

1. Deploy with flag `false` (code ship, no user impact).
2. Enable for internal households / staging.
3. Manual canary week 1 (after Shopping + Pantry V2 stable on prod).
4. Full: flip yaml to `true` after 2 weeks green metrics; **disable** `HOME_REDESIGN_V1` for same cohort.

### Kill criteria

Kill or revert flag to `false` if any **two** hold for 14 days post-canary:

| Signal | Threshold |
|--------|-----------|
| `/hem` weekly active | ↓ >15% vs pre-ship |
| `for_you_cta_tapped` / `home_briefing_opened` | < 25% |
| Critical E2E on hem → inkop loop | Regression |
| Support / error rate on `/hem` | ↑ >2× baseline |

---

## 11. Implementation sequence (PR slices)

| PR | Deliverable |
|----|-------------|
| **PR1** | Flag, domain (`home-briefing.ts`), i18n, illustrations, route stub, tests |
| **PR2** | Molecules + `HomeV2BriefingView` — greeting, hero, status, For you card, chips |
| **PR3** | Recipe card data wiring, shopping handoff (`?mode=shop`), chip deep-links |
| **PR4** | Telemetry + error state + `invalidateAll` on replenishment accept |
| **PR5** | E2E + WCAG + `CURRENT_REALITY` + canary enable prep (yaml stays false until PO) |

---

## 12. Test plan

### Unit

- `home-briefing.ts`: status priority, for-you priority, empty pantry, list+cadence combos

### Integration

- `/hem` load with flag on returns `homeUxV2Enabled: true`
- Flag off: existing v5/legacy path unchanged

### E2E (`@deploy-critical`) — PR5

New `e2e/home-v2.spec.ts` (flag via env):

1. Open `/hem` → see greeting + status + one För dig card + chips
2. Replenishment CTA → item on list
3. Shop-ready CTA → `/inkop` shop mode

---

## 13. Open decisions (resolve before PR 2)

| # | Question | Default |
|---|----------|---------|
| 1 | Recipe card v1 | Show only when AI/meal pipeline returns structured suggestion (PR3) |
| 2 | Chip shopping label | Cadence store label or `home.v6.chips.shoppingDefault` |
| 3 | Flag precedence | `HOME_UX_V2` overrides `HOME_REDESIGN_V1` when both true |
| 4 | Illustration hosting | `static/illustrations/v2/home-hero.svg`, `for-you.svg` |
