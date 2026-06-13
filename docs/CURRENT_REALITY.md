# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-13 |
| **Prod SHA** | `3961184` — senaste lyckade Deploy to production (2026-06-13) |
| **Master SHA** | `c9bdb2cf` — prod baseline före integration |
| **Integration SHA** | `integrate/seed-and-share` — inkop-first + W1 share + seed loops (ej mergat till master vid bootstrap) |
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

### Integration (`integrate/seed-and-share`) — ej deployad

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/inkop` | `APP_HOME_PATH` → inkop-first |
| Primary tabs | Lista, Lager, Hem | Scan/Ät i secondary/Mer |
| Hem CTA | `/inkop` | "Handla denna vecka" teaser |
| Delad lista W1 | `/lista/[token]` | Flag **on** i apphosting.yaml |
| Post-onboarding share | `/inkop` only | Ej på `/hem` (undviker stack med invite-banner) |

## Feature flags (prod vs integration)

| Flag | Prod | Integration | Källa | Effekt |
|------|------|-------------|-------|--------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **off** | **on** | apphosting.yaml | Dela länk, `/lista/[token]` UI, export footer |
| `PUBLIC_CITY_FEED_ENABLED` | off | off | .env | Grannskafferiet supply |
| `STRIPE_CHECKOUT_DISABLED` | true | true | .env | Pro checkout dold |
| `KIVRA_FORWARD_ENABLED` | off | off | .env | Inbound Kivra |
| `EMAIL_SENDING_DISABLED` | prod policy | prod policy | apphosting | E-post |

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding→inkop
- **B:** receipt import, barcode/photo add, price memory, export footer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] PROD_SMOKE nav-text synkad till inkop-first mål (post-merge smoke)
- [ ] Prod kör fortfarande `/hem`-nav tills `integrate/seed-and-share` mergas och deployas
- [ ] Deploy `integrate/seed-and-share` → master när G0 + CI gröna

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `integrate/seed-and-share` | Seed 10 hushåll — inkop-first + W1 + export + share prompt | **Aktiv integration** |
| `feat/weekly-habit-core` | Inkop-first landing + nav | Mergad till integrate |
| `feat/seed-and-share` | W1 flag, export footer, PostOnboardingSharePrompt | Mergad till integrate |
| `feat/lista-join-household-cta` | Lista → household CTA | Redan i weekly-habit (lista page) |
