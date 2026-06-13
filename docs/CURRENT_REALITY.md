# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`
>
> **Cloud agents:** uppdatera endast master SHA, nav och flags från kod/yaml. **Prod SHA:** *Uppdateras av coordinator efter deploy — ej ändra i Cloud.*

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `3961184` — senaste lyckade Deploy to production (2026-06-13) <!-- coordinator: update after deploy --> |
| **Master SHA** | `b58f4f5` — wedge lista guest join + duo product events; CI green |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående → `/inkop` (delad lista) → handla ihop → checkoff → skafferi → replenishment → nästa lista.

## Navigation

### Prod (`3961184` — live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` i prod-build (pre inkop-first deploy) |
| Primary tabs | Hem, Skanna, Lager, Äta | `nav-config.ts` — inkop i header (kundvagn) |
| Delad lista W1 | `/lista/[token]` | Kräver flag (ej i prod-nav än) |

### Master (`b58f4f5`) — ej deployad

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/inkop` | `APP_HOME_PATH` → inkop-first (`app-home.ts`) |
| Primary tabs | Lista, Lager, Hem | Scan/Ät i secondary/Mer (`nav-config.ts`) |
| Hem CTA | `/inkop` | "Handla denna vecka" teaser |
| Delad lista W1 | `/lista/[token]` | Flag **on** i apphosting.yaml |
| Lista guest join | `/lista/[token]` | Duo wedge events (kod på master, ej prod) |
| Post-onboarding share | `/inkop` only | Ej på `/hem` (undviker stack med invite-banner) |

## Feature flags (prod vs master)

| Flag | Prod | Master (yaml/kod) | Källa | Effekt |
|------|------|-------------------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **off** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI, export footer |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env.example | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | false | false | apphosting.yaml | E-post (prod skickar) |
| `SHELF_LIFE_LEARNING_ENABLED` | off | off | default (ej i yaml) | Household shelf-life rules + feedback (Brain V1) |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | off | off | default (ej i yaml) | Receipt review expiry UX ("Uppskattat") |
| `SHELF_LIFE_LLM_ENABLED` | off | off | default (ej i yaml) | Future LLM tier in predictor chain |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer, **Learning Engine V1** (shelf-life predictor — codebase shipped, flags off)
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [ ] Prod kör fortfarande `/hem`-nav tills ny deploy efter `b58f4f5`
- [ ] Coordinator uppdaterar prod SHA efter lyckad deploy (Cloud agent rör ej prod-raden)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/cloud-pilot-reality-sync` | Cloud agent pilot — docs sync | PR öppen |
| `integrate/seed-and-share` | Seed 10 hushåll — inkop-first + W1 + export + share prompt | **Mergad till master** |
| `feat/engineering-health` | Deps, quick:dev tiers, ENGINEERING_HEALTH tracker | Parallell (ej mergad) |
