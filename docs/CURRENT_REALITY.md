# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `2779d141` — senaste lyckade Deploy to production (2026-06-13) |
| **Master SHA** | `f67ad68b` — Brain V1 merge train (C1–C8); prod still @ `2779d141` |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` — merged to master |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående → `/inkop` (delad lista) → handla ihop → checkoff → skafferi → replenishment → nästa lista.

## Navigation

### Prod (`2779d141` — live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` → dashboard default |
| Hem dashboard | `/hem` | **Home V3** — 3 sektioner: Uppmärksamhet, Skaffu föreslår, Gör nu ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs | Hem, Lager, Inköp | Scan/Ät i secondary/Mer |
| Post-register wedge | `/inkop?freshAccount=1` | Ny registrering/OAuth — oförändrad inkop-first wedge |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |
| Duo wedge events | product_event | `list_link_*`, `partner_joined`, `shared_checkoff` |

## Feature flags (prod vs master)

| Flag | Prod | Master | Källa | Effekt |
|------|------|--------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **on** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI, export footer |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | prod policy | prod policy | apphosting | E-post |
| `SHELF_LIFE_LEARNING_ENABLED` | off | **off** | apphosting.yaml | Brain V1 learning — **code on master**, flag off |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | off | **off** | apphosting.yaml | Receipt review Uppskattat UX — wired, flag off |
| `LOCATION_LEARNING_ENABLED` | off | **off** | apphosting.yaml | Location rules — wired, flag off |
| `REPLENISHMENT_LEARNING_ENABLED` | off | **off** | apphosting.yaml | Replenishment feedback — wired, flag off |
| `SHELF_LIFE_LLM_ENABLED` | off | **off** | apphosting.yaml | LLM tier stub — not implemented |
| `HOUSEHOLD_FAVORITES_ENABLED` | off | **off** | apphosting.yaml | Deferred — not on master |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer
- **B (master, flags off):** **Brain V1 / shelf-life learning** — full product loop wired (parse → Uppskattat → save → inventory badge → edit feedback → Settings Förslag). Migrations `0047`–`0048` on master **pending prod deploy**. See [LEARNING_ENGINE.md](./LEARNING_ENGINE.md), [BRAIN_V1_PRODUCT_INTEGRATION.md](./BRAIN_V1_PRODUCT_INTEGRATION.md).
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [x] Wedge deploy `2779d141` — inkop-first + W1 share + lista guest join
- [ ] Prod DB migrations `0047`–`0048` — run at next deploy (Brain tables dormant until then)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/brain-v1-merge` | Brain V1 merge train (C1–C8) | **Mergad till master** |
| `feat/home-v3` | Home V3 — 3 sektioner på `/hem` | **Mergad till master** |
| `integrate/seed-and-share` | Seed 10 hushåll — inkop-first + W1 | **Mergad till master** |
