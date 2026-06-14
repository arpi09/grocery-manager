# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-14 |
| **Prod SHA** | `73d3dfd0` ? deploy run [27501022135](https://github.com/arpi09/grocery-manager/actions/runs/27501022135) (2026-06-14) |
| **Master SHA** | `6eb0d757` ? deploy bundle 2 brain visibility (#67 receipt summary, #70 wiring, #63 EstimatedBadge, #59 home tone, #65 receipt location badge); prod at `73d3dfd0` |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` ? merged to master |
| **Prod URL** | https://skaffu.com |

## Kärnloopen (produktfokus)

Utgående ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? nästa lista.

## Navigation

### Prod (target after deploy)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` ? dashboard default |
| Hem dashboard | `/hem` | **Home V3** ? Denna vecka ? Skaffu rekommenderar ? Hushållet ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs (desktop) | Hem, Lager, Inköp, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Inköp, Skanna, Mer | Lager in Mer sheet (stale badge); scan in bottom bar |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet ? household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth ? guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |

## Kill switches & experiments

Flags live in `apphosting.yaml` on **master** (source of truth). **Deploy = publish** ? no post-merge flag flip. See [RELEASE_MODEL.md](./RELEASE_MODEL.md).

Kill switches / Tier C (expect **off** unless noted): `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED`, `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED`.

Product flags (Brain, W1 share, receipt estimates) follow master `apphosting.yaml`; merge ships the final value.

## Brain capabilities today

What users **see** when core Brain flags are on (prod target / master):

| Users see |
|-----------|
| **Uppskattat** ? receipt review dates + lager/eat-first badge when expiry ? user-set |
| **Location hints** ? suggested storage in receipt/scan parse; rules in Settings / Memory Explorer |
| **Replenishment learning** ? silent; accept/dismiss on `/hem` suggestions writes `learning_feedback` |
| **Memory Explorer** ? `/settings/memory` (?Vad Skaffu vet?) when any learning flag on |

Deferred (not V1): LLM predictor tier; household favorites (migration `0049`).

**USER_LOCAL smoke (pending ? PO gate):** Physical device + real receipt @ prod SHA `73d3dfd0`; agents link only ? **do not substitute or claim this pass.** Checklists: [Brain V1 smoke](./BRAIN_V1_PRODUCT_INTEGRATION.md#smoke-checklist-post-deploy) · [Weekly loop smoke](./HOUSEHOLD_LOOP_AUDIT.md#user_local--weekly-loop-smoke-checklist).

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## Kända drift (fixa när du ser dem)

- [x] Prod DB migrations `0047`?`0048` ? applied 2026-06-14 (manual `npm run db:migrate` via Cloud SQL public IP; journal reconciled 0012?0048). `DATABASE_URL` secret set for future deploy pre-migrate.
- [x] Prod SHA ? `73d3dfd0` via deploy [27501022135](https://github.com/arpi09/grocery-manager/actions/runs/27501022135)
- [x] Master merge train: docs, brain-activation, receipt-pattern, home-v3, memory-explorer @ `937cd9a6`
- [x] **Deploy** ? `73d3dfd0` bundle 2 brain visibility live in prod (run 27501022135)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/brain-activation-wiring` | Location + replenishment feedback | **Mergad till master** |
| `feat/home-v3-reorder` | Home V3 layout | **Mergad till master** |
| `feat/memory-explorer-v1` | Memory Explorer V1 | **Mergad till master** |
| `feat/receipt-pattern-purchasedAt` | purchasedAt cutoff fix | **Mergad till master** |
| `docs/receipt-intelligence-next-slice` | Next slice plan | **Mergad till master** |
| `feat/ux-inventory-list-v1` | UX Slice 1 ? Product Row + V1.1 inventory badge | **PLANNED** ? not started |

