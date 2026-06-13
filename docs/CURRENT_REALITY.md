# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `2779d141` — senaste lyckade Deploy to production (2026-06-13) |
| **Master SHA** | `661d5fc5` — hem default nav + Home V3; prod still @ `2779d141` |
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

## Feature flags (prod vs integration)

| Flag | Prod | Master | Källa | Effekt |
|------|------|--------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **on** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI, export footer |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | prod policy | prod policy | apphosting | E-post |
| `SHELF_LIFE_LEARNING_ENABLED` | off | off | apphosting.yaml | Brain V1 shelf-life learning — **flags only on master**; UI/backend not deployed |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | off | off | apphosting.yaml | Receipt review expiry UX ("Uppskattat") — WIP on `feat/brain-v1` |
| `SHELF_LIFE_LLM_ENABLED` | off | off | apphosting.yaml | Future LLM tier in predictor chain — not implemented |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer
- **B (WIP):** **Brain V1 / shelf-life learning** — env flags in `feature-flags.ts` only; predictor, EstimatedBadge implicit feedback, migrations 0047–0050 **not on master** (stash `wedge-brain-wip` → `feat/brain-v1`). No thumb up/down UI; learning uses implicit feedback in WIP branch.
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [x] Wedge deploy `2779d141` — inkop-first + W1 share + lista guest join

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `integrate/seed-and-share` | Seed 10 hushåll — inkop-first + W1 + export + share prompt | **Mergad till master** |
| `feat/weekly-habit-core` | Inkop-first landing + nav | Mergad till integrate |
| `feat/seed-and-share` | W1 flag, export footer, PostOnboardingSharePrompt | Mergad till integrate |
| `feat/lista-join-household-cta` | Lista → household CTA | Redan i weekly-habit (lista page) |
| `feat/brain-v1` | Brain V1 shelf-life predictor + learning | WIP — apply stash `wedge-brain-wip` (stash@{1}); ~70 untracked files, integration incomplete |
| `feat/home-v3` | Home V3 — 3 sektioner på `/hem` | **Mergad till master** (med hem-default nav) |
