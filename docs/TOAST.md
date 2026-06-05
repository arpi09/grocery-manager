# Toast-arkitektur

Enhetligt feedback-mönster för Home Pantry. Alla användar-facing toasts ska följa samma visuella språk och timing om inte annat dokumenteras här.

## Primitiv: `Toast.svelte`

- **Placering:** fixed bottom center (`--content-bottom-safe`)
- **Default duration:** `TOAST_DEFAULT_DURATION_MS` (5000 ms) via `action-toast.ts`
- **Paus:** timer pausas vid hover/pointerenter
- **Tema:** `--toast-*`, `--color-primary`, `--color-danger` — inga hårdkodade kontrastfärger på toast-ytan
- **Storlekar:** `compact` (default) eller `action` (primära åtgärdsbekräftelser)
- **Varianter:** `default` | `success` | `error` | `info`

## Globala wrappers (monteras i `AppLayout.svelte`)

| Komponent | Trigger | Duration | Storlek | Anteckning |
|-----------|---------|----------|---------|------------|
| `ActionToast` | URL `?actionToast=` efter server redirect | 5s | `action` | Canonical för formulär/CRUD |
| `ClientToast` | `showClientToast()` (client store) | 5s | `action` | Paneler, push, expiry, recept |
| `InventoryScanToast` | URL `?scan=` efter streckkod/foto | 5s | `action` | `success` vid träff, `info` vid okänd produkt |
| `GamificationToast` | URL `?celebrate=` | 5s | `action` | `celebrate`-gradient för milstolpar |

## Client-side API

```ts
import { showClientToast } from '$lib/utils/client-toast.svelte';

showClientToast('Sparat', { variant: 'success' }); // 5s, action size, global placering
```

Används av: `EatFirstSection`, `RecipeAssistant`, `MealPlanIdeasPanel`, `ReceiptAutopilotSection`, `CalendarDaySheet`, `ShoppingListPanel` (success), `settings/+page.svelte` (push + expiry).

## Server-side API

```ts
import { appendActionToast } from '$lib/utils/action-toast';

redirect(302, appendActionToast('/inventory/fridge', 'itemCreated', 'Mjölk'));
```

## Medvetna undantag

| Plats | Varför | Duration |
|-------|--------|----------|
| `ShoppingListPanel` undo | Inline **Ångra**-knapp bredvid toast; kan inte använda global store utan att tappa knappen | `TOAST_UNDO_DURATION_MS` (8000 ms) |

Undo-toasten använder fortfarande `Toast.svelte` (samma tema/tokens) men renderas lokalt med companion-knapp.

## E2E-selektorer

Tester matchar `.toast-message` — ändra inte klassnamn utan att uppdatera `e2e/*.spec.ts`.

## Relaterade konstanter

```ts
// src/lib/utils/action-toast.ts
export const TOAST_DEFAULT_DURATION_MS = 5000;
export const TOAST_UNDO_DURATION_MS = 8000;
```
