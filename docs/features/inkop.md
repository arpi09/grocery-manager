# Inköp (`/inkop`)

> Shopping V2 — delad inköpslista, plan + shop modes, checkoff → skafferi. **Tier A** core loop.

## Routes

| Route | Purpose |
|-------|---------|
| `/inkop` | Primary shopping list (V2 when `SHOPPING_UX_V2_ENABLED`) |
| `/inkop?quick=1` | Post-onboarding deep link |

## Flow

```mermaid
flowchart LR
  Hem[/hem]
  Inkop[/inkop]
  Scan[/scan]
  Pantry[/inventory]
  Hem -->|"Replenishment / memory"| Inkop
  Scan -->|"Kvitto import"| Inkop
  Inkop -->|"Checkoff"| Pantry
  Pantry -->|"Replenish"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| Route | `src/routes/inkop/+page.svelte`, `+page.server.ts` |
| UI | `src/lib/components/organisms/ShoppingV2Page.svelte` |
| Services | `shopping-list.service.ts`, `shopping-to-pantry.service.ts`, `shopping-list-share.service.ts`, `shopping-push.service.ts` |
| Repo | `src/lib/infrastructure/repositories/shopping-list.repository.ts` |
| API | `/api/shopping/data`, `/api/shopping-list/share`, `/api/replenishment/*` |

## Tests

- `e2e/shopping-v2.spec.ts`, `e2e/shopping.spec.ts`
- `src/lib/application/shopping-list.service.test.ts`
- `src/lib/application/shopping-to-pantry.service.test.ts`

## Common issues

- **Checkoff not updating pantry:** trace `ShoppingToPantryService` + server actions in `+page.server.ts`.
- **Share link broken:** `shopping-list-share.service` + `/lista/[token]` guest flow.
- **V1 vs V2 UI:** flag `SHOPPING_UX_V2_ENABLED` in `apphosting.yaml`.

## Related

- [household.md](./household.md) — delad lista
- [scan-receipt.md](./scan-receipt.md) — kvitto → lista
