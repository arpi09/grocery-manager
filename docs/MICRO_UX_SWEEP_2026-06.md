# MICRO_UX_SWEEP_2026-06

Checklist from Mobile UX Recovery sprint (R46–R58). Items marked **debt** need PO follow-up.

## Shipped in sprint

| # | Irritation | Fix | Slice |
|---|------------|-----|-------|
| 1 | Shopping intro text | Removed from list-first layout | R47 |
| 2 | `inventory.subtitle` scanner copy | Pantry copy | R58 |
| 3 | Bulk expiry banner jargon | Human copy | R58 |
| 4 | Lista invite mid-list | Removed from panel (share in overflow) | R47 |
| 5 | Always pantry nudge | Unchanged — collapse debt | debt |
| 6 | Search before list | Search after list | R47 |
| 7 | Greeting + pill + tagline | Home hero only (3-level) | R46 |
| 8 | Swipe hint `consume.finish` | `swipeFinish` / `swipePartial` | R58 |
| 9 | Section headings empty home | Sections deleted not hidden | R46 |
| 10 | Scan hub illustration | 3-card choice hub | R55 |
| 11 | Receipt guide default open | Verify R43 unchanged | R55 |
| 12 | Duplicate EatFirst | Single expiring strip (max 3) | R46 |
| 13 | Inventory empty photo CTA | Hub via add sheet | R49 |
| 14 | Mobile sort chip | Filter sheet | R51 |
| 15 | Footer share shopping | Overflow ⋯ menu | R47 |
| 16 | Row overflow z-index | `--z-sticky-chrome` / sheets | R52 |
| 17 | Post-onboarding survey stack | **debt** — separate overlay | debt |
| 18 | `home.v3.thisWeekTitle` | Deleted | R46 |
| 19 | Memory explorer footnote | Removed from home | R46 |
| 20 | Cold secondary scan chips | Single cold CTA | R46 |

## Explicit debt (PO approval)

| Item | Motivering |
|------|------------|
| **Inventory bottom tab** | `nav-config.ts` IA change — Mer sheet vs Lager tab |
| **Post-onboarding survey** | Overlay stack after onboarding rebuild |
| **Always pantry nudge** | Collapse to settings hint |
| **Grannskafferiet / Tier C** | Frozen zone |

## USER_LOCAL gates (post-deploy)

**M1:** Lista först; checkoff utan overlap; share i overflow  
**M2:** Lägg till-sheet; scroll gömmer chips; kompakta rader; Uppskattat med explanation  
**M3:** EN hero; max 3 minnesrader; max 3 utgående; ingen Rekommenderar/Hushåll  
**M4:** Scan 3 val; manual länk; onboarding 3 steg utan konfetti  
**M5:** Konsekvent rad/knapp familj
