# Design system V1 (Skaffu)

> Audit pass R15 — atoms used across Tier A surfaces (inkop, hem, onboarding).

## Tokens (source: `src/app.css`)

- **Color:** `--color-primary`, `--color-surface`, `--color-text-muted`, `--color-on-primary`
- **Space:** `--space-xs` … `--space-xl`
- **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`
- **Touch:** `--touch-target-min` (44px floor)

## Button (`atoms/Button.svelte`)

| Variant | Use |
|---------|-----|
| primary | Single main action per panel |
| secondary | Alternate path, non-destructive |
| ghost | Toolbar / footer back |
| danger | Irreversible delete |

Rules: one primary per stack; `fullWidth` on mobile onboarding CTAs; `loading` disables + spinner.

## Badge (`atoms/Badge.svelte`)

| tone | Use |
|------|-----|
| default | Neutral metadata |
| warning | Expiry / eat-first |
| location | Storage hint |

## EmptyState (`molecules/EmptyState.svelte`)

Centered dashed panel; primary link uses same radius/touch as Button primary; secondary is text-only ghost.

## Gaps (later)

- EmptyState actions could wrap `Button` for perfect parity
- Badge `success` tone for checkoff-complete (not in V1)
