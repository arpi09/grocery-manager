# Skaffu Design Kit

> **Single source of truth for AI design tools** (Stitch, Cursor, v0, etc.)  
> Do not duplicate hex or component specs elsewhere — link here.

## Quick start

```bash
# With dev server running (npm run dev on :5173 or E2E on :5190)
npm run design:build

# Screenshots only
npm run design:screenshots

# Docs/tokens only (no server required)
npm run design:build -- --no-screenshots
```

## Structure

| Path | Purpose |
|------|---------|
| [DESIGN.md](./DESIGN.md) | Canonical overview (this tree) |
| [BRAND.md](./BRAND.md) | Brand guide (generated from `docs/BRAND.md`) |
| [UX_PRINCIPLES.md](./UX_PRINCIPLES.md) | UX rules for AI tools |
| [TOKENS.md](./TOKENS.md) | Machine-readable token index → generated CSS |
| [ANIMATIONS.md](./ANIMATIONS.md) | Motion utilities from `app.css` |
| [AI_CONTEXT.md](./AI_CONTEXT.md) | AI briefing — philosophy, avoid list, routes |
| [SCREENSHOTS/](./SCREENSHOTS/) | Mobile 390×844 captures |
| [FLOWS/](./FLOWS/) | Ordered user flows |
| [COMPONENTS/](./COMPONENTS/) | Component gallery + source paths |
| [ILLUSTRATIONS/](./ILLUSTRATIONS/) | Synced from `static/illustrations/v2/` |

## Implementation sources (do not duplicate)

| Concern | Source of truth |
|---------|-----------------|
| Hex colors | `src/lib/design/brand-colors.ts` |
| Generated color CSS | `src/lib/design/brand-colors.generated.css` |
| Typography & layout CSS | `src/lib/design/brand-tokens.generated.css` |
| UX rules | `docs/UX_GUIDELINES.md` |
| Brand copy & semantics | `docs/BRAND.md` |
| Live component QA | `/brand` (noindex) |

## Architecture

- **Atomic Design** — atoms / molecules / organisms under `src/lib/components/`
- **SOLID** — domain logic in `src/lib/domain`, no framework imports
- **WCAG 2.2 AA** — axe on P0 routes, 44px touch targets
- **Regenerate, don't hand-edit** — `npm run design:build` after visual changes

## Scripts

| npm script | Script |
|------------|--------|
| `design:screenshots` | `scripts/design-kit/capture-screenshots.ts` |
| `design:build` | `scripts/design-kit/build.ts` |

Maintained by `scripts/design-kit/` — see individual files for details.
