# Brand Refresh Brief — Evolution, Not Rebrand

> **Scope:** Narrative sprint S5 micro-refresh. Full visual identity change is **explicitly out of scope** ([PRODUCT_NARRATIVE_SPRINT.md](./PRODUCT_NARRATIVE_SPRINT.md) — "Full logo rebrand" not included).

---

## Principle: evolution, not rebrand

Skaffu's mark (house + shelf + leaf on primary green) stays recognizable. The refresh aligns **story and copy** with [SKAFFU_2026_VISION.md](./SKAFFU_2026_VISION.md):

- **From:** skafferi-app, scanning, inventory-first impressions
- **To:** delad veckolista + hushållsminne, lista-first activation, kvitto as memory input

**Do not change:** wordmark "Skaffu", primary green (`--color-primary`), house silhouette, leaf accent, app icon shape, marketing domain skaffu.com.

**Do change (this sprint):** register subtitle/meta, optional shelf-line visibility in `AppLogo.svelte`, vision anchor docs.

---

## Narrative shift (copy, not logo)

| Dimension | Before (avoid) | After (lead) |
|-----------|----------------|--------------|
| **Category** | Pantry / skafferi-app | Shared weekly shopping + household memory |
| **First 60s CTA** | Scan / fill pantry | Create week's list, invite partner later |
| **Scan role** | Product hero | Loop input — kvitto primary, foto secondary |
| **Brain** | AI feature | Background learning from receipts + checkoffs |
| **Home** | Empty inventory dashboard | One next action briefing |

---

## Logo micro-tweak (S5 only)

**File:** `src/lib/components/atoms/AppLogo.svelte`

| Element | Change | Rationale |
|---------|--------|-----------|
| **Shelf stroke** | Opacity +0.15 (18% → 33% primary mix) | Slightly clearer "pantry shelf" read at small sizes without redesign |
| **House, leaf, bg, wordmark** | No change | Evolution constraint |

Future brand work (post-narrative sprint) may revisit shelf weight, wordmark spacing, or marketing illustrations — **not in S5**.

---

## Asset inventory

### In-app (keep, minor tweak only)

| Asset | Path / usage | S5 action |
|-------|----------------|-----------|
| App mark SVG | `AppLogo.svelte` | Shelf stroke opacity bump |
| Wordmark | Inline in `AppLogo.svelte` | None |
| Favicon / PWA icons | `static/` manifest icons | None |
| Turnstile / auth shells | Register, login | Copy only (i18n) |

### Marketing web (copy alignment — separate slices)

| Asset | Location | Notes |
|-------|----------|-------|
| Landing hero | `(marketing)/+page.svelte`, i18n | See [LANDING_STORY_AUDIT.md](./LANDING_STORY_AUDIT.md) — not S5 scope |
| Register page meta | `auth.register.*` in `sv.json` / `en.json` | **S5 — lista-first** |
| OG / social | Meta tags per route | Register metaDescription in S5 |
| Guide pages | `/guider/*` | Tier A narrative follow-up |

### Not in scope (Tier C / later)

- App Store screenshots refresh
- New illustration system
- Animated logo / Lottie
- Stripe checkout branding
- Email template redesign
- Grannskafferiet visual promotion

---

## Copy checklist (register — S5 DoD)

| Key | SV target | EN target |
|-----|-----------|-----------|
| `auth.register.subtitle` | Skapa veckans lista — bjud in partner när du vill | Create this week's list — invite your partner when you're ready |
| `auth.register.metaDescription` | Gratis gemensam veckolista för hushållet. Skaffu lär sig vad ni brukar köpa — butiksneutralt. | Free shared weekly list for your household. Skaffu learns what you usually buy — store-neutral. |

---

## Review gates

1. **Vision doc** exists and matches sprint one-liner
2. **Register copy** lista-first — no "skafferi-app med skanning" lead
3. **Logo diff** ≤ shelf stroke — no house/leaf/color changes
4. **No touch** onboarding, home, scan, nav code in S5 branch

---

## Related

- [SKAFFU_2026_VISION.md](./SKAFFU_2026_VISION.md)
- [UX_GUIDELINES.md](./UX_GUIDELINES.md) — tone and UI patterns
- [LANDING_STORY_AUDIT.md](./LANDING_STORY_AUDIT.md) — full marketing copy proposals
