# Skaffu (home-pantry) — brand tokens

This is a **tokens-only** design system: the Skaffu brand as CSS custom properties.
There are **no prebuilt components** — Skaffu ships as a Svelte app, which can't render
in this React runtime. Build UI from plain elements and style them with the `var(--*)`
tokens below. Everything here mirrors the app's real tokens 1:1.

## Setup — no provider, no wrapper

Tokens live on `:root`, so they're available anywhere once `styles.css` is loaded. There
is **no provider component** to wrap in. **Dark mode** is opt-in: set `data-theme="dark"`
on the `<html>` element (`<html data-theme="dark">`); light is the default. Never hardcode
hex — read the tokens so light/dark both work.

## Styling idiom — CSS custom properties (`var(--*)`)

Style with the tokens; do not invent class names or a utility vocabulary — this system has none.

**Color** (`--color-*`, all theme-aware): `primary`, `primary-hover`, `on-primary`, `accent`,
`bg`, `surface`, `surface-muted`, `border`, `text`, `text-muted`, `secondary`, `taupe`,
`success`, `warning`, `danger`, `info`. Storage-zone accents: `--color-fridge`, `--color-freezer`,
`--color-cupboard`. AI accent: `--color-learning-ai` (+ `--color-learning-ai-gradient`).

**Type**: `--font` (`'DM Sans', system-ui, sans-serif`), sizes `--font-size-display | -body |
-body-md | -body-sm | -label`, weights `--font-weight-display` (700), `--font-weight-label`
(600), `--letter-spacing-label`, `--line-height-body`.

**Space** (rem scale): `--space-xs`(4) `-sm`(8) `-md`(16) `-lg`(24) `-xl`(32). Min tap target
`--touch-target-min` (2.75rem).

**Radius**: `--radius-sm`(8) `-md`(12) `-lg`(16). **Shadow** (theme-aware): `--shadow-sm`,
`--shadow-md`, `--nav-bottom-shadow`.

> `DM Sans` is loaded from Google Fonts in the real app and is **not embedded here**; the
> `--font` stack falls back to `system-ui` if the webfont isn't present.

## Where the truth lives

- `tokens/colors.css` — every color, light + `html[data-theme='dark']` overrides.
- `tokens/typography.css` — type, spacing, radius, shadow.

Read those two files before styling; they are the complete, authoritative token set.

## Idiomatic snippet — a card

```html
<article style="
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-lg);
  display: grid; gap: var(--space-sm);
  font-family: var(--font);
">
  <h3 style="font-size: var(--font-size-display); font-weight: var(--font-weight-display); margin: 0;">Skafferi</h3>
  <p style="color: var(--color-text-muted); margin: 0;">3 varor går ut snart</p>
  <button style="
    align-self: start;
    background: var(--color-primary); color: var(--color-on-primary);
    border: 0; border-radius: var(--radius-sm);
    padding: var(--space-sm) var(--space-md);
    min-height: var(--touch-target-min);
    font: inherit; font-weight: var(--font-weight-label); cursor: pointer;
  ">Lägg till på listan</button>
</article>
```
