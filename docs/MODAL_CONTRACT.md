# Modal component contract

`src/lib/components/molecules/Modal.svelte` is the shared dialog primitive. **Do not change focus trap, portal, or variant behavior without coordinator approval** — many features depend on stable semantics.

## Frozen API (props)

| Prop | Type | Default | Notes |
|------|------|---------|--------|
| `open` | `boolean` | — | Controlled visibility |
| `onClose` | `() => void` | — | Called for Escape, scrim, close control |
| `variant` | `'center' \| 'sheet'` | `'center'` | Sheet used on narrow viewports in nav/pantry |
| `dismissible` | `boolean` | `true` | When false, scrim/Escape may be disabled |
| `title`, `subtitle`, `label` | `string?` | — | A11y labels via `ModalHeader` |
| `nested` | `boolean` | `false` | Stacked modal stacking |
| `panelClass`, `bodyClass` | `string` | `''` | Layout hooks only |
| `showSheetHandle` | `boolean` | `true` | Sheet drag handle |
| `children`, `header`, `footer` | `Snippet` | — | Content slots |

Supporting utilities: `$lib/utils/modal-a11y.ts` (focus trap, body scroll lock).

## Direct consumers (keep in sync when testing)

1. `MainNav.svelte` — desktop “more” menu, mobile sheet patterns
2. `PantrySwitcher.svelte` — create/switch pantry on desktop and mobile
3. `settings/+page.svelte` — household/settings dialogs
4. `AddItemModalOverlay.svelte` — inventory add overlay
5. `BarcodeScannerModal.svelte` — scan flow
6. `PetFoodModal.svelte` — pet food logging
7. `CalendarDaySheet.svelte` — meal plan day sheet
8. `RecipeAssistant.svelte` — recipe ideas assistant

Global scrim/blur may also be styled in `src/app.css` (`modal-scrim`); coordinate with modal-blur worktrees before changing both.
