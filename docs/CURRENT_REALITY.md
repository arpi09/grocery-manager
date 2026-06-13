# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `3961184` — senaste lyckade Deploy to production (2026-06-13) |
| **Master SHA** | `282a551f` — seed-and-share integration merged; CI green |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` — merged to master |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående → `/inkop` (delad lista) → handla ihop → checkoff → skafferi → replenishment → nästa lista.

## Navigation

### Prod (`3961184` — live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` i `src/lib/navigation/app-home.ts` |
| Primary tabs | Hem, Skanna, Lager, Äta | `nav-config.ts` — inkop i header (kundvagn) |
| Delad lista W1 | `/lista/[token]` | Kräver flag (ej i prod-nav än) |

### Master (`282a551f`) — ej deployad

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/inkop` | `APP_HOME_PATH` → inkop-first |
| Primary tabs | Lista, Lager, Hem | Scan/Ät i secondary/Mer |
| Hem CTA | `/inkop` | "Handla denna vecka" teaser |
| Delad lista W1 | `/lista/[token]` | Flag **on** i apphosting.yaml |
| Post-onboarding share | `/inkop` only | Ej på `/hem` (undviker stack med invite-banner) |

## Feature flags (prod vs integration)

| Flag | Prod | Master | Källa | Effekt |
|------|------|--------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **off** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI, export footer |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | prod policy | prod policy | apphosting | E-post |
| `SHELF_LIFE_LEARNING_ENABLED` | off | off | apphosting.yaml | Household shelf-life rules + feedback (Brain V1) |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | off | off | apphosting.yaml | Receipt review expiry UX ("Uppskattat") |
| `SHELF_LIFE_LLM_ENABLED` | off | off | apphosting.yaml | Future LLM tier in predictor chain |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer, **Learning Engine V1** (shelf-life predictor — codebase shipped, flags off)
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [ ] Prod kör fortfarande `/hem`-nav tills `282a551f` deployas
- [ ] Deploy master `282a551f` när coordinator kör full pipeline (CI quality grön)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `integrate/seed-and-share` | Seed 10 hushåll — inkop-first + W1 + export + share prompt | **Mergad till master** |
| `feat/weekly-habit-core` | Inkop-first landing + nav | Mergad till integrate |
| `feat/seed-and-share` | W1 flag, export footer, PostOnboardingSharePrompt | Mergad till integrate |
| `feat/lista-join-household-cta` | Lista → household CTA | Redan i weekly-habit (lista page) |
