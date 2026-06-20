# Consumer UX v2 — Design Lock

**Date:** 2026-06-18  
**Status:** Illustrations locked · Copy package ready for review · Implementation order locked

## Locked: Illustration variant A (all scenes)

User approved variant **A** for every scene. Final assets live in `illustrations/final/`:

| Scene | File | Reference style |
|-------|------|-----------------|
| Home hero | `home-hero.svg` | v4 isometric modular |
| For you | `for-you.svg` | v2 grid with accent |
| Shopping plan | `shopping-plan.svg` | v5 object study row |
| Shopping trip | `shopping-trip.svg` | v4 isometric forward progression |
| Pantry shelf | `pantry-shelf.svg` | v1 shelf system (Claude reference) |
| Household | `household.svg` | v2 grid connected forms |

Source variants (`*-a.svg`) remain in `illustrations/` for gallery comparison. B/C variants are **not** locked — do not use in product without new gate.

## Locked: Screen structure (390×844 mockups)

Four mobile screens in `screens/`:

1. **home.html** — Household Briefing (hero + För dig next-action card)
2. **shopping-plan.html** — Trip Plan (mode toggle, memory-first, no checkbox rows)
3. **shopping-trip.html** — Trip Shop (progress, large checkoff CTA)
4. **pantry.html** — Shelf View (zone bands, product tiles)

Mockup HTML may still show DRAFT badges and dual-language reference lines. **Production copy** lives in separate locale files under `copy/`.

## Locked: Copy package (final draft for gate)

| File | Locale | Surface |
|------|--------|---------|
| [`copy/COPY_PACKAGE.md`](copy/COPY_PACKAGE.md) | Index | Master |
| [`copy/shopping-v2.sv.md`](copy/shopping-v2.sv.md) | SV | Inköp Plan + Trip |
| [`copy/shopping-v2.en.md`](copy/shopping-v2.en.md) | EN | Inköp Plan + Trip |
| [`copy/home-briefing.sv.md`](copy/home-briefing.sv.md) | SV | Hem (phase 3) |
| [`copy/home-briefing.en.md`](copy/home-briefing.en.md) | EN | Hem (phase 3) |
| [`copy/pantry-shelf.sv.md`](copy/pantry-shelf.sv.md) | SV | Skafferi (phase 2) |
| [`copy/pantry-shelf.en.md`](copy/pantry-shelf.en.md) | EN | Skafferi (phase 2) |

**Copy gate status:** ⏳ Awaiting SV + EN approval — see [`PRE_IMPLEMENTATION_CHECKLIST.md`](PRE_IMPLEMENTATION_CHECKLIST.md).

## Locked: Implementation order

1. **Shopping V2** — Plan + Trip on `/inkop` · flag `SHOPPING_UX_V2_ENABLED` · plan: [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](SHOPPING_V2_IMPLEMENTATION_PLAN.md)
2. **Pantry** — Shelf view, eat-first bands
3. **Home** — Household Briefing, För dig card

**Not parallel:** Home and Pantry implementation wait until Shopping V2 ships or explicit reprioritization gate.

## Next gates (in order)

1. ~~**Illustration lock**~~ — Done (variant A).
2. ~~**Mockup structure lock**~~ — Done (four screens).
3. **Copy review gate** — Approve SV + EN in `copy/`; check [`PRE_IMPLEMENTATION_CHECKLIST.md`](PRE_IMPLEMENTATION_CHECKLIST.md).
4. **USER_LOCAL** — Real device 390×844 on mockups or dev build.
5. **Implementation** — Shopping V2 PRs per implementation plan.

## Do not change without new gate

- Illustration style direction (Montana/HAY geometric, muted sage/taupe on `#f7f5f0`)
- Variant A asset selection per scene
- Memory-first plan UX (no checkbox list on plan screen primary surface)
- Focus-mode shop UX (one item + large CTA)
- Bottom nav: Hem / Inköp / Mer
- Separate SV/EN locale files (no dual language on one production screen)

## Entry points

- **Copy index:** [`copy/COPY_PACKAGE.md`](copy/COPY_PACKAGE.md)
- **Shopping implementation:** [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](SHOPPING_V2_IMPLEMENTATION_PLAN.md)
- **Pre-code checklist:** [`PRE_IMPLEMENTATION_CHECKLIST.md`](PRE_IMPLEMENTATION_CHECKLIST.md)
- **E2E flow:** [`index.html`](index.html)
- **Gallery (A marked):** [`illustrations/gallery.html`](illustrations/gallery.html)
- **Final SVGs:** [`illustrations/final/`](illustrations/final/)
