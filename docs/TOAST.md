# Toast patterns — Skaffu

Canonical reference for success, info, and error feedback via toasts. Tokens live in `src/app.css` (`--toast-*`).

## Principles

- **Placement:** bottom center (global via `AppLayout`)
- **Duration:** 5s default (`TOAST_DEFAULT_DURATION_MS` in `src/lib/utils/action-toast.ts`)
- **Pause:** on hover and focus
- **Contrast:** use `--toast-*` tokens; no hardcoded `#fff` on `var(--color-text)` backgrounds
- **One toast per gesture** — do not stack multiple success toasts for the same action

## Primitive: `Toast.svelte`

- **Placement:** fixed bottom center (`--content-bottom-safe`)
- **Default duration:** `TOAST_DEFAULT_DURATION_MS` (5000 ms) via `action-toast.ts`
- **Pause:** timer pauses on hover/pointerenter
- **Theme:** `--toast-*`, `--color-primary`, `--color-danger` — no hardcoded contrast on toast surface
- **Sizes:** `compact` (default) or `action` (primary action confirmations)
- **Variants:** `default` | `success` | `error` | `info`

## Global wrappers (mounted in `AppLayout.svelte`)

| Component | Trigger | Duration | Size | Notes |
|-----------|---------|----------|------|-------|
| `ActionToast` | URL `?actionToast=` after server redirect | 5s | `action` | Canonical for forms/CRUD |
| `ClientToast` | `showClientToast()` (client store) | 5s | `action` | Panels, push, expiry, recipes |
| `InventoryScanToast` | URL `?scan=` after barcode/photo | 5s | `action` | `success` on match, `info` on unknown product |
| `GamificationToast` | URL `?celebrate=` | 5s | `action` | `celebrate` gradient for milestones |

## When to use which

**Prefer `showClientToast`** for new success feedback after async client work (panels, modals, toggles).

**Use `ActionToast`** when the server redirects with `?actionToast=` after a form post (settings save, delete, etc.).

**Keep local `Toast`** only when undo must stay inline (shopping list undo row).

**Do not add** a fourth global path without updating this doc.

## Client-side API

```ts
import { showClientToast } from '$lib/utils/client-toast.svelte';

showClientToast(t('my.messageKey'), { variant: 'success' });
```

Used by: `EatFirstSection`, `RecipeAssistant`, `MealPlanIdeasPanel`, `ReceiptAutopilotSection`, `CalendarDaySheet`, `ShoppingListPanel` (success), `settings/+page.svelte` (push + expiry).

## Server-side API

```ts
import { appendActionToast } from '$lib/utils/action-toast';

redirect(302, appendActionToast('/inventory/fridge', 'itemCreated', 'Mjölk'));
```

## Intentional exceptions

| Location | Why | Duration |
|----------|-----|----------|
| `ShoppingListPanel` undo | Inline **Undo** next to toast; cannot use global store without losing the button | `TOAST_UNDO_DURATION_MS` (8000 ms) |

Undo toast still uses `Toast.svelte` (same theme/tokens) but renders locally with companion button.

## Migration status

Migrated to `showClientToast`: EatFirst, RecipeAssistant, MealPlanIdeasPanel, ReceiptAutopilot, CalendarDaySheet, ShoppingListPanel success, settings push/expiry.

Intentionally local: ShoppingListPanel undo (8s), GamificationToast, InventoryScanToast, URL-driven ActionToast.

## E2E selectors

Tests match `.toast-message` — do not rename without updating `e2e/*.spec.ts`.

## Constants

```ts
// src/lib/utils/action-toast.ts
export const TOAST_DEFAULT_DURATION_MS = 5000;
export const TOAST_UNDO_DURATION_MS = 8000;
```

## UX checklist

- [ ] Message is i18n (`t()` / `translate()`)
- [ ] Variant matches severity (`success` | `info` | `error`)
- [ ] No duplicate toast for the same user action
- [ ] Undo flows use 8s if user must act on the toast

## Related

- `docs/UX_GUIDELINES.md` — success state rules
- `docs/UX_COORDINATOR_BACKLOG.md` — toast audit history
- `docs/BRAND.md` — visual tokens
