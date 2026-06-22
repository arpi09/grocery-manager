# Grannskafferiet Market v0.2

Market v0.2 extends v0.1 with richer chat/exchange flows, trust tooling, push, and user-facing discovery — gated behind an admin **live flag** until launch.

## Feature list

| Area | v0.2 capability |
|------|-----------------|
| **Access** | Env kill-switch + `market_live_enabled` admin toggle + nearby opt-in for users |
| **Exchange v2** | `ongoing` → both mark complete → `completed`; rating when exchange ready |
| **Chat push** | Opt-in `market_chat_push_enabled`; new-message + 24h reply reminder (cron) |
| **Unread** | `seeker_last_read_at` / `sharer_last_read_at`; poll + nav badge |
| **Trust** | Report chat thread; admin dismiss; block via existing nearby block list |
| **Profile** | `market_first_name` on user; sharer card on listing + chat |
| **Feed** | Demo vs real source labels; distance polish |
| **Demo seed v2** | 3 listings + 2 chat threads (one completed + rated) around admin coords |
| **Metrics** | Admin KPIs split `activeDemoListings` vs `activeAutoListings`; demo/real event funnel |
| **Discovery** | `/dela/[token]` market CTA when user passes access gate |
| **Migrations** | `0065` live flag, `0066` chat reports, `0067` exchange + push + read receipts |

## Access model

Three layers control who sees market UI:

| Layer | Default | Effect |
|-------|---------|--------|
| `MARKET_V01_DISABLED` env | off | Kills backend + UI (404 everywhere) |
| `market_live_enabled` in `app_settings` | **false** | Users blocked from UI/nav; admins can still test |
| Nearby opt-in (`nearby sharing`) | per user | Required for **users** when live is on |

### Decision flow

```
MARKET_V01_DISABLED=true  → 404 (pages + market API)
Admin role                → always /grannskafferiet/marknad (if backend on)
market_live_enabled=false → users: 404 + no nav link
market_live_enabled=true  → users with nearby opt-in: full UI
```

### Domain helpers (`src/lib/domain/market-v01.ts`)

- `canAccessMarketV01Ui(user, nearbyEnabled, marketLiveEnabled)` — page/API UI gate
- `showMarketV01InNav(user, marketLiveEnabled, nearbyEnabled)` — Mer-meny / nav injection

`marketLiveEnabled` is the **admin toggle value** (`enabledInApp` from `AppSettingsService.getMarketLiveStatus()`). Admins bypass the live check; env kill-switch is handled separately via `isMarketV01BackendEnabled()`.

### Admin controls

**Admin → Grannskafferiet → Market v0.2**

| Control | API / storage |
|---------|----------------|
| **Gå live för användare** | `POST /api/admin/market/set-live-enabled` → `app_settings.market_live_enabled` |
| Skapa marknadsdemodata | `POST /api/admin/market/seed-demo` |
| Rensa marknadsdemodata | `POST /api/admin/market/clear-demo` |
| Chatt-rapporter | `POST /api/admin/market/dismiss-chat-report` |

### Wiring

- `src/routes/+layout.server.ts` — exposes `marketLiveEnabled` to nav
- `src/lib/server/market-v01-guard.ts` — page load + `requireMarketV01UiAccessForApi()`
- `src/lib/navigation/nav-config.ts` — `appendMarketV01NavItems(..., marketLiveEnabled)`
- `src/routes/dela/[token]/+page.server.ts` — `showMarketCta` gated on same access rules

## Demo seed v2

Enabled by default; disable with `MARKET_DEMO_SEED_ENABLED=false`.

**Service:** `MarketDemoService` (`src/lib/application/market-demo.service.ts`)

**Flow (`POST /api/admin/market/seed-demo`):**

1. Clears prior demo rows (idempotent prefix cleanup)
2. Enables nearby sharing for admin if needed; uses admin coords or Stockholm fallback (`59.329, 18.068`)
3. Seeds **3 listings** (`demo_market` source) with demo users/households at offset coordinates
4. Seeds **2 chat threads** where admin is seeker:
   - Thread 1 (Anna): 3 messages, exchange `completed`, admin 5★ rating
   - Thread 2 (Erik): 2 messages, still `ongoing`

**Stable IDs** (prefix-based, safe to clear):

| Prefix | Entity |
|--------|--------|
| `market-demo-user-*` | Demo sharer users |
| `market-demo-hh-*` | Demo households |
| `market-demo-share-*` | Expiring share links |
| `market-demo-thread-*` | Chat threads |

**Clear** (`POST /api/admin/market/clear-demo`): deletes threads → shares → households → users matching prefixes/source.

## Exchange loop v2

**Migration:** `0067_market_v02_exchange.sql`

- `exchange_status`: `ongoing` | `completed`
- `seeker_completed_at` / `sharer_completed_at` — per-party "utbyte klart"
- Auto-migrates legacy `closed_at` threads to `completed`
- Rating available when `isExchangeReadyForRating()` (domain: `src/lib/domain/market-exchange.ts`)

**API:** `POST /api/market/chat/[threadId]` — mark complete; `POST .../rate` — stars after exchange ready.

## Push & reminders

- User setting: `market_chat_push_enabled` (profile / `MarketChatPushPanel`)
- New message → web push to recipient (opt-in, not self)
- Cron `GET /api/cron/expiry-reminders` also runs `MarketChatPushService.sendReplyReminders()` (24h nudge)

## Trust (report / block)

**Migration:** `0066_market_chat_report.sql` — `market_chat_report` table.

- User: `POST /api/market/chat/[threadId]/report`
- Admin: dismiss open reports; metrics exclude dismissed
- Block: reuses nearby share block list (sharer hidden from feed)

## Go-live checklist

### Pre-launch (admin lab)

- [ ] Confirm `MARKET_V01_DISABLED` is **not** set in prod
- [ ] Confirm `market_live_enabled` is **false** in admin panel
- [ ] Run migrations `0065`–`0067` on prod DB (via deploy)
- [ ] Seed demo → walk full flow: feed → chat → exchange → rating → push toggle
- [ ] Test report → appears in admin → dismiss
- [ ] Clear demo data
- [ ] Verify metrics show demo vs real split during seed

### Launch

- [ ] Turn **Gå live för användare** on
- [ ] Smoke with non-admin account that has **nearby opt-in**
- [ ] Confirm nav link appears; `/dela` CTA visible for eligible users
- [ ] Confirm users **without** nearby opt-in still get 404 on market routes

### Post-launch

- [ ] Monitor admin KPIs (`activeAutoListings`, chat funnel, ratings)
- [ ] Triage open chat reports within SLA

## Key files

| Concern | Path |
|---------|------|
| Access / nav | `src/lib/domain/market-v01.ts`, `src/lib/server/market-v01-guard.ts` |
| Exchange | `src/lib/domain/market-exchange.ts`, `src/lib/application/market-chat.service.ts` |
| Push | `src/lib/application/market-chat-push.service.ts` |
| Demo | `src/lib/domain/market-demo.ts`, `src/lib/application/market-demo.service.ts` |
| Profile | `src/lib/domain/market-profile.ts`, `src/routes/api/market/profile/+server.ts` |
| Metrics | `src/lib/domain/market-v01-metrics.ts` |
| Schema | `src/lib/infrastructure/db/schema.ts` |
| E2E | `e2e/market-v01.spec.ts` |

## Migrations (order)

1. `0065_market_live.sql` — `app_settings.market_live_enabled` default `false`
2. `0066_market_chat_report.sql` — report table + indexes
3. `0067_market_v02_exchange.sql` — push flag, exchange status, read receipts, reminder timestamp
