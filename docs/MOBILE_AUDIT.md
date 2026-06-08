# Mobile audit matrix — Skaffu

Viewport baseline: **390×844** (iPhone 14) and **360×800** (Android). Themes: `data-theme="light"` / `data-theme="dark"`.

Checklist per route: no horizontal scroll, touch targets ≥44px (`--touch-target-min`), primary CTA not covered by bottom nav (`--content-bottom-safe`), readable hierarchy in both themes.

**Status:** Pass · Fail · Pending · Known gap

| Route | Auth | Priority | Light | Dark | Findings / notes |
|-------|------|----------|-------|------|------------------|
| `/hem` | App | P0 | Pass | Pass | Scan card touch OK; disclosure summary ≥44px |
| `/inventory/fridge` | App | P0 | Pass | Pass | Location tabs + table scroll; sticky CTAs clear nav |
| `/inventory/cupboard` | App | P0 | Pass | Pass | Skafferi — same shell as fridge |
| `/inventory/freezer` | App | P0 | Pass | Pass | Same shell as fridge |
| `/inventory/synk` | App | P0 | Pass | Pass | Single h1 via AppHeader; undo toast above nav; batch review sticky |
| `/inventory/foto` | App | P0 | Pass | Pass | Redirect → `/scan?mode=photo` |
| `/scan` (hub) | App | P0 | Pass | Pass | ScanFlowFooter clears bottom nav |
| `/scan?mode=barcode` | App | P0 | Pass | Pass | Footer + form inputs ≥44px |
| `/scan?mode=receipt` | App | P0 | Pass | Pass | Bulk flow scroll; no fixed overlap |
| `/scan?mode=photo` | App | P0 | Pass | Pass | Review actions sticky above nav |
| `/inkop` | App | P0 | Pass | Pass | Sticky add row; undo toast above nav; export ≥44px |
| `/item/new` | App | P0 | Pass | Pass | Full-page form; scan tabs ≥44px |
| `/item/[id]/edit` | App | P0 | Pass | Pass | Same form patterns as new |
| `/planer` | App | P1 | Pass | Pass | Weekly ritual flow; sticky CTAs |
| `/planer/vecka` | App | P1 | Pass | Pass | WeeklyRitualFlow touch targets |
| `/statistik` | App | P1 | Pass | Pass | Dashboard cards scroll cleanly |
| `/statistik/wrapped` | App | P1 | Pass | Pass | Share card scaling at 390px |
| `/settings` | App | P1 | Pass | Pass | Form controls ≥44px |
| `/profile` | App | P1 | Pass | Pass | Action links min-height |
| `/nyheter` | App | P1 | Pass | Pass | Feed layout; no overflow |
| `/husdjur` | App | P1 | Pass | Pass | Pet cards + CTA spacing |
| `/install-app` | App | P1 | Pass | Pass | PWA CTA touch targets |
| `/login` | Public | P2 | Pass | Pass | Auth form inputs ≥44px |
| `/register` | Public | P2 | Pass | Pass | Same shell as login |
| `/verify-email` | Public | P2 | Pass | Pass | Centered card layout |
| `/verify-email/[token]` | Public | P2 | Pass | Pass | Token flow card |
| `/forgot-password` | Public | P2 | Pass | Pass | Form controls |
| `/reset-password/[token]` | Public | P2 | Pass | Pass | Form controls |
| `/invite/[token]` | Public | P2 | Pass | Pass | Accept CTA min-height |
| `/` | Public | P2 | Pass | Pass | Marketing header nav |
| `/funktioner` | Public | P2 | Pass | Pass | Marketing layout |
| `/priser` | Public | P2 | Pass | Pass | Pricing cards |
| `/faq` | Public | P2 | Pass | Pass | Accordion touch targets |
| `/sa-fungerar-det` | Public | P2 | Pass | Pass | Marketing layout |
| `/privacy` | Public | P2 | Pass | Pass | Long-form readable |
| `/rapport/[month]` | Public | P2 | Pass | Pass | Growth wave — rapport hero |
| `/dela/[token]` | Public | P2 | Pass | Pass | Share link public page |
| `/admin` | Admin | P2 | Pass | Pass | Table `@media 900px`; tab targets |

## Shared shell (mobile ≤899px)

| Component | Light | Dark | Fixed in this pass |
|-----------|-------|------|--------------------|
| `MainNavMobile` + bottom nav | Pass | Pass | `safe-area-inset-top` on header; `--nav-height` includes inset |
| `NavMoreSheet` | Pass | Pass | Touch targets already ≥44px |
| `PantrySwitcher` sheet | Pass | Pass | Sheet padding uses `--content-bottom-safe` |
| `ProfileMenu` sheet | Pass | Pass | `100dvh` cap + safe-area body padding |
| `CookieConsentBanner` | Pass | Pass | Offset above app bottom nav via `:has(.app)` |
| `OnboardingGuide` | Pass | Pass | Footer safe-area inset on fullscreen mobile |
| `PageHintModal` / `PmfSurveyBanner` | Pass | Pass | Already use `--content-bottom-safe` |

## P0 fixes applied (2026-06-08 — visual audit)

| Severity | Route / area | Issue | Fix |
|----------|--------------|-------|-----|
| High | Undo toast (inventory, inköp, synk) | Toast portaled to body while Ångra stayed inline — flex broken | `Toast portal={false}` inside `.undo-toast-wrap` |
| High | Inventory + settings sticky | Filter/tabs scrolled under mobile header (`top: 0`) | `--sticky-below-header` token on app-internal sticky chrome |
| High | `/inventory/synk` | Duplicate h1; undo under nav (`z-index: 40`) | Inner title → h2; undo wrap uses `var(--z-toast)`; 8s undo |
| High | `MainNavMobile` | Status bar overlap on notch devices | `padding-top: env(safe-area-inset-top)` on header |

## P0 fixes applied (2026-06-06)

| Severity | Route / area | Issue | Fix |
|----------|--------------|-------|-----|
| High | `/inkop` | Undo toast overlapped bottom nav | `bottom: var(--content-bottom-safe)` |
| High | `/inkop` | Add row hidden when scrolling long lists | Sticky add-form above bottom nav |
| High | `/scan` | Cancel footer stuck under bottom nav | `ScanFlowFooter` sticky offset on narrow |
| High | App (logged in) | Cookie bar covered bottom nav tabs | `body:has(.app)` consent offset |
| Medium | `/scan?mode=photo` | Submit row scrolled under nav on review | Sticky `.actions` with nav offset |
| Medium | Recipe assistant | Sheet height used `vh` not `dvh` | `100dvh` on mobile sheet |
| Medium | Inventory tables | Sort controls below 44px on card layout | `sort-btn` min-height on narrow |
| Medium | Inventory tabs | Tab links short on 360px | `LocationTab` min-height 44px |
| Medium | Item forms | Scan method tabs small tap area | `AddItemForm` tab + input min-height |
| Medium | Scan mode tabs | Tab pills below 44px on mobile | `ScanModeTabs` uses `--touch-target-min` |
| Medium | Empty state | Secondary CTA below 44px | `EmptyState` secondary action min-height |
| Medium | Photo / receipt pickers | Camera file input unlabeled | `ImageSourcePicker` `aria-label` on camera input |
| Medium | Error banners | Danger text fails contrast on tinted bg | `FeedbackBanner` error tone darkened |
| Low | Photo round | Remove-photo control tiny | Expanded hit target |

## Regression

- `npm run check`
- Existing E2E: `e2e/navigation.spec.ts`, `e2e/scan-inventory.spec.ts`, `e2e/recipe-assistant.spec.ts`
- `e2e/mobile-visual.spec.ts` — P0 at 390×844 (`mobile-chrome` project): horizontal scroll, touch-target sampling, axe (includes `/inventory/synk`)
- `e2e/accessibility.spec.ts` — axe on P0 routes including `/inventory/synk`
