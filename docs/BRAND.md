# Home Pantry — Brand guide

Design reference for UI, copy tone, and component styling. Tokens live in `src/app.css`; this doc is the source of truth for *when* to use them.

## Positioning — Variant A + lite B

**A. Hemma i köket** — warm, soft surfaces (`#f7f5f0` bg, muted green panels), domestic utility. Copy speaks directly to the person stocking the fridge: *"du fixar det här"*.

**B touches** — clearer typography hierarchy (display / body / label), fewer emojis in settings/admin/chrome, sharper product clarity on dense screens (inventory, scan, settings).

## Voice & tone

- **Primary:** Swedish (SV). **Secondary:** English via i18n.
- Warm, direct, encouraging — not corporate, not childish.
- Prefer short sentences and verbs: *Skanna*, *Lägg till*, *Visa*.
- Settings/admin: neutral and precise; skip playful emoji.

## Visual system — five rules

1. **Primary green `#2c4a3e`** — ONLY primary CTA buttons, active nav/tab states, and the single main action on empty states. Not for decorative text, borders, or secondary links. PWA `theme_color` (manifest, `app.html`, Safari chrome) uses the same hex in light mode; dark PWA chrome uses `#4d8f68`.
2. **Accent gold `#d4a853`** — sparingly: badges (e.g. NY), focus rings, expiry/warning surfaces, calendar “idea” dots. Never default buttons or nav chrome.
3. **Typography scale** — display (page titles), body (copy), label (section caps like KONTO / KONTO & HUSHÅLL). Use `.label-caps` for section labels.
4. **Empty states** — icon (SVG) + one headline + one supporting line + one green primary CTA. Optional ghost secondary link below.
5. **Icons vs emoji** — simple stroke icons in nav, scan, settings, inventory chrome. Emojis avoided in toolbar/chrome; empty states use `FeatureIcon`, not emoji.

## Design tokens (`src/app.css`)

| Token | Light | Usage |
|-------|-------|--------|
| `--color-primary` | `#2c4a3e` | Primary CTA, active nav |
| `--color-primary-hover` | `#243d32` | Primary hover |
| `--color-accent` | `#d4a853` | Badges, focus ring, warnings |
| `--color-bg` | `#f7f5f0` | Page background |
| `--color-surface` | `#ffffff` | Cards, panels |
| `--color-surface-muted` | `#eef2eb` | Secondary surfaces |
| `--color-border` | `#dde5d8` | Borders |
| `--color-text` / `--color-text-muted` | body / secondary text | |
| `--color-danger` | `#b54a4a` | Destructive actions |
| `--radius-sm/md/lg` | 8 / 12 / 16px | Corners |
| `--shadow-sm/md` | soft elevation | Cards, FAB |
| `--font-size-display/body/body-sm/label` | type scale | Headings, copy, caps |
| `--focus-ring-color` | accent | `:focus-visible` outlines |

Location hues (`--color-fridge`, `--color-freezer`, `--color-cupboard`) are semantic only — inventory location cards and badges, not global chrome.

## Dark theme (`html[data-theme='dark']`)

Applied via `src/app.css` when the user selects dark mode. Same usage rules as light — primary for CTAs/active nav, accent sparingly.

| Token | Dark | Usage |
|-------|------|--------|
| `--color-bg` | `#141a17` | Page background |
| `--color-surface` | `#1e2820` | Cards, panels |
| `--color-surface-muted` | `#243028` | Secondary surfaces |
| `--color-border` | `#2a3d30` | Borders |
| `--color-text` | `#a0b0a8` | Body text |
| `--color-text-muted` | `#4a5e55` | Secondary text |
| `--color-primary` | `#4d8f68` | Primary CTA, active nav (lightened for contrast) |
| `--color-accent` | `#d4a853` | Badges, focus ring, warnings |

## Button variants (`Button.svelte`)

| Variant | When |
|---------|------|
| **primary** | One main action per view/modal footer (submit, confirm, scan CTA) |
| **secondary** | Alternate path (cancel-adjacent, register link, toggle) |
| **ghost** | Tertiary / inline (clear filter, back) |
| **danger** | Irreversible delete (with `DeleteConfirmButton` tiers) |

Do not pair a filled green button with an outlined green button on the same row — use primary + secondary/ghost.

## Component contract (aligned with `docs/MODAL_CONTRACT.md`)

| Context | Primary | Secondary | Notes |
|---------|---------|-----------|--------|
| Modal footer — confirm flow | `Button variant="primary"` | `Button variant="secondary"` or ghost close | One green button |
| Modal footer — destructive | `Button variant="danger"` | `Button variant="secondary"` | |
| `DeleteConfirmButton` | danger when confirmed | ghost until tier reached | |
| `EmptyState` | green link `.action-primary` | `.action-secondary` ghost | Icon via `FeatureIcon` |
| `FeedbackBanner` | — | — | success = green tint; warning = accent tint |
| `ScanModeTabs` / `LocationTab` | active tab = primary fill | inactive = surface | |
| `RecipeIdeasButton` | ghost/secondary shell | gold **badge only** (`NY`) | No gold gradients on button body |
| Auth login | primary submit | secondary register CTA | No gold on register block |
| Email (`email.ts`) | green header + primary CTA | muted body | Inline brand tokens |

## Intentional exceptions

- **Dark theme** — see [Dark theme](#dark-theme-htmldata-themedark) above; primary lightens to `#4d8f68` for contrast.
- **Location colors** — fridge/freezer/cupboard keep distinct hues for at-a-glance scanning in inventory.
- **Warning/expiry badges** — may use accent-tinted backgrounds (not full gold fills).
- **Login landing showcase** — decorative mock UI may use accent strips; not a product surface.
- **Calendar “recipe idea” dot** — accent gold dot distinguishes AI suggestions from planned meals.

## Files to check when changing brand

- `src/app.css` — tokens, `.label-caps`
- `src/lib/components/atoms/Button.svelte`, `FeatureIcon.svelte`
- `src/lib/components/molecules/EmptyState.svelte`, `FeedbackBanner.svelte`
- Nav: `MainNavDesktop.svelte`, `MainNavMobile.svelte`, `ProfileMenu.svelte`, `NavMoreSheet.svelte`
- High-traffic: `HomeDashboard.svelte`, inventory/scan routes, `ScanModeHub.svelte`, `ScanModeTabs.svelte`
- `src/lib/design/brand-colors.ts` — hex constants for manifest, emails, build (non-CSS)
- `static/favicon.svg` — Skaffu mark (primary `#2c4a3e`, accent `#d4a853`)
- `scripts/social-brand.mjs`, `scripts/social-fonts.mjs`, `scripts/social-render.mjs` — social/OG PNG generators (embedded DM Sans + resvg)
- `src/lib/server/email.ts` — invite template header/CTA

## Social & OG assets

LinkedIn/Facebook covers, share images, and `/og-skaffu.png` are generated from SVG with **embedded DM Sans** (`@fontsource/dm-sans` via `scripts/social-fonts.mjs`). PNG export uses **resvg** (`scripts/social-render.mjs`) — Sharp/librsvg ignores embedded `@font-face` and falls back to serif.

After copy or color token changes:

```bash
npm run generate:og-image
npm run generate:social
```

See [FACEBOOK_PAGE.md](./FACEBOOK_PAGE.md) and [LINKEDIN_COMPANY_PAGE.md](./LINKEDIN_COMPANY_PAGE.md) for upload specs.
