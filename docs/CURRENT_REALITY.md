# CURRENT_REALITY

> **Uppdatera denna fil** n?r prod deployas eller nav/flags ?ndras. K?r: `.cursor/scripts/refresh-current-reality.sh`

| F?lt | V?rde |
|------|--------|
| **Uppdaterad** | 2026-06-15 |
| **Prod SHA** | `94c95b4d` - deploy run [27533104716](https://github.com/arpi09/grocery-manager/actions/runs/27533104716) (2026-06-15) - Bundle A (#81, #83, #84, #86, #89)
| **Master SHA** | `94c95b4d` - Bundle A (#81, #83, #84, #86, #89) + Bundle B (#82, #85, #88) on master
| **CI/CD model** | **v2 pending deploy** ? tiered gates on `chore/ci-test-tiers`; update after first `deploy_tier=fast` prod validation |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` ? merged to master |
| **Prod URL** | https://skaffu.com |

## K?rnloopen (produktfokus)

Utg?ende ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? n?sta lista.

## Navigation

### Prod (target after deploy)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` ? dashboard default |
| Hem dashboard | `/hem` | **Home V3** ? Denna vecka ? Skaffu rekommenderar ? Hush?llet ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs (desktop) | Hem, Lager, Ink?p, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Ink?p, Skanna, Mer | Lager in Mer sheet (stale badge); scan in bottom bar |
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

**USER_LOCAL smoke (pending ? PO gate):** Physical device + real receipt @ prod SHA `f70c2c9c`; agents link only ? **do not substitute or claim this pass.** Checklists: [Brain V1 smoke](./BRAIN_V1_PRODUCT_INTEGRATION.md#smoke-checklist-post-deploy) ? [Weekly loop smoke](./HOUSEHOLD_LOOP_AUDIT.md#user_local--weekly-loop-smoke-checklist).

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet, meal plan AI, wrapped, PMF user dashboards, Stripe marketing

## K?nda drift (fixa n?r du ser dem)

- [x] Prod DB migrations `0047`?`0048` ? applied 2026-06-14 (manual `npm run db:migrate` via Cloud SQL public IP; journal reconciled 0012?0048). `DATABASE_URL` secret set for future deploy pre-migrate.
- [x] Prod SHA ? `f70c2c9c` via deploy [27507835082](https://github.com/arpi09/grocery-manager/actions/runs/27507835082) (narrative sprint + UX #73/#74)
- [x] **Deploy fix** ? `apphosting.yaml` ASCII normalization (`fah/invalid-apphosting-yaml` mojibake)
- [x] Prior prod `73d3dfd0` bundle 2 @ [27501022135](https://github.com/arpi09/grocery-manager/actions/runs/27501022135)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/brain-activation-wiring` | Location + replenishment feedback | **Mergad till master** |
| `feat/home-v3-reorder` | Home V3 layout | **Mergad till master** |
| `feat/memory-explorer-v1` | Memory Explorer V1 | **Mergad till master** |
| `feat/receipt-pattern-purchasedAt` | purchasedAt cutoff fix | **Mergad till master** |
| `docs/receipt-intelligence-next-slice` | Next slice plan | **Mergad till master** |
| `feat/ux-inventory-list-v1` | UX Slice 1 ? Product Row + V1.1 inventory badge | **Merged** (#74 @ narrative deploy) |

