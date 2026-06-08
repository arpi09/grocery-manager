# UX audit — May 2026 (post-unified nav)

Route-by-route findings using Don Norman principles and [`UX_GUIDELINES.md`](./UX_GUIDELINES.md). Severity: **P0** (blocks core goal), **P1** (high friction), **P2** (polish).

North star mental model: **Fyll på → Kolla → Laga → Handla** (four verbs, not fifteen routes).

---

## Summary

| Route | User goal | Primary CTA (before) | Choices above fold | Norman gap | Severity |
|-------|-----------|----------------------|--------------------|------------|----------|
| `/hem` | Know status + next step | None (5+ equal actions) | 8–12 | Signifiers, constraints | **P0** |
| `/scan` (hub) | Add items fast | Photo + 3 mode cards | 4 | Mapping | **P1** |
| `/scan?mode=photo` | Photo round | Zone picker (forced) | 2–3 | Mapping, feedback | **P1** |
| `/inventory/[loc]` | View/add items | Photo + barcode + manual | 3 | Signifiers | **P1** |
| `/planer` | Plan meals | Generate + calendar + ideas | 3+ | Constraints | **P1** |
| `/inkop` | Shop list | Add + smart fill | 2–3 | Feedback | **P1** |
| `/inventory/synk` | Confirm stale items | Batch confirm | 1 | Naming (fixed) | **P2** |
| Onboarding | First item fast | Receipt vs barcode | 2 | Mapping vs nav | **P1** |

---

## `/hem` — P0

**User goal:** Understand pantry status and know the single best next action.

**Before (engaged user):** WeeklyRitualHero, shopping teaser, HomeQuickAdd, duplicate warnings, pantry status card, MealTimeSuggestions, EngagementStrip, ActivityFeed, Skafferapport, EatFirst, Locations, ReceiptAutopilot, ProUpgradeCta — **~10 sections**, **5+ green/primary-weight CTAs**.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| No situationsstyrd “nästa handling” | Signifiers | P0 |
| Duplicate synk-ingångar (hero + pantry status + nav badge) | Conceptual model | P0 |
| MealTimeSuggestions + WeeklyRitualHero both push recipes | Consistency | P1 |
| Merge-länk synlig utan duplicates | Constraints | P1 |
| Feed/engagement/report above fold for power users | Constraints | P1 |

**Target:** ≤3 blocks above fold — (1) status hero, (2) one primary CTA, (3) shopping teaser. Rest behind “Mer på hem”.

**Primary CTA count (before):** 5+ (photo in ritual, sync, plan, meal suggestions, quick add barcode, empty-state actions).

---

## `/scan` — P1

**User goal:** Add items with minimal taps from bottom **Skanna** tab.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Tab label “Skanna” → hub with 4 equal choices | Mapping | P1 |
| Hub default before photo/barcode smart default | Default beats menu | P1 |

**Target:** Tab → last-used mode (default photo); hub only via “Fler sätt”.

**Primary CTA count (hub):** 1 hero + 3 secondary tiles = 4 choices.

---

## `/scan?mode=photo` — P1

**User goal:** Capture shelf photo and save detected items.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Forced location step before value | Mapping | P1 (partially addressed) |

**Target:** AI infers zone; optional override link only.

---

## `/inventory/[location]` — P1

**User goal:** See items at location; add when needed.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Three add methods same visual weight | Signifiers | P1 |

**Target:** One primary “Lägg till varor”; barcode/manual as text links.

**Primary CTA count (before):** 2–3 full-width actions.

---

## `/planer` — P1

**User goal:** Generate or plan meals from inventory.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Calendar + ideas + EatHubHero = duplicate recipe entry vs `/hem` | Consistency | P1 |
| Empty calendar dominates before first planned meal | Constraints | P1 |

**Target:** EatHubHero = primary on Äta; calendar collapsed until ≥1 meal or user expands.

---

## `/inkop` — P1

**User goal:** Maintain shopping list; smart fill from pantry.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Smart fill lacks scroll-to-list + celebration feedback | Feedback | P1 |

**Target:** After fill → scroll to list + brief success (celebration ≥15 items).

---

## `/inventory/synk` — P2

**User goal:** Confirm what is still in stock.

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| “Synk” implies cloud sync | Conceptual model | P2 (copy improved) |

---

## Onboarding & overlays — P1

| Finding | Norman lens | Severity |
|---------|-------------|----------|
| Step 2 copy generic “bottom menu” not **Skanna** tab | Mapping | P1 |
| Onboarding + page hints + celebration can stack | Constraints | P1 |

**Target:** Point to Skanna-flik; max one modal overlay (guide OR hint OR celebration).

---

## Cross-cutting — P2

| Area | Finding | Severity |
|------|---------|----------|
| Toast | Fragmented local vs global paths | P2 |
| Desktop Mer menu | Minor hierarchy polish opportunity | P2 |
| Beta interviews | Qualitative validation per BETA_LAUNCH_SOFT | P2 (deferred) |

---

## Implementation mapping (this pass)

| Audit item | Phase | Status |
|------------|-------|--------|
| Hem max 3 blocks + HomeNextAction | 1 | Implemented |
| Pantry status → WeeklyRitualHero merge | 1 | Implemented |
| Onboarding Skanna copy + overlay constraint | 1 | Implemented |
| Scan smart default + foto zone optional | 2 | Implemented |
| Inventory single CTA | 2 | Implemented |
| Planer calendar progressive | 2 | Implemented |
| Inköp fill feedback | 2 | Implemented |
| UX_GUIDELINES post-nav rules | 0 | Implemented |
| Toast Track F (pragmatic) | 3 | Partial — undo paths remain local |
| Desktop Mer polish | 3 | Minor spacing/aria |
| axe / beta interviews | 3 | Deferred (no P0 route structure change) |

---

## Success metrics (baseline → target)

| Metric | Before | Target |
|--------|--------|--------|
| Blocks on `/hem` above fold | ~8–12 | ≤3 + nav |
| Primary CTAs per viewport on `/hem` | 5+ | 1 |
| Taps Skanna tab → capture | 2+ (hub) | 1 |
| Beta “förvirrande” | qualitative | ↓ after phase 1 |

*Audit date: 2026-05 (documented 2026-06-08 implementation pass).*
