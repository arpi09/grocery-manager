# Skafferi / inventory (`/inventory`)

> Pantry V2 shelf view + location data grid. **Tier A** — eat-first, expiry, replenishment input.

## Routes

| Route | Purpose |
|-------|---------|
| `/inventory` | Pantry V2 shelf (zones, use-soon) |
| `/inventory/[location]` | Location grid (kyl/frys/skafferi) |
| `/inventory/merge` | Duplicate merge |
| `/inventory/synk` | Sync helpers |
| `/item/new` | Add item (break-out route from location) |
| `/item/[id]/edit` | Edit item |
| `/inventory/foto` | Photo add (server-only redirect flow) |

## Flow

```mermaid
flowchart LR
  Scan[/scan]
  Inventory[/inventory]
  Location["/inventory/location"]
  Inkop[/inkop]
  Scan -->|"Kvitto/foto/streckkod"| Inventory
  Location -->|"Lägg till sheet"| Scan
  Inventory -->|"Utgår snart"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| Routes | `src/routes/inventory/+page.svelte`, `[location]/+page.svelte` |
| UI | `PantryV2Page.svelte`, `PantryV2ShelfView.svelte`, `PantryLocationDataGrid.svelte` |
| Service | `src/lib/application/inventory.service.ts` |
| Repo | `src/lib/infrastructure/repositories/inventory.repository.ts` |
| Domain | `inventory-list-presenter.ts`, `pantry-shelf.ts` |
| API | `/api/inventory/data`, `/api/eat-first`, `/api/inventory/photo-scan` |

## Tests

- `src/lib/application/inventory*.integration.test.ts`
- `src/lib/domain/inventory-list-presenter.test.ts`

## Common issues

- **Shelf vs grid:** V2 shelf at `/inventory`; detailed grid at `/inventory/[location]`.
- **Stale badge (mobile):** staleness API + nav in `MainNavMobile.svelte`.
- **Expiry badges:** Brain flags + `SHELF_LIFE_LEARNING_ENABLED` — see [CURRENT_REALITY.md](../CURRENT_REALITY.md).

## Related

- [scan-receipt.md](./scan-receipt.md) — add via kvitto
- [inkop.md](./inkop.md) — replenishment back to list
