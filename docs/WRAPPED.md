# Kylskåps-årstid (Wrapped) — MVP spec

Monthly household summary in a Spotify Wrapped–style flow. Private counterpart to the future public Skaffurapport.

## Route & entry

| Entry | Behavior |
|-------|----------|
| `/statistik/wrapped` | Primary experience; optional `?month=YYYY-MM` for past months |
| `/statistik` | CTA card when household has any consumption data |
| `/hem` | Optional banner on the **first Monday of each month** (client dismiss per month via `localStorage`) |

## Data sources

- `GamificationSnapshot` — engagement strip, milestones, lifetime `savedSek`
- `getSavingsReport` — monthly slice via consumption events in period
- Consumption trends — monthly consumed count, top product name
- `gamification.registry` — milestone labels and illustration variants

## Slides (in order)

| # | ID | When shown | Illustration | Copy (sv) |
|---|-----|------------|--------------|-----------|
| 1 | `intro` | Always | `ritual` | **Er kylskåps-årstid** — Månadssammanfattning för {month}. First month: *Er första månad med Skaffu*. |
| 2 | `savings` | Monthly data or lifetime savings | `savings` | **Ni räddade {sek} kr och {kg} kg** — Genom att använda maten innan den gick ut. |
| 3 | `topProduct` | Top consumed product exists | `milestone` | **Er mest förbrukade vara** — {product} |
| 4 | `streak` | `zeroWasteWeeks >= 1` | `streak` | **{count} veckors zero-waste streak** — Veckor utan kastat eller utgånget. |
| 5 | `milestones` | ≥1 achieved milestone | `milestone` | **{count} milstolpar** — Små vinster längs vägen. |
| 6 | `share` | Always | `savings` | **Dela er månad** — Screenshot-vänligt kort + Web Share / ladda ner PNG. |

Low-data households still get intro + share; savings slide uses lifetime totals when the month is empty.

## Share card

- Aspect ratio **9:16** (1080×1920 logical px), warm brand gradient (primary + success accents)
- `GamificationIllustration` + headline stats + Skaffu wordmark
- **Web Share API** (`navigator.share` with PNG file when supported)
- **Download PNG** via off-screen render → canvas export (`wrapped-share-export.ts`)
- `prefers-reduced-motion`: no slide transitions or illustration animations

## Product events

| Event | When | Metadata |
|-------|------|----------|
| `wrapped_viewed` | First slide shown (once per session) | `month`, `slideCount` |
| `wrapped_shared` | Share or download | `month`, `method`: `share` \| `download` |

## i18n

Keys under `wrapped.*` in `sv.json` and `en.json`.

## Tests

`src/lib/domain/wrapped.test.ts` — month parsing, banner trigger, slide builder, top product resolution, monthly savings filter.
