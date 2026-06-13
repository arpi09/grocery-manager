# Home V3 — `/hem`

> **Princip:** Home = hushållets nästa bästa handling. Max **3 primära sektioner**, alltid synliga (inte gömda i kollaps).

## Layout (engagerat skafferi)

| # | Fråga | Sektion | Komponent |
|---|--------|---------|-----------|
| 1 | Vad behöver min uppmärksamhet? | **Uppmärksamhet** | `HomeAttentionStack.svelte` |
| 2 | Vad rekommenderar Skaffu? | **Skaffu föreslår** | `ReplenishmentSection` (max 3, `surface="hem"`) + kvitto-fotnot |
| 3 | Vad ska jag göra nu? | **Gör nu** | Veckans inköpslista (primär) + `HomeNextAction` (sekundär) |

**Tomt skafferi:** sektion 1 kort text → sektion 3 = `EmptyState` (befintlig onboarding-väg).

## Komponentmatris (audit)

| Komponent | Beslut |
|-----------|--------|
| Hero | Keep |
| EmptyState | Keep → sektion 3 (tom) |
| EatFirstSection | Move → sektion 1 (via `HomeAttentionStack`) |
| ReplenishmentSection | Keep → sektion 2 |
| WastePreventionBanner | Collapse → sektion 1 |
| HomeNextAction | Move → sektion 3 (secondary) |
| WeeklyRitualHero | Remove |
| ReceiptAutopilotSection | Collapse → sektion 2 fotnot |
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

`weeklyFocus = totalItems > 0` gömde `HouseholdBriefing` för engagerade användare. V3 splittar briefing i sektion 1+2 utan gate.

## Server load (`hem/+page.server.ts`)

**Behålls:** `summary`, `intelligence`, `shoppingListCount`, `receiptAutopilot`, `receiptFinish`, `celebration`.

**Borttaget från Hem:** `engagement`, `savings`, `activityEvents`, `showWeeklyRitual`, `recentItemNames`, `duplicateGroups`.

## i18n

- `home.v3.attentionTitle`
- `home.v3.recommendsTitle`
- `home.v3.doNowTitle`
- `home.v3.receiptFootnote`

## Relaterat

- Default app home förblir `/inkop` (`APP_HOME_PATH`) — Hem är dashboard/briefing, inte default route.
- [CURRENT_REALITY.md](./CURRENT_REALITY.md) — prod nav + flags.
