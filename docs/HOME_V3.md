# Home V3 — `/hem`

> **Princip:** Home = hushållets nästa bästa handling. Max **3 primära sektioner**, alltid synliga (inte gömda i kollaps).

## Layout (engagerat skafferi)

| # | Fråga | Sektion | Komponent |
|---|--------|---------|-----------|
| 1 | Vad ska vi handla denna vecka? | **Denna vecka** | Veckans inköpslista (primär) + `HomeNextAction` (sekundär) |
| 2 | Vad rekommenderar Skaffu? | **Skaffu rekommenderar** | `ReplenishmentSection` (max 3, `surface="hem"`) + kvitto-fotnot |
| 3 | Hur mår hushållet? | **Hushållet** | `HomeHouseholdSection.svelte` (eat-first, waste, sync, pantry health) |

**Tomt skafferi:** sektion 1 = `EmptyState` (befintlig onboarding-väg); sektion 2+3 = tom-copy (alltid 3 rubriker).

## Komponentmatris (audit)

| Komponent | Beslut |
|-----------|--------|
| Hero | Keep — uppdaterad `taglineEngaged` |
| EmptyState | Keep → sektion 1 (tom) |
| Shopping teaser + badge | Keep → sektion 1 (primär CTA) |
| HomeNextAction | Keep → sektion 1 (secondary) |
| ReplenishmentSection | Keep → sektion 2 |
| ReceiptAutopilotSection | Collapse → sektion 2 fotnot |
| EatFirstSection | Move → sektion 3 (via `HomeHouseholdSection`) |
| WastePreventionBanner | Move → sektion 3 |
| WeeklyRitualHero | Remove |
| MealTimeSuggestions | Remove (→ `/planer`) |
| HomeQuickAdd | Remove |
| ProUpgradeCta | Remove |
| WrappedBanner | Remove |
| EngagementStrip | Remove (→ `/statistik`) |
| HouseholdActivityFeed | Remove |
| SkafferapportWidget | Remove (→ `/statistik`) |
| Locations grid | Remove (→ `/inventory/fridge`) |
| "Mer på hem" | Remove |

## Bugfix

`showRecommendsSection` gömde sektion 2 när inga replenishment-rader fanns. V3 visar alltid 3 sektioner med tom-copy.

## Server load (`hem/+page.server.ts`)

**Behålls:** `summary`, `intelligence`, `shoppingListCount`, `receiptAutopilot`, `receiptFinish`, `celebration`.

**Borttaget från Hem:** `engagement`, `savings`, `activityEvents`, `showWeeklyRitual`, `recentItemNames`, `duplicateGroups`.

## i18n

- `home.v3.thisWeekTitle`
- `home.v3.recommendsTitle`
- `home.v3.householdTitle`
- `home.v3.recommendsEmpty`
- `home.v3.householdEmpty`
- `home.v3.receiptFootnote`
- `home.taglineEngaged` — produktlöfte (veckohandel + hushållsminne)

## Relaterat

- Default app home är `/hem` (`APP_HOME_PATH`) — Hem är dashboard/briefing; Inköp (`/inkop`) är djup-länk i kärnloopen.
- [CURRENT_REALITY.md](./CURRENT_REALITY.md) — prod nav + flags.
