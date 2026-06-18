# CURRENT_REALITY

> **Uppdatera denna fil** n�r prod deployas eller nav/flags �ndras. K�r: `.cursor/scripts/refresh-current-reality.sh`

| F�lt | V�rde |
|------|--------|
| **Uppdaterad** | 2026-06-18 |
| **Prod SHA** | `0b999e153` @ [27790521211](https://github.com/arpi09/grocery-manager/actions/runs/27790521211) (full E2E x3, Pantry V2 canary). Prior `73c7c5493` @ [27713747492](https://github.com/arpi09/grocery-manager/actions/runs/27713747492). |
| **Master SHA** | `0b999e153` — Pantry V2 canary (`PANTRY_UX_V2_ENABLED` + `SHOPPING_UX_V2_ENABLED` live) |
| **CI/CD model** | **v2 on master** — tiered gates #95; prod validated @ `0b999e153` (full deploy tier, Pantry V2 canary) |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` � merged to master |
| **Prod URL** | https://skaffu.com |
| **Reality audit** | [REALITY_AUDIT_2026-06.md](./REALITY_AUDIT_2026-06.md) |

## K�rnloopen (produktfokus)

Utg�ende ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? n�sta lista.

## Navigation

### Prod (live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` � dashboard default |
| Hem dashboard | `/hem` | **Home redesign v1** (`HOME_REDESIGN_V1_ENABLED`) — hero + För dig + overview cards when flag on |
| Settings | `/settings` | **iOS hub** � grouped rows + drill-down (`/settings/account`, `/notifications`, `/household`, `/plan`, `/app`, `/feedback`, `/suggestions`) ([#100](https://github.com/arpi09/grocery-manager/pull/100)) |
| Primary tabs (desktop) | Hem, Lager, Ink�p, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Ink�p, Skanna, Mer | Lager in Mer sheet (stale badge); scan in bottom bar |
| Inventory add | `/inventory/[location]` | EN **Lägg till** → sheet (kvitto/foto/streckkod/manuellt) |
| Skafferi (Pantry V2) | `/inventory` | Shelf view (zones + use-soon) live (`PANTRY_UX_V2_ENABLED` canary); table fallback at `/inventory/[location]` |
| Scan hub | `/scan` | 3-card choice hub; **ScanModeTabs desktop only** |
| Inköp (Shopping V2) | `/inkop` | Plan + Shop modes live (`SHOPPING_UX_V2_ENABLED` canary); legacy checklist in overflow drawer |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet � household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth ? guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |
| Onboarding | modal | **3 steg / ~15s** ? lista ? minne ? kvitto; finish ? `/inkop?quick=1` |
| Grannskafferiet (R16) | hidden | Ej i Mer unless `PUBLIC_CITY_FEED_ENABLED` |

## Kill switches & experiments

Flags live in `apphosting.yaml` on **master** (source of truth). **Deploy = publish** � no post-merge flag flip. See [RELEASE_MODEL.md](./RELEASE_MODEL.md).

Kill switches / Tier C (expect **off** unless noted): `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED`, `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED`.

Product flags (Brain, W1 share, receipt estimates) follow master `apphosting.yaml`; merge ships the final value.

**Prod product flags (on @ `0b999e153` / apphosting.yaml):** `HOME_REDESIGN_V1_ENABLED`, `PRICE_MEMORY_V1_ENABLED`, `BRAIN_FEEDBACK_V1_ENABLED`, `SHOPPING_UX_V2_ENABLED` (canary live), `PANTRY_UX_V2_ENABLED` (canary live), `SHELF_LIFE_LEARNING_ENABLED`, `LOCATION_LEARNING_ENABLED`, `REPLENISHMENT_LEARNING_ENABLED`, `PUBLIC_SHOPPING_LIST_SHARE_ENABLED`, `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT`. **Off:** `STRIPE_CHECKOUT_DISABLED`, Tier C (`PUBLIC_CITY_FEED`, `KIVRA_FORWARD`).


## Brain capabilities today

What users **see** when core Brain flags are on (prod target / master):

| Users see |
|-----------|
| **Uppskattat** � receipt review dates + lager badge **only when expiry explanation exists** |
| **Location hints** � suggested storage in receipt/scan parse; rules in Settings / Memory Explorer |
| **Replenishment learning** � silent; home memory line (max 1) when replenishment data exists |
| **Memory Explorer** � `/settings/memory` (Vad Skaffu vet?) when any learning flag on |

Deferred (not V1): LLM predictor tier; household favorites (migration `0049`).

**USER_LOCAL Gate (PO):** Run on prod **`72b02f49b`** � checklist: [MICRO_UX_SWEEP_2026-06.md](./MICRO_UX_SWEEP_2026-06.md#user_local-gates-post-deploy). Agents must not substitute or claim this pass.

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet gate, onboarding v2, landing copy, design system doc (R12�R16 on master)

## K�nda drift (fixa n�r du ser dem)

- [x] Prod DB migrations `0047`�`0048` � applied 2026-06-14
- [x] **UI living polish** � prod **`72b02f49b`** @ [27611180553](https://github.com/arpi09/grocery-manager/actions/runs/27611180553) (fast E2E). PR #101 merged 2026-06-16.
- [x] **Prod feature flags + hem redesign** — prod **`92d4915`** @ [27701442233](https://github.com/arpi09/grocery-manager/actions/runs/27701442233) (full E2E). PR #113 merged 2026-06-17.
- [x] **Home redesign remaining + Brain feedback gaps** — prod **`73c7c5493`** @ [27713747492](https://github.com/arpi09/grocery-manager/actions/runs/27713747492) (full E2E). PRs #114, #115, #117 merged 2026-06-17.
- [x] **Shopping V2 + Pantry V2 canary** - prod **`0b999e153`** @ [27790521211](https://github.com/arpi09/grocery-manager/actions/runs/27790521211). `SHOPPING_UX_V2_ENABLED` + `PANTRY_UX_V2_ENABLED` live.
- [x] **SMUI + Reality Audit + Settings hub** � prod **`c267c172c`** @ [27608398776](https://github.com/arpi09/grocery-manager/actions/runs/27608398776) (fast E2E). PRs #96�#100 merged 2026-06-16.
- [x] **Mobile UX Recovery** � prior prod **`d585cbd5`** @ [27570192623](https://github.com/arpi09/grocery-manager/actions/runs/27570192623)
- [x] **PR #95** CI/CD v2 merged 2026-06-15

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `fix/reality-audit-d1-d5` | Reality Audit polish R17�R29 | **Merged** (#96 ? `c267c172c`) |
| `feat/settings-ios-hub` | iOS settings hub drill-down | **Merged** (#100 ? `c267c172c`) |
| `feat/ui-living-polish` | Home priority cards, news/scan SVGs, inventory table | **Merged** (#101 ? `72b02f49b`) |
| `feat/smui-*` / `feat/marketing-*` | SMUI tables + home + marketing | **Merged** (#97�#99) |
| `feat/pantry-ux-v2` | Pantry shelf UX V2 | **Merged + canary live** @ `0b999e153` |
