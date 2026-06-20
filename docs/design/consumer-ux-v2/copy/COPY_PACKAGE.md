# Consumer UX v2 — Copy Package

**Status:** Final copy for review gate · Illustrations locked (variant A)  
**Date:** 2026-06-18  
**Tone:** Warm, calm, Scandinavian, confident, practical — someone who quietly has things under control. Not corporate, not marketing, not AI hype.

## Rules

- **Separate locale files** — production shows one language per user session, never SV+EN on the same screen.
- **i18n keys** are proposals for `src/lib/i18n/locales/{sv,en}.json` at implementation.
- **Shopping** keys: `shopping.v2.*` · **Home** keys: `home.v6.*` · **Pantry** keys: `pantry.v2.*`
- Mockup HTML in `screens/` may still show dual-language DRAFT badges until implementation; product code must not.

## Files

| File | Locale | Surface | Implementation phase |
|------|--------|---------|----------------------|
| [`shopping-v2.sv.md`](shopping-v2.sv.md) | SV | Inköp Plan + Trip (`/inkop`) | **Phase 1** |
| [`shopping-v2.en.md`](shopping-v2.en.md) | EN | Inköp Plan + Trip | **Phase 1** |
| [`home-briefing.sv.md`](home-briefing.sv.md) | SV | Hem Household Briefing | Phase 3 |
| [`home-briefing.en.md`](home-briefing.en.md) | EN | Hem Household Briefing | Phase 3 |
| [`pantry-shelf.sv.md`](pantry-shelf.sv.md) | SV | Skafferi Shelf View | Phase 2 |
| [`pantry-shelf.en.md`](pantry-shelf.en.md) | EN | Skafferi Shelf View | Phase 2 |

## Shared navigation (existing keys — do not duplicate)

Bottom nav uses existing `nav.shopping`, `nav.more`, and home brand strings. Shopping V2 does not rename nav labels.

## Review gate checklist

1. Read SV files aloud — sounds like a calm household coordinator, not an app pitch.
2. Read EN files — same tone; not literal awkward SV→EN.
3. Confirm no "AI", "smart", or "magic" in primary surfaces (Plan memory section says "Skaffu minns", not "AI suggests").
4. Sign off in [`PRE_IMPLEMENTATION_CHECKLIST.md`](../PRE_IMPLEMENTATION_CHECKLIST.md).

## After approval

Implementation order (locked in [`LOCK.md`](../LOCK.md)):

1. Shopping V2 (Plan + Trip) — see [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](../SHOPPING_V2_IMPLEMENTATION_PLAN.md)
2. Pantry Shelf View
3. Home Household Briefing
