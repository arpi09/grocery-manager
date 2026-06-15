# CURRENT_REALITY

> **Uppdatera denna fil** när prod deployas eller nav/flags ändras. Kör: `.cursor/scripts/refresh-current-reality.sh`

| Fält | Värde |
|------|--------|
| **Uppdaterad** | 2026-06-15 |
| **Prod SHA** | `e9ff39c5` — [27549097650](https://github.com/arpi09/grocery-manager/actions/runs/27549097650) (Premium UX R30–R45 + onboarding/E2E fixes). Prior `94c95b4d` @ [27533104716](https://github.com/arpi09/grocery-manager/actions/runs/27533104716) |
| **Master SHA** | `e9ff39c5` — Premium UX R30–R45 (`b23034f7` + E2E/onboarding follow-ups) |
| **CI/CD model** | **v2 on master** — tiered gates #95; prod validated @ `e9ff39c5` (critical E2E deploy tier) |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` ? merged to master |
| **Prod URL** | https://skaffu.com |
| **Reality audit** | [REALITY_AUDIT_2026-06.md](./REALITY_AUDIT_2026-06.md) |

## Kärnloopen (produktfokus)

Utgående ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? nästa lista.

## Navigation

### Prod (live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` ? dashboard default |
| Hem dashboard | `/hem` | **Home V3** ? Denna vecka ? Skaffu rekommenderar ? Hushållet ([HOME_V3.md](./HOME_V3.md)) |
| Primary tabs (desktop) | Hem, Lager, Inköp, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Inköp, Skanna, Mer | Lager in Mer sheet (stale badge); scan in bottom bar |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet ? household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth ? guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie |
| Onboarding v2 (Bundle C) | modal | 3 beats vad/loop/hur ? **live** |
| Grannskafferiet (R16) | hidden | Ej i Mer unless `PUBLIC_CITY_FEED_ENABLED` |

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
| **Memory Explorer** ? `/settings/memory` (Vad Skaffu vet?) when any learning flag on |

Deferred (not V1): LLM predictor tier; household favorites (migration `0049`).

**USER_LOCAL Gate 0 (PO pending ? doc only):** Run on prod **`e9ff39c5`** (post?Premium UX deploy). Checklist: [REALITY_AUDIT_2026-06.md](./REALITY_AUDIT_2026-06.md#user_local-verification). Agents must not substitute or claim this pass.

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer
- **C:** grannskafferiet gate, onboarding v2, landing copy, design system doc (R12?R16 on master)

## Kända drift (fixa när du ser dem)

- [x] Prod DB migrations `0047`?`0048` ? applied 2026-06-14
- [x] **Deploy 0** — superseded; prod now **`e9ff39c5`** @ [27549097650](https://github.com/arpi09/grocery-manager/actions/runs/27549097650) (critical E2E). Failed full-tier attempt: [27541222554](https://github.com/arpi09/grocery-manager/actions/runs/27541222554).
- [x] Prior prod `94c95b4d` @ [27533104716](https://github.com/arpi09/grocery-manager/actions/runs/27533104716) (Bundle A+B)
- [x] **PR #95** CI/CD v2 merged 2026-06-15

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `feat/premium-ux-r30-r45` | Premium UX audit R30–R45 | **Merged to master** (`b23034f7` + fixes) |
| `chore/ci-test-tiers` | CI/CD v2 tiered gates | **Merged** (#95) |
| Bundle C (#90–#94) | onboarding, landing, design doc, grannskafferiet gate | **On master, live @ e9ff39c5** |
