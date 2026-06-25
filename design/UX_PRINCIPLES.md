# UX principles (design kit excerpt)

> Canonical full document: [`docs/UX_GUIDELINES.md`](../docs/UX_GUIDELINES.md)  
> AI briefing: [`AI_CONTEXT.md`](./AI_CONTEXT.md)

## Core rules for AI-generated UI

### One primary action per section

- Filled green `Button` or primary link for the main goal.
- Secondary = outline/muted. Tertiary = ghost or `.text-action`.
- Never two filled primaries in the same section.

### States (required on every async/list surface)

| State | Pattern |
|-------|---------|
| Empty | `EmptyState` — title, description, one primary CTA |
| Loading | Inline on trigger (`aria-busy`); `AiLoadingSkeleton` for AI waits |
| Error | `FeedbackBanner` tone=error — what happened + next step |
| Success | Toast or banner; auto-dismiss when non-critical |

### Mobile

- Viewport reference: **390×844** (iPhone 14 class)
- Touch targets ≥ **2.75rem** (44px)
- Bottom nav clears `--content-bottom-safe`
- Sticky filters use `top: var(--sticky-below-header)`

### Accessibility

- One `<h1>` per page
- Icon-only controls need `aria-label`
- Focus visible; respect `prefers-reduced-motion`
- Muted text via `--color-text-muted`, not opacity-only

### Simplicity over decoration

Prioritize: **speed, clarity, consistency** — not dashboards, dense tables, or decorative chrome.

## App UX principles (Skaffu)

1. **Speed** — Fewest taps to log consumption, add to list, or scan.
2. **Minimal typing** — Defaults, scan-first, smart fill.
3. **One-handed mobile** — Primary actions in lower half when possible.
4. **Fast item entry** — Scan card on home; checkbox-first shopping.
5. **Understand inventory** — Location tabs, counts, expiry visible.

## Terminology

Use existing i18n keys in `src/lib/i18n/locales/sv.json` — Swedish ni/vi tone, concrete kitchen examples.

## Review checklist (before shipping AI proposals)

- [ ] User goal stated in one sentence
- [ ] Next action obvious without reading body copy
- [ ] Empty/loading/error/success covered
- [ ] No inline hex — `var(--color-*)` only
- [ ] Matches screenshot baseline in [`SCREENSHOTS/`](./SCREENSHOTS/)

See [`docs/UX_GUIDELINES.md`](../docs/UX_GUIDELINES.md) for full pre-release checklist and WCAG details.
