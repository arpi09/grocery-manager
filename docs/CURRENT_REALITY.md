# CURRENT_REALITY

> **Uppdatera denna fil** nùr prod deployas eller nav/flags ùndras. Kùr: `.cursor/scripts/refresh-current-reality.sh`

| Fùlt | Vùrde |
|------|--------|
| **Uppdaterad** | 2026-06-16 |
| **Prod SHA** | `72b02f49b` @ [27611180553](https://github.com/arpi09/grocery-manager/actions/runs/27611180553) (UI living polish #101 ù home priority cards, news/scan SVGs, inventory table, fast E2E). Prior `c267c172c` @ [27608398776](https://github.com/arpi09/grocery-manager/actions/runs/27608398776) |
| **Master SHA** | `72b02f49b` ù PR #101 on #96ù#100 baseline |
| **CI/CD model** | **v2 on master** ù tiered gates #95; prod validated @ `72b02f49b` (fast deploy tier) |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` ù merged to master |
| **Prod URL** | https://skaffu.com |
| **Reality audit** | [REALITY_AUDIT_2026-06.md](./REALITY_AUDIT_2026-06.md) |

## Kùrnloopen (produktfokus)

Utgùende ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? nùsta lista.

## Navigation

### Prod (live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` ù dashboard default |
| Hem dashboard | `/hem` | State-driven priority card grid (hero/compact) + icon headers ù #101 |
| Settings | `/settings` | **iOS hub** ù grouped rows + drill-down (`/settings/account`, `/notifications`, `/household`, `/plan`, `/app`, `/feedback`, `/suggestions`) ([#100](https://github.com/arpi09/grocery-manager/pull/100)) |
| Primary tabs (desktop) | Hem, Lager, Inkùp, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Inkùp, Skanna, Mer | Lager in Mer sheet (stale badge); scan in bottom bar |
| Inventory add | `/inventory/[location]` | EN **Lùgg till** ? sheet (kvitto/foto/streckkod/manuellt) |
| Scan hub | `/scan` | 3-card choice hub; **ScanModeTabs desktop only** |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet ù household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth ? guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |
| Onboarding | modal | **3 steg / ~15s** ? lista ? minne ? kvitto; finish ? `/inkop?quick=1` |
| Grannskafferiet (R16) | hidden | Ej i Mer unless `PUBLIC_CITY_FEED_ENABLED` |

## Kill switches & experiments

Flags live in `apphosting.yaml` on **master** (source of truth). **Deploy = publish** ù no post-merge flag flip. See [RELEASE_MODEL.md](./RELEASE_MODEL.md).

Kill switches / Tier C (expect **off** unless noted): `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED`, `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED`.

Product flags (Brain, W1 share, receipt estimates) follow master `apphosting.yaml`; merge ships the final value.

## Brain capabilities today

What users **see** when core Brain flags are on (prod target / master):

| Users see |
|-----------|
| **Uppskattat** ù receipt review dates + lager badge **only when expiry explanation exists** |
| **Location hints** ù suggested storage in receipt/scan parse; rules in Settings / Memory Explorer |
| **Replenishment learning** ù silent; home memory line (max 1) when replenishment data exists |
| **Memory Explorer** ù `/settings/memory` (Vad Skaffu vet?) when any learning flag on |

Deferred (not V1): LLM predictor tier; household favorites (migration `0049`).

**USER_LOCAL Gate (PO):** Run on prod **`72b02f49b`** ù checklist: [MICRO_UX_SWEEP_2026-06.md](./MICRO_UX_SWEEP_2026-06.md#user_local-gates-post-deploy). Agents must not substitute or claim this pass.

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet gate, onboarding v2, landing copy, design system doc (R12ùR16 on master)

## Kùnda drift (fixa nùr du ser dem)

- [x] Prod DB migrations `0047`ù`0048` ù applied 2026-06-14
- [x] **UI living polish** ó prod **`72b02f49b`** @ [27611180553](https://github.com/arpi09/grocery-manager/actions/runs/27611180553) (fast E2E). PR #101 merged 2026-06-16.
- [x] **SMUI + Reality Audit + Settings hub** ù prod **`c267c172c`** @ [27608398776](https://github.com/arpi09/grocery-manager/actions/runs/27608398776) (fast E2E). PRs #96ù#100 merged 2026-06-16.
- [x] **Mobile UX Recovery** ù prior prod **`d585cbd5`** @ [27570192623](https://github.com/arpi09/grocery-manager/actions/runs/27570192623)
- [x] **PR #95** CI/CD v2 merged 2026-06-15

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `fix/reality-audit-d1-d5` | Reality Audit polish R17ùR29 | **Merged** (#96 ? `c267c172c`) |
| `feat/settings-ios-hub` | iOS settings hub drill-down | **Merged** (#100 ? `c267c172c`) |
| `feat/ui-living-polish` | Home priority cards, news/scan SVGs, inventory table | **Merged** (#101 ? `72b02f49b`) |
| `feat/smui-*` / `feat/marketing-*` | SMUI tables + home + marketing | **Merged** (#97ù#99) |
| `feat/mobile-ux-recovery` | Mobile UX Recovery R46ùR58 | **Merged** (`d585cbd5`) |
