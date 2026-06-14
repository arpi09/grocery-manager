# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-14 |
| **Prod SHA** | `e26408a2` — deploy run 27482069247 (2026-06-13) |
| **Master SHA** | `e26408a2` — merge train + E2E fixes + all Brain flags on |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` — merged to master |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående → `/inkop` (delad lista) → handla ihop → checkoff → skafferi → replenishment → nästa lista.

## Navigation

### Prod (target after deploy)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` → dashboard default |
| Hem dashboard | `/hem` | **Home V3** — Denna vecka → Skaffu rekommenderar → Hushållet ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs | Hem, Lager, Inköp | Scan/Ät i secondary/Mer |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet — household rules (learning gate) |
| Post-register wedge | `/inkop?freshAccount=1` | Ny registrering/OAuth — inkop-first wedge |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |

## Feature flags (prod vs master)

| Flag | Prod (target) | Master (apphosting.yaml) | Källa | Effekt |
|------|---------------|--------------------------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **on** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI |
| `SHELF_LIFE_LEARNING_ENABLED` | **on** | **on** | apphosting.yaml | Brain V1 shelf-life learning |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | **on** | **on** | apphosting.yaml | Receipt review Uppskattat UX |
| `LOCATION_LEARNING_ENABLED` | **on** | **on** | apphosting.yaml | Location rules + feedback |
| `REPLENISHMENT_LEARNING_ENABLED` | **on** | **on** | apphosting.yaml | Replenishment accept/dismiss feedback |
| `SHELF_LIFE_LLM_ENABLED` | **off** | **off** | apphosting.yaml | LLM tier stub — not implemented in V1 |
| `LOCATION_LLM_ENABLED` | **off** | **off** | apphosting.yaml | LLM tier stub — not implemented in V1 |
| `HOUSEHOLD_FAVORITES_ENABLED` | **off** | **off** | apphosting.yaml | Deferred migration `0049` — no product code |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] Prod DB migrations `0047`–`0048` — applied 2026-06-14 (manual `npm run db:migrate` via Cloud SQL public IP; journal reconciled 0012–0048). `DATABASE_URL` secret set for future deploy pre-migrate.
- [x] Prod SHA — `e26408a2` via deploy 27482069247
- [x] Master merge train: docs, brain-activation, receipt-pattern, home-v3, memory-explorer @ `937cd9a6`

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/brain-activation-wiring` | Location + replenishment feedback | **Mergad till master** |
| `feat/home-v3-reorder` | Home V3 layout | **Mergad till master** |
| `feat/memory-explorer-v1` | Memory Explorer V1 | **Mergad till master** |
| `feat/receipt-pattern-purchasedAt` | purchasedAt cutoff fix | **Mergad till master** |
| `docs/receipt-intelligence-next-slice` | Next slice plan | **Mergad till master** |
