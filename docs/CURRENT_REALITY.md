# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `3961184` — senaste lyckade Deploy to production (2026-06-13) |
| **Master SHA** | `c9bdb2cf` — `git rev-parse origin/master` (deploy in_progress vid bootstrap) |
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

### Master (`c9bdb2cf`) — ej deployad vid bootstrap

Samma nav som prod (`/hem`, Hem/Skanna/Lager/Äta). Deploy-workflow kördes för `c9bdb2cf` men hade inte slutförts vid OS-bootstrap.

### In flight — inkop-first (ej mergat)

`feat/weekly-habit-core` @ `1caed848` — landar på `/inkop`, primary tabs **Lista, Lager, Hem** (Scan/Ät i secondary/Mer). **Inte på master** vid bootstrap.

## Feature flags (prod)

| Flag | Prod | Källa | Effekt |
|------|------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **off** (default) | apphosting.yaml / .env | Dela länk, `/lista/[token]` UI |
| `PUBLIC_CITY_FEED_ENABLED` | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | prod policy | apphosting | E-post |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [ ] Prod kör fortfarande `/hem`-nav tills `feat/weekly-habit-core` mergas och deployas
- [ ] Integration branches ej mergade: se tabell nedan

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/weekly-habit-core` | Inkop-first landing + nav (`1caed848`) | Ej på master |
| `feat/seed-and-share` | Seed data + dela länk W1 | Ej mergad |
| `feat/lista-join-household-cta` | Lista → household CTA | Ej mergad |
| `feat/inkop-replenishment-discoverability` | Replenishment på inkop | Ej mergad |
