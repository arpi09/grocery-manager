# Pantry V2 — Shelf View (Concept A)

## Success condition

User can open the pantry shelf view, browse zones (fridge, freezer, cupboard), spot **use soon** items, and deep-link to the legacy table fallback per zone — **without** relying on the location table as the primary surface when the flag is on.

## KPIs

| Priority | Metric | Target / cadence |
|----------|--------|------------------|
| **Primary** | `pantry_shelf_opened` → `pantry_item_opened` | **> 40%** item open rate from shelf |
| **Secondary** | `pantry_use_soon_tapped` | Monitor weekly |
| **Guard** | Legacy table fallback usage | Declining after canary (shelf is primary) |

**Scope:** `/inventory` (shelf) + `/inventory/[location]` (table fallback) · **Flag:** `PANTRY_UX_V2_ENABLED`  
**Copy source:** [`copy/pantry-shelf.sv.md`](copy/pantry-shelf.sv.md), [`copy/pantry-shelf.en.md`](copy/pantry-shelf.en.md)  
**Design lock:** [`LOCK.md`](LOCK.md) · Mockup: [`screens/pantry.html`](screens/pantry.html)  
**Architecture template:** [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](SHOPPING_V2_IMPLEMENTATION_PLAN.md)

**Not in this phase:** Home Household Briefing, nav rename beyond pantry entry.

---

## 1. Scope

| In | Out |
|----|-----|
| Replace location table as **primary** surface when flag on | New routes beyond `/inventory` + existing `[location]` |
| Shelf view: use-soon band + zone tiles + hero illustration | Illustration variants or new art |
| Deep-link table fallback per zone (`/inventory/fridge`, etc.) | Dual SV+EN on same production screen |
| Legacy `InventoryList` table when flag off or via fallback link | Full removal of legacy CRUD (keep behind flag off) |
| Search / add / scan CTAs (mockup parity) | Home V2 implementation |
| Telemetry for shelf browse + use-soon | Server-persisted shelf layout prefs (v1 = domain sort only) |

**Route:** `/inventory` (shelf primary when flag on). Table fallback: `/inventory/[location]` (unchanged path, linked from zone header or overflow).

---

## 2. Interaction model

### 2.1 Flag branching

```
                    ┌─────────────┐
         flag off   │  LEGACY     │
                    │  /inventory/fridge (nav default)
                    └─────────────┘

flag on:
                    ┌─────────────┐
         load       │  SHELF      │◄── nav → /inventory
                    │  zone tiles │
                    └──────┬──────┘
                           │ zone "Visa alla" / tile overflow
                           ▼
                    ┌─────────────┐
                    │  TABLE      │  /inventory/[location]
                    │  fallback   │
                    └─────────────┘
```

**Persistence (v1):** No shelf session DB. Tile order = domain sort (use-soon first within zone, then expiry, then name).

### 2.2 Use soon band

- Top band when ≥1 item expires within `EXPIRING_SOON_DAYS` (7).
- Shows count + first ~4 names (`USE_SOON_LIST_MAX`).
- CTA deep-links to table with `?filter=expiring` on primary zone or unified expiring view.

### 2.3 Zone shelves

- Three zones in order: fridge → freezer → cupboard (matches `LOCATIONS`).
- Tile grid: max 6 tiles per zone (`MAX_TILES_PER_ZONE`); `+N till` overflow pill links to table fallback.
- Warn styling when item in use-soon window.
- Empty zone: `pantry.v2.zone.empty` — no tiles.

### 2.4 Tile detail line (presenter)

| Condition | Detail |
|-----------|--------|
| Expires today | `pantry.v2.tile.expiresToday` |
| Expires in N days (use-soon) | `pantry.v2.tile.expiresDays` |
| Freezer, no urgent expiry | `pantry.v2.tile.frozen` |
| Quantity present | `{quantity} {unit}` (raw, localized unit if available) |

---

## 3. Atomic design component map

### Atoms (create or extend)

| Component | Path | Notes |
|-----------|------|-------|
| `SceneIllustration` | existing | Reuse for `pantry-shelf.svg` |
| `Pill` | existing | Overflow + use-soon count |
| `ProductTile` | `src/lib/components/atoms/ProductTile.svelte` | Zone grid cell, warn state |

### Molecules

| Component | Path | Notes |
|-----------|------|-------|
| `UseSoonBand` | `src/lib/components/molecules/UseSoonBand.svelte` | Top expiring band |
| `PantryZoneHeader` | `src/lib/components/molecules/PantryZoneHeader.svelte` | Zone label + count + table link |
| `PantryZoneGrid` | `src/lib/components/molecules/PantryZoneGrid.svelte` | Tile grid + overflow |
| `PantryShelfActions` | `src/lib/components/molecules/PantryShelfActions.svelte` | Add / scan / search |

### Organisms

| Component | Path | Notes |
|-----------|------|-------|
| `PantryV2ShelfView` | `src/lib/components/organisms/PantryV2ShelfView.svelte` | Full shelf layout |
| `PantryV2EmptyState` | `src/lib/components/organisms/PantryV2EmptyState.svelte` | Empty household |
| `PantryV2Page` | `src/lib/components/organisms/PantryV2Page.svelte` | Shelf + actions + error |

### Templates / routes

| File | Change |
|------|--------|
| `src/routes/inventory/+page.svelte` | Shelf primary when flag on; redirect to `/inventory/fridge` when off |
| `src/routes/inventory/+page.server.ts` | Load all items + flag |
| `src/routes/inventory/[location]/+page.svelte` | Table fallback; legacy primary when flag off |
| `src/routes/+layout.server.ts` | Pass `pantryUxV2Enabled` |
| `src/lib/navigation/nav-config.ts` | Nav href `/inventory` when flag on (PR3+) |

### Domain / client

| File | Role |
|------|------|
| `src/lib/domain/pantry-shelf.ts` | Pure grouping, tile presentation, use-soon |
| `src/lib/domain/pantry-shelf-presenter.ts` | i18n key selection for tile detail lines |
| `src/lib/client/pantry-shelf.service.ts` | Optional client wrapper over view model (PR2) |

---

## 4. SOLID boundaries

| Layer | Responsibility |
|-------|----------------|
| `InventoryService` | CRUD, list all, consume — **unchanged** |
| `pantry-shelf.ts` | Pure view model over `InventoryItem[]` — **no DB** |
| `PantryV2ShelfView` | UI; tile tap → `/item/[id]/edit` or table row |
| `pantry-ux-v2-flag.ts` | Re-export `isPantryUxV2Enabled` from `feature-flags.ts` |
| `+page.server.ts` | Load flag + `listAll` inventory |

---

## 5. Data / API

### Existing (reuse)

| Action / endpoint | Use in V2 |
|-------------------|-----------|
| `inventoryService.listAll` | Shelf zones |
| `inventoryService.listByLocationPaginated` | Table fallback |
| `+page.server.ts` actions on `[location]` | Consume, bulk expiry — unchanged |
| `/scan`, `/item/new` | Add / scan CTAs |

### New state (v1)

| Item | Decision |
|------|----------|
| Shelf layout DB | **No** — domain sort only |
| Search | Client filter over loaded items (v1); server search defer |
| Nav default | `/inventory` when flag on (PR3) |

---

## 6. i18n

- Namespace `pantry.v2.*` in `sv.json` and `en.json` from copy package.
- **Do not** add EN strings to SV production components.
- Legacy `inventory.*` keys remain for flag-off table path.

---

## 7. Telemetry (`pmf.ts`)

Add to `PRODUCT_EVENT_TYPES`:

| Event | Payload | When |
|-------|---------|------|
| `pantry_shelf_opened` | `{ totalItems, useSoonCount }` | Shelf load with flag on |
| `pantry_zone_opened` | `{ zone, itemCount }` | Table fallback from zone |
| `pantry_item_opened` | `{ itemId, zone, from: 'tile' \| 'table' }` | Item detail navigation |
| `pantry_use_soon_tapped` | `{ count }` | Use-soon band CTA |

---

## 8. WCAG AA

| Requirement | Implementation |
|-------------|----------------|
| Tile target ≥ 48px | Min tile size in grid; adequate padding |
| Keyboard | Zone headers and tiles focusable; table fallback link visible on focus |
| Warn state | Dot + text detail — not color alone |
| Illustration | `aria-hidden="true"`; page title from `pantry.v2.heroAria` |
| Live region | Optional on consume from table fallback only (unchanged) |

Run `e2e/accessibility.spec.ts` on `/inventory` with flag on.

---

## 9. Mobile-first

| Target | Guideline |
|--------|-----------|
| Viewport | 390×844 primary |
| Above fold | Title + use-soon (if any) + first zone header |
| Thumb zone | Add / scan in header or FAB row |
| Bottom nav | Unchanged — pantry tab active on `/inventory*` prefix |

---

## 10. Rollout

### Feature flag

```ts
// feature-flags.ts
PANTRY_UX_V2: 'PANTRY_UX_V2_ENABLED'
export function isPantryUxV2Enabled(): boolean {
  return isEnvTrue(FEATURE_FLAG_ENV.PANTRY_UX_V2);
}
```

```yaml
# apphosting.yaml
- variable: PANTRY_UX_V2_ENABLED
  value: "false"
```

Local dev: `.env` `PANTRY_UX_V2_ENABLED=true` for USER_LOCAL.

### Canary → full

1. Deploy with flag `false` (code ship, no user impact).
2. Enable for internal households / staging.
3. Manual canary week 1 (same pattern as Shopping V2).
4. Full: flip yaml to `true` after 2 weeks green metrics.

### Kill criteria

Kill or revert flag to `false` if any **two** hold for 14 days post-canary:

| Signal | Threshold |
|--------|-------------|
| Pantry weekly active | ↓ >15% vs pre-ship |
| `pantry_item_opened` / `pantry_shelf_opened` | < 20% |
| Critical E2E on inventory CRUD | Regression |
| Support / error rate on `/inventory*` | ↑ >2× baseline |

---

## 11. Implementation sequence (PR slices)

| PR | Deliverable |
|----|-------------|
| **PR1** | Flag, domain (`pantry-shelf.ts`), i18n, illustration, route stub, tests |
| **PR2** | Atoms/molecules + `PantryV2ShelfView` + wire `/inventory` |
| **PR3** | Grouping/tiles polish, nav href, table fallback links, search stub |
| **PR4** | Telemetry + empty/error states + `invalidateAll` patterns |
| **PR5** | E2E + WCAG + `CURRENT_REALITY` + canary enable prep |

---

## 12. Test plan

### Unit

- `pantry-shelf.ts`: zone grouping, use-soon, tile overflow, empty pantry
- `pantry-shelf-presenter.ts`: detail line key selection

### Integration

- `/inventory` load with flag on returns `pantryUxV2Enabled: true`
- Flag off redirects to `/inventory/fridge`

### E2E (`@deploy-critical`)

New `e2e/pantry-v2.spec.ts` (flag via env):

1. Open `/inventory` → see shelf zones (no table rows in primary view)
2. Tap zone fallback → table at `/inventory/fridge`
3. Use-soon band visible when expiring items seeded

---

## 13. Open decisions (resolve before PR 2)

| # | Question | Default |
|---|----------|---------|
| 1 | Tile tap destination | Item edit `/item/[id]/edit` |
| 2 | Search v1 | Client filter on loaded `listAll` |
| 3 | Nav href when flag on | `/inventory` (PR3) |
| 4 | Freezer tile without expiry | Show `pantry.v2.tile.frozen` |
