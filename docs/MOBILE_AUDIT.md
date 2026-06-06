# Mobile audit matrix — Skaffu

Viewport baseline: **390×844** (iPhone 14) and **360×800** (Android). Themes: `data-theme="light"` / `data-theme="dark"`.

Checklist per route: no horizontal scroll, touch targets ≥44px (`--touch-target-min`), primary CTA not covered by bottom nav (`--content-bottom-safe`), readable hierarchy in both themes.

**Status:** Pass · Fail · Pending · Known gap

| Route | Auth | Priority | Light | Dark | Findings / notes |
|-------|------|----------|-------|------|------------------|
| `/hem` | App | P0 | Pass | Pass | Scan card touch OK; disclosure summary ≥44px |
| `/inventory/fridge` | App | P0 | Pass | Pass | Location tabs + table scroll; sticky CTAs clear nav |
| `/inventory/pantry` | App | P0 | Pass | Pass | Same shell as fridge |
| `/inventory/freezer` | App | P0 | Pass | Pass | Same shell as fridge |
| `/inventory/foto` | App | P0 | Pass | Pass | Redirect → `/scan?mode=photo` |
| `/scan` (hub) | App | P0 | Pass | Pass | ScanFlowFooter clears bottom nav |
| `/scan?mode=barcode` | App | P0 | Pass | Pass | Footer + form inputs ≥44px |
| `/scan?mode=receipt` | App | P0 | Pass | Pass | Bulk flow scroll; no fixed overlap |
| `/scan?mode=photo` | App | P0 | Pass | Pass | Review actions sticky above nav |
| `/inkop` | App | P0 | Pass | Pass | Sticky add row; undo toast above nav; export ≥44px |
| `/item/new` | App | P0 | Pass | Pass | Full-page form; scan tabs ≥44px |
| `/item/[id]/edit` | App | P0 | Pass | Pass | Same form patterns as new |
| `/planer` | App | P1 | Pending | Pending | Agent 2 |
| `/planer/vecka` | App | P1 | Pending | Pending | Agent 2 — WeeklyRitualFlow |
| `/statistik` | App | P1 | Pending | Pending | Agent 2 |
| `/statistik/wrapped` | App | P1 | Pending | Pending | Agent 2 — share card scaling |
| `/settings` | App | P1 | Pending | Pending | Agent 2 |
| `/profile` | App | P1 | Pending | Pending | Agent 2 |
| `/nyheter` | App | P1 | Pending | Pending | Agent 2 |
| `/husdjur` | App | P1 | Pending | Pending | Agent 2 |
| `/install-app` | App | P1 | Pending | Pending | Agent 2 — PWA CTA |
| `/login` | Public | P2 | Pending | Pending | Agent 2 |
| `/register` | Public | P2 | Pending | Pending | Agent 2 |
| `/verify-email` | Public | P2 | Pending | Pending | Agent 2 |
| `/verify-email/[token]` | Public | P2 | Pending | Pending | Agent 2 |
| `/forgot-password` | Public | P2 | Pending | Pending | Agent 2 |
| `/reset-password/[token]` | Public | P2 | Pending | Pending | Agent 2 |
| `/invite/[token]` | Public | P2 | Pending | Pending | Agent 2 |
| `/` | Public | P2 | Pending | Pending | Agent 2 — marketing |
| `/funktioner` | Public | P2 | Pending | Pending | Agent 2 |
| `/priser` | Public | P2 | Pending | Pending | Agent 2 |
| `/faq` | Public | P2 | Pending | Pending | Agent 2 |
| `/sa-fungerar-det` | Public | P2 | Pending | Pending | Agent 2 |
| `/privacy` | Public | P2 | Pending | Pending | Agent 2 |
| `/rapport/[month]` | Public | P2 | Pending | Pending | Agent 2 — growth wave |
| `/dela/[token]` | Public | P2 | Pending | Pending | Agent 2 — share link |
| `/admin` | Admin | P2 | Pending | Pending | Agent 2 — table `@media 900px` |

## Shared shell (mobile ≤899px)

| Component | Light | Dark | Fixed in this pass |
|-----------|-------|------|--------------------|
| `MainNavMobile` + bottom nav | Pass | Pass | Nav-more sheet safe-area padding |
| `NavMoreSheet` | Pass | Pass | Touch targets already ≥44px |
| `PantrySwitcher` sheet | Pass | Pass | Sheet padding uses `--content-bottom-safe` |
| `ProfileMenu` sheet | Pass | Pass | `100dvh` cap + safe-area body padding |
| `CookieConsentBanner` | Pass | Pass | Offset above app bottom nav via `:has(.app)` |
| `OnboardingGuide` | Pass | Pass | Footer safe-area inset on fullscreen mobile |
| `PageHintModal` / `PmfSurveyBanner` | Pass | Pass | Already use `--content-bottom-safe` |

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
| Low | Photo round | Remove-photo control tiny | Expanded hit target |

## Regression

- `npm run check`
- Existing E2E: `e2e/navigation.spec.ts`, `e2e/scan-inventory.spec.ts`, `e2e/recipe-assistant.spec.ts`
- Planned: `e2e/mobile-visual.spec.ts` (Agent 2 / mobile-e2e todo)
