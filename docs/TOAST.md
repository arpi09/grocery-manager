# Toast patterns — Skaffu

Canonical reference for success, info, and error feedback via toasts. Tokens live in `src/app.css` (`--toast-*`).

## Principles

- **Placement:** bottom center (global via `AppLayout`)
- **Duration:** 5s default (`TOAST_DEFAULT_DURATION_MS` in `src/lib/utils/action-toast.ts`)
- **Pause:** on hover and focus
- **Contrast:** use `--toast-*` tokens; no hardcoded `#fff` on `var(--color-text)` backgrounds
- **One toast per gesture** — do not stack multiple success toasts for the same action

## Mechanisms

| Mechanism | When | Duration | File |
|-----------|------|----------|------|
| `showClientToast` / `ClientToast` | In-app success/info after client actions | 5s default | `client-toast.svelte.ts`, `ClientToast.svelte` |
| `ActionToast` (`?actionToast=`) | Server redirect after form action | 5s | `action-toast.ts`, `ActionToast.svelte` |
| Local `Toast` | Inline undo flows | 8s (`TOAST_UNDO_DURATION_MS`) | `Toast.svelte` |
| `GamificationToast` | Gamification milestones | Custom | `GamificationToast.svelte` |
| `InventoryScanToast` | Scan-specific feedback | Custom | `InventoryScanToast.svelte` |

## When to use which

**Prefer `showClientToast`** for new success feedback after async client work (panels, modals, toggles).

**Use `ActionToast`** when the server redirects with `?actionToast=` after a form post (settings save, delete, etc.).

**Keep local `Toast`** only when undo must stay inline (shopping list undo row).

**Do not add** a fourth global path without updating this doc.

## Migration status

Migrated to `showClientToast`: EatFirst, RecipeAssistant, MealPlanIdeasPanel, ReceiptAutopilot, CalendarDaySheet, ShoppingListPanel success, settings push/expiry.

Intentionally local: ShoppingListPanel undo (8s), GamificationToast, InventoryScanToast, URL-driven ActionToast.

## Adding a toast

```ts
import { showClientToast } from '$lib/utils/client-toast.svelte';

showClientToast(t('my.messageKey'), { variant: 'success' });
```

For server actions, use `appendActionToast` / redirect helpers in `action-toast.ts`.

## UX checklist

- [ ] Message is i18n (`t()` / `translate()`)
- [ ] Variant matches severity (`success` | `info` | `error`)
- [ ] No duplicate toast for the same user action
- [ ] Undo flows use 8s if user must act on the toast

## Related

- `docs/UX_GUIDELINES.md` — success state rules
- `docs/UX_COORDINATOR_BACKLOG.md` — toast audit history
- `docs/BRAND.md` — visual tokens
