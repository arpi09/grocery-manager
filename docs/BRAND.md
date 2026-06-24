# Skaffu — Brand guide

Design reference for UI, copy tone, and component styling. **Hex values live only in** [`src/lib/design/brand-colors.ts`](../src/lib/design/brand-colors.ts); the app consumes CSS custom properties from generated [`brand-colors.generated.css`](../src/lib/design/brand-colors.generated.css).

**Live palette reference (noindex):** [`/brand`](/brand) — active track swatches + component gallery.

## Architecture (Fas 2)

| Layer | Source |
|-------|--------|
| Hex source of truth | `brand-colors.ts` — `LOCKED_LOGO_CORE` + per-track semantics |
| Active track | `BRAND_PALETTE` env (default **`fresh`**) → `npm run brand:css` |
| App tokens | `@import brand-colors.generated.css` in `src/app.css` |
| SMUI SCSS | `src/theme/brand-variables.generated.scss` (imported from `_variables.scss`) |
| CI guard | `npm run check:brand-hex` — fails on hex outside allowed files |

## Locked logo colors (all tracks)

Immutable — logo, PWA chrome, email header.

| Token | Light | Dark |
|-------|-------|------|
| `primary` | `#2c4a3e` | `#4d8f68` |
| `primaryHover` | `#243d32` | `#5aa076` |
| `onPrimary` | `#ffffff` | `#ffffff` |
| `accent` | `#d4a853` | `#d4a853` |
| `bg` | `#f7f5f0` | `#141a17` |
| `surface` | `#ffffff` | `#1e2820` |
| `surfaceMuted` | `#eef2eb` | `#243028` |
| `border` | `#dde5d8` | `#2a3d30` |
| `text` | `#1f2a24` | `#a0b0a8` |
| `textMuted` | `#4a5850` | `#8fa399` |

## Active track: Fresh — semantic tokens

Merged with locked core at build time.

| Token | Light | Dark | Usage |
|-------|-------|------|--------|
| `secondary` | `#8a9a7b` | `#9aad92` | Secondary chrome, catalog hints |
| `taupe` | `#c4b8a8` | `#a89888` | Warm neutrals, decorative gradients |
| `success` | `#3d8f5c` | `#6ecf96` | Saved, eat-first, positive toasts/banners |
| `warning` | `#c9870a` | `#f0b429` | Expiry soon — **not** accent gold |
| `danger` | `#c44d4d` | `#f09090` | Errors, destructive |
| `info` | `#4a8fb8` | `#7ec4e8` | Tips, receipt/evidence badges |
| `fridge` | `#056B52` | `#34D399` | Kyl — green emerald (~160°) |
| `freezer` | `#3F4F63` | `#D1D5DB` | Frys — frost gray (never second blue) |
| `cupboard` | `#A05228` | `#E8A060` | Skafferi |
| `learningAi` | `#4A62A8` | `#8A9EE8` | AI / learning badges |
| `learningAiGradient` | `#3E5288 → #5A72B8` | (same stops) | Shimmer gradients |

## CSS custom properties (app)

Generated into `:root` / `html[data-theme='dark']`:

- Core: `--color-primary`, `--color-primary-hover`, `--color-on-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-border`, `--color-text`, `--color-text-muted`
- Semantic: `--color-secondary`, `--color-taupe`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-fridge`, `--color-freezer`, `--color-cupboard`, `--color-learning-ai`, `--color-learning-ai-gradient`
- Toast: `--toast-bg`, `--toast-fg`, …

**Rule:** components use `var(--color-*)` only — no inline hex.

## Semantic component mapping

| Component | Correct token |
|-----------|----------------|
| Primary CTA / active nav | `--color-primary` |
| Success banner / toast | `--color-success` (not primary) |
| Warning banner / expiry badge | `--color-warning` (not accent) |
| Focus ring | `--color-accent` (sparingly) |
| Location chips | `--color-fridge` / `--color-freezer` / `--color-cupboard` |
| Learning / AI badge | `--color-learning-ai` + gradient |

## Voice & positioning

**A. Hemma i köket** — warm surfaces, domestic utility. **B touches** — clearer typography hierarchy on dense screens.

- Primary Swedish; warm, direct copy
- Settings/admin: neutral, precise

## Typography & buttons

See existing sections in this doc for `--font-size-*`, `Button` variants, modal contract — unchanged.

## Files to touch for brand changes

1. `src/lib/design/brand-colors.ts` — only place to edit hex
2. `npm run brand:css` — regenerates CSS/SCSS + locked SVGs
3. `docs/BRAND.md` (this file)
4. `/brand` page for visual QA

## Social & OG

LinkedIn/Facebook/OG assets: `npm run generate:og-image` / `generate:social` — see [FACEBOOK_PAGE.md](./FACEBOOK_PAGE.md).

## Palette preview (local, Fas 1)

Compare all four tracks before switching prod track:

```bash
npm run brand:preview
```

Output: `local/brand-palette-preview.html` (gitignored).
