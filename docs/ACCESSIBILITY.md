# Accessibility — Skaffu (WCAG 2.2 AA)

Canonical reference for accessibility goals, scope, component contracts, and automated audit results.

## Goal

**[WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA** across the product: app routes, auth, marketing, and admin.

**In scope:** Success criteria at levels A and AA, including WCAG 2.2 additions (focus not obscured, target size, accessible authentication where applicable).

**Out of scope (for now):** AAA, VPAT/certification, third-party audit sign-off.

## Scope

| Area | Routes / surfaces |
|------|-------------------|
| Marketing | `(marketing)/*`, landing `/` |
| Auth | `/login`, `/register`, `/verify-email`, password reset |
| App (P0) | `/hem`, `/inventory/*`, `/scan`, `/inkop`, `/item/new`, `/item/[id]/edit` |
| App (P1) | `/settings`, `/planer`, `/statistik`, `/profile`, growth: `/statistik/wrapped`, `/rapport/[month]`, `/dela/[token]` |
| Admin (P2) | `/admin` |

## Documented exceptions

| Surface | Exception | Mitigation |
|---------|-----------|------------|
| Barcode / camera preview | Live video has no text alternative | Instructions + manual entry fallback (`/item/new`, scan hub links) |
| Marketing hero illustrations | Decorative (`aria-hidden`) | Meaning conveyed in adjacent copy |
| Onboarding / PMF modals | May obscure focus temporarily | Dismissible; skip links; modal focus trap per `docs/MODAL_CONTRACT.md` |
| Page-enter animations | Opacity animation can confuse automated contrast checks | E2E axe runs with `prefers-reduced-motion: reduce` (matches user setting) |

## Component contracts

Extends `docs/BRAND.md` and `docs/MODAL_CONTRACT.md`.

| Component | Contract |
|-----------|----------|
| **Button** | `aria-busy` when loading; visible focus ring |
| **Toggle** | `role="switch"`, `aria-checked`; associated label; disabled state without opacity-only styling |
| **FormField** | Errors in `role="alert"`; `aria-invalid` / `aria-describedby` on fields |
| **Toast** | `role="status"` + `aria-live="polite"` (errors: `role="alert"` + `assertive`); hover pauses auto-dismiss |
| **Modal** | Focus trap, restore focus, `aria-labelledby` — see `src/lib/utils/modal-a11y.ts` |
| **App shell** | Skip link → `#main-content`; one `h1` per page (`AppHeader` or auth/marketing title) |
| **LanguageSwitcher** | `aria-current` on active locale; per-button `aria-label` |
| **Icon-only controls** | Parent `aria-label` required (e.g. `RecipeIdeasButton`, `ProfileMenu`) |

## Design tokens (contrast)

| Token | Light | Use |
|-------|-------|-----|
| `--color-text` on `--color-bg` | ≥ 4.5:1 | Body copy |
| `--color-text-muted` | `#4a5850` on `#f7f5f0` | Secondary text, labels |
| `--color-primary` on `--color-on-primary` | ≥ 4.5:1 | Primary buttons, badges |
| `--color-warning` | `#9a6700` / `#e8a317` (dark) | Expiry / caution UI |

## Baseline axe audit (`@axe-core/playwright`)

Tags: `wcag2a`, `wcag2aa`, `wcag22aa`. Viewports: **1400×900** (desktop baseline), **390×844** (iPhone 14 mobile gate in `e2e/mobile-visual.spec.ts`). Locale: `sv`.  
**Before** = pre-fix snapshot (Mar 2026). **After** = post-fix; P0 enforced in `e2e/accessibility.spec.ts` (desktop) and `e2e/mobile-visual.spec.ts` (mobile).

| Priority | Route | Critical (before) | Serious (before) | Critical (after) | Serious (after) | Notes |
|----------|-------|-------------------|------------------|------------------|-----------------|-------|
| P0 | `/` | 0 | 4 | 0 | 0 | Marketing hero location chips contrast |
| P0 | `/login` | 0 | 0 | 0 | 0 | — |
| P0 | `/register` | 0 | 1 | 0 | 0 | Inline login link in footer |
| P0 | `/hem` | 0 | 1* | 0 | 0 | *Animation opacity false positive; real fixes: tokens, Pro CTA, links |
| P0 | `/inventory/fridge` | 0 | 1* | 0 | 0 | *Animation; location tabs OK after motion fix |
| P0 | `/scan` | 0 | 1* | 0 | 0 | *Animation |
| P0 | `/inkop` | 0 | 1* | 0 | 0 | *Animation |
| P1 | `/settings` | 0 | 1 | 0 | 0 | Disabled toggle label opacity |
| P1 | `/planer` | 0 | 0 | 0 | 0 | — |
| P1 | `/statistik` | 0 | 0 | 0 | 0 | Removed invalid `role="list"` |
| P1 | `/statistik/wrapped` | — | — | 0 | 0 | Growth wave — mobile pass (Jun 2026) |
| P1 | `/rapport/[month]` | — | — | 0 | 0 | Public Skaffurapport — growth wave |
| P1 | `/dela/[token]` | — | — | 0 | 0 | Public expiring-share link |
| P1 | `/priser` | 0 | 0 | 0 | 0 | — |
| P1 | `/verify-email` | 0 | 0 | 0 | 0 | — |
| P2 | `/admin` | 0 | 0 | 0 | 0 | — |

Moderate/minor findings (e.g. duplicate landmarks on complex pages) are tracked but do not block release.

## Automated regression

- **Package:** `@axe-core/playwright` (devDependency)
- **CI / E2E:** `e2e/accessibility.spec.ts` — P0 routes at desktop viewport; `e2e/mobile-visual.spec.ts` — P0 at 390×844 (`mobile-chrome` project); serial auth; fail on critical/serious
- **Helper:** `e2e/helpers/axe.ts`
- **Baseline script:** `scripts/a11y-baseline.mjs` (optional local audit)

## Manual spot-check (release)

1. Keyboard: Tab from skip link through main content on `/hem` and `/inkop` (focus not fully hidden by bottom nav).
2. Screen reader: One `h1`, landmarks (`header`, `nav`, `main`), toast announcements.
3. Zoom 200%: No horizontal scroll on `/settings` and `/scan`.
4. `prefers-reduced-motion`: Marketing scroll reveals show content immediately.

## Changelog

| Date | Change |
|------|--------|
| 2026-06 | Mobile viewport axe gate (`mobile-chrome`), growth routes P1 scope |
| 2026-03 | Initial WCAG 2.2 AA baseline, skip links, axe P0 gate, token/contrast fixes |
