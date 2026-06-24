# Codebase map

> **Syfte:** Kurerad feature → routes → nyckelfiler för agenter och utvecklare. Maskinläsbar källa: [`codebase-map.manifest.json`](./codebase-map.manifest.json). Genererad route-lista: [`generated/route-index.md`](./generated/route-index.md).

**Läsordning:** [AGENTS.md](../AGENTS.md) → denna fil → [CURRENT_REALITY.md](./CURRENT_REALITY.md) → [features/](./features/) vid behov.

## Huvudtabell (Tier A/B-ytor)

| Feature | User routes | Key UI | Application | Repos / domain | Tester | Doc |
|---------|-------------|--------|-------------|----------------|--------|-----|
| **Hem** | `/hem` | `HomeV2Page.svelte`, `HomeV2BriefingView.svelte` | — (load i `+page.server.ts`) | `home-briefing-presenter.ts`, `home-briefing.ts` | domain tests | [hem.md](./features/hem.md) |
| **Inköp V2** | `/inkop` | `ShoppingV2Page.svelte` | `shopping-list.service`, `shopping-to-pantry.service`, `shopping-list-share.service` | `shopping-list.repository` | `e2e/shopping-v2.spec.ts`, `shopping-list.service.test.ts` | [inkop.md](./features/inkop.md) |
| **Skafferi V2** | `/inventory`, `/inventory/[location]`, `/item/new` | `PantryV2Page.svelte`, `PantryV2ShelfView.svelte`, `PantryLocationDataGrid.svelte` | `inventory.service` | `inventory.repository`, `inventory-list-presenter.ts` | integration + domain | [inventory.md](./features/inventory.md) |
| **Scan & kvitto** | `/scan` | `PhotoRoundFlow.svelte`, `ReceiptBulkAddFlow.svelte` | `receipt-import.ts`, `receipt-parse.ts` (server) | `receipt-store.ts` | `e2e/receipt.spec.ts` | [scan-receipt.md](./features/scan-receipt.md) |
| **Äta** | `/planer`, `/planer/vecka`, `/recept/[id]` | `WeeklyRitualFlow.svelte` | `weekly-ritual.service`, `meal-plan.service` | `meal-plan.repository` | `weekly-ritual.service.test.ts` | [ata.md](./features/ata.md) |
| **Onboarding** | modal + `/install-app` | `ActivationOnboardingFlow.svelte` | — | `activation-onboarding-state.ts`, `onboarding.ts` | `activation-onboarding-state.test.ts` | [onboarding.md](./features/onboarding.md) |
| **Statistik** | `/statistik`, `/statistik/wrapped` | `StatistikDashboard.svelte` | `statistik.service`, `wrapped.service` | `receipt-spend.ts` | `statistik.service.test.ts` | [statistik.md](./features/statistik.md) |
| **Settings** | `/settings`, `/settings/*` | `AccountSettingsPanel.svelte` | `account.service`, `profile.service` | `user.repository` | `account.service.test.ts` | [settings.md](./features/settings.md) |
| **Household** | `/settings/household`, `/lista/[token]`, `/invite/[token]`, `/dela/[token]` | lista/dela pages | `household.service`, `shopping-list-share.service` | `household.repository` | share integration tests | [household.md](./features/household.md) |
| **Auth** | `/login`, `/register`, `/profile` | `LoginForm`, auth pages | `auth.service`, `oauth.service` | Lucia + `user.repository` | `auth.service.test.ts` | [auth.md](./features/auth.md) |

## Övriga ytor

| Feature | Routes | Notering |
|---------|--------|----------|
| **Marketing** | `/`, `/guider`, `/priser`, … | `(marketing)` route group — se [MARKETING_SITE.md](./MARKETING_SITE.md) |
| **Brand** | `/brand` | Public noindex palette swatches — [BRAND.md](./BRAND.md) |
| **Admin** | `/admin` | PMF-dashboard, intern |
| **Grannskafferiet** | `/grannskafferiet` | **Tier C** — pausa utan explicit request |
| **Platform** | `/husdjur`, `/nyheter`, `/robots.txt` | Övrigt + telemetry |

## API & cron

| Område | Routes | Entry |
|--------|--------|-------|
| **Cron** | `/api/cron/*` | Schemalagda jobb (expiry, PMF, shopping-push) — auth i [`hooks.server.ts`](../src/hooks.server.ts) |
| **Receipt API** | `/api/receipt/*`, `/api/receipt-autopilot/*` | Kvitto-parse + autopilot |
| **Shopping API** | `/api/shopping/*`, `/api/replenishment/*` | Lista-data, replenishment learning |
| **Brain / price** | `/api/brain/*`, `/api/price-memory/*` | Memory Explorer, prisminne |
| **Stripe / Kivra** | `/api/stripe/*`, `/api/inbound/kivra` | **Tier C** |

## Tvärgående

| Ämne | Filer |
|------|-------|
| **i18n** | [`src/lib/i18n/locales/sv.json`](../src/lib/i18n/locales/sv.json), [`en.json`](../src/lib/i18n/locales/en.json) |
| **Email (Resend)** | [`email.ts`](../src/lib/server/email.ts), [`email-layout.ts`](../src/lib/server/email-layout.ts) — see [EMAIL.md](./EMAIL.md) |
| **Flags** | `apphosting.yaml` + [CURRENT_REALITY.md](./CURRENT_REALITY.md) |
| **DI / wiring** | [`src/lib/server/di.ts`](../src/lib/server/di.ts) |
| **Auth hook** | [`src/hooks.server.ts`](../src/hooks.server.ts) |

## Tier C (rör inte utan explicit request)

Grannskafferiet · Kivra forward · Stripe/Pro checkout · meal-AI hero · wrapped/statistik som primär yta · PMF-dashboard som user-facing

Se [`.cursor/rules/skaffu-frozen-zones.mdc`](../.cursor/rules/skaffu-frozen-zones.mdc).

## Underhåll

1. Ny route → lägg i `codebase-map.manifest.json` + rad här (eller feature-doc).
2. Kör `npm run check:codebase-map` — fail om route saknas i manifest.
3. Kör `npm run generate:route-index` efter större route-ändringar.
