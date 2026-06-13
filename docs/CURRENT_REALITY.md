# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `c9bdb2cf` — Deploy to production [27458902848](https://github.com/arpi09/grocery-manager/actions/runs/27458902848) |
| **Master SHA** | `c9bdb2cf` — matchar prod |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående → `/inkop` (delad lista) → handla ihop → checkoff → skafferi → replenishment → nästa lista.

## Navigation

### Prod (`c9bdb2cf` — live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` i `src/lib/navigation/app-home.ts` |
| Primary tabs | Hem, Skanna, Lager, Äta | `nav-config.ts` — inkop i header (kundvagn) |
| Delad lista W1 | `/lista/[token]` | Kräver flag (ej i prod-nav än) |

### In flight — inkop-first (ej mergat)

`feat/weekly-habit-core` @ `2d35de0e` — landar på `/inkop`, primary tabs **Inköp, Skafferi, Hem** (Scan/Ät i Mer). **Inte på master/prod.**

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
| `feat/weekly-habit-core` | Inkop-first landing + nav (`2d35de0e`) | Ej på master/prod |
| `feat/seed-and-share` | Seed data + dela länk W1 | Ej mergad |
| `feat/lista-join-household-cta` | Lista → household CTA | Ej mergad |
| `feat/inkop-replenishment-discoverability` | Replenishment default-open | På master (`e32b49e7`) |
| `chore/cursor-os` | Agent OS (INDEX, rules, hooks) | `ee41e39b` — ej mergad |
