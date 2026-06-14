# CURRENT_REALITY

> **Uppdatera denna fil** nÃ¤r prod deployas eller nav/flags Ã¤ndras. KÃ¶r: `.cursor/scripts/refresh-current-reality.sh`

| FÃ¤lt | VÃ¤rde |
|------|--------|
| **Uppdaterad** | 2026-06-14 |
| **Prod SHA** | `73d3dfd0` â€” deploy run [27501022135](https://github.com/arpi09/grocery-manager/actions/runs/27501022135) (2026-06-14) |
| **Master SHA** | `6eb0d757` â€” deploy bundle 2 brain visibility (#67 receipt summary, #70 wiring, #63 EstimatedBadge, #59 home tone, #65 receipt location badge); prod at `73d3dfd0` |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` â€” merged to master |
| **Prod URL** | https://skaffu.com |

## KÃ¤rnloopen (produktfokus)

UtgÃ¥ende â†’ `/inkop` (delad lista) â†’ handla ihop â†’ checkoff â†’ skafferi â†’ replenishment â†’ nÃ¤sta lista.

## Navigation

### Prod (target after deploy)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` â†’ dashboard default |
| Hem dashboard | `/hem` | **Home V3** â€” Denna vecka â†’ Skaffu rekommenderar â†’ HushÃ¥llet ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs | Hem, Lager, InkÃ¶p | Scan/Ã„t i secondary/Mer |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet â€” household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth â€” guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |

## Kill switches & experiments

Flags live in `apphosting.yaml` on **master** (source of truth). **Deploy = publish** â€” no post-merge flag flip. See [RELEASE_MODEL.md](./RELEASE_MODEL.md).

Kill switches / Tier C (expect **off** unless noted): `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED`, `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED`, LLM stubs (`SHELF_LIFE_LLM_ENABLED`, `LOCATION_LLM_ENABLED`), `HOUSEHOLD_FAVORITES_ENABLED`.

Product flags (Brain, W1 share, receipt estimates) follow master `apphosting.yaml`; merge ships the final value.

## Brain capabilities today

What users **see** when core Brain flags are on (prod target / master), vs stubs kept **off**:

| Users see | Stubs off (no product surface) |
|-----------|--------------------------------|
| **Uppskattat** â€” receipt review dates + lager/eat-first badge when expiry â‰  user-set | `SHELF_LIFE_LLM_ENABLED`, `LOCATION_LLM_ENABLED` â€” predictor tier returns null ([#47](https://github.com/arpi09/grocery-manager/pull/47)) |
| **Location hints** â€” suggested storage in receipt/scan parse; rules in Settings / Memory Explorer | `HOUSEHOLD_FAVORITES_ENABLED` â€” migration `0049` deferred ([#47](https://github.com/arpi09/grocery-manager/pull/47)) |
| **Replenishment learning** â€” silent; accept/dismiss on `/hem` suggestions writes `learning_feedback` | â€” |
| **Memory Explorer** â€” `/settings/memory` (â€œVad Skaffu vetâ€) when any learning flag on | â€” |

**USER_LOCAL smoke** (physical device, real receipt): [Brain V1 smoke checklist](./BRAIN_V1_PRODUCT_INTEGRATION.md#smoke-checklist-post-deploy) in [BRAIN_V1_PRODUCT_INTEGRATION.md](./BRAIN_V1_PRODUCT_INTEGRATION.md).

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboardingâ†’inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## KÃ¤nda drift (fixa nÃ¤r du ser dem)

- [x] Prod DB migrations `0047`â€“`0048` â€” applied 2026-06-14 (manual `npm run db:migrate` via Cloud SQL public IP; journal reconciled 0012â€“0048). `DATABASE_URL` secret set for future deploy pre-migrate.
- [x] Prod SHA â€” `73d3dfd0` via deploy [27501022135](https://github.com/arpi09/grocery-manager/actions/runs/27501022135)
- [x] Master merge train: docs, brain-activation, receipt-pattern, home-v3, memory-explorer @ `937cd9a6`
- [x] **Deploy** â€” `73d3dfd0` bundle 2 brain visibility live in prod (run 27501022135)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/brain-activation-wiring` | Location + replenishment feedback | **Mergad till master** |
| `feat/home-v3-reorder` | Home V3 layout | **Mergad till master** |
| `feat/memory-explorer-v1` | Memory Explorer V1 | **Mergad till master** |
| `feat/receipt-pattern-purchasedAt` | purchasedAt cutoff fix | **Mergad till master** |
| `docs/receipt-intelligence-next-slice` | Next slice plan | **Mergad till master** |
| `feat/ux-inventory-list-v1` | UX Slice 1 — Product Row + V1.1 inventory badge | **PLANNED** — not started |

