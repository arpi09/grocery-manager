# DESIGN_SYSTEM_V2

Mobile UX recovery sprint — enforcement reference (2026-06).

## Spacing

Use `--space-xs` through `--space-xl` only. No hardcoded `0.45rem` / arbitrary padding in product surfaces.

## Touch targets

Minimum `--touch-target-min` (44px) for all interactive controls: buttons, checkboxes, row actions, chips.

## Button hierarchy

| Variant | Use |
|---------|-----|
| **primary** (`btn-primary`) | One green action per surface — checkoff CTA, add to list, scan receipt |
| **secondary** | Alternate confirm paths |
| **ghost** | Tertiary / cancel / overflow |

`EmptyState` uses `btn-primary` / `btn-ghost` anchor classes aligned with `Button.svelte`.

## Badges

Tones: `default` | `warning` | `location`. Max **2** per inventory row; expiry prefers **text meta** on secondary line.

## List hierarchy

Shared `.product-row` rhythm:

- Title: 0.875rem semibold
- Meta: 0.75rem muted
- Padding: `var(--space-sm) var(--space-md)`

## Sheets

Filter/add sheets use `Modal variant="sheet"` and `--z-sheet` stacking above bottom nav.
