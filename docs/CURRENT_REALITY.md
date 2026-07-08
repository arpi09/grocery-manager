# CURRENT_REALITY

> **Uppdatera denna fil** n?r prod deployas eller nav/flags ?ndras. K?r: `.cursor/scripts/refresh-current-reality.sh`

| F?lt | V?rde |
|------|--------|
| **Uppdaterad** | 2026-07-08 |
| **Prod SHA** | `b2bca83b6` @ [28922015598](https://github.com/arpi09/grocery-manager/actions/runs/28922015598) (live, release 2026.7.8, deploy_tier=auto→full, e2e 3/3 grön; curl-smoke /, /guider, /login = 200, /inkop = 302→login; browser-smoke / + guide-sida utan konsolfel). **Batch: Skaffu 2.0 Våg 1 — trust-kontraktet** (#255 per-rad Ta bort+Ångra på listan, #257 död clearChecked-kedja raderad, #258 gäst-checkoff-kvitto på /lista/[token], #259 datafärskhetsrad på hyllan, #260 konsumtions-Ångra + ett verb "Använd" + trust-gate i UX_GUIDELINES + loop-funnel-telemetri + **portal-fix**: `portal={false}` var tyst no-op i hela undo-toast-mönstret). Ingen migration. |
| **Master SHA** | `c1f640f47` (releases-docs efter 2026.7.8) — i synk med prod: allt t.o.m. `b2bca83b6` deployat. |
| **CI/CD model** | **v2 on master** � tiered gates #95; prod validated @ `0b999e153` (full deploy tier, Pantry V2 canary) |
| **Integration SHA** | `integrate/seed-and-share` @ `bd67d070` ? merged to master |
| **Prod URL** | https://skaffu.com |
| **Reality audit** | [REALITY_AUDIT_2026-06.md](./REALITY_AUDIT_2026-06.md) |

## K?rnloopen (produktfokus)

Utg?ende ? `/inkop` (delad lista) ? handla ihop ? checkoff ? skafferi ? replenishment ? n?sta lista.

## Navigation

### Prod (live)

| Yta | Route | Notering |
|-----|-------|----------|
| Default home | `/hem` | `APP_HOME_PATH` ? dashboard default |
| Hem dashboard | `/hem` | **Home UX v2 briefing** (flag retired — always on) |
| Settings | `/settings` | **iOS hub** ? grouped rows + drill-down (`/settings/account`, `/notifications`, `/household`, `/plan`, `/app`, `/feedback`, `/suggestions`) ([#100](https://github.com/arpi09/grocery-manager/pull/100)) |
| Primary tabs (desktop) | Hem, Lager, Ink?p, Skanna, Mer | Lager + scan in top row |
| Primary tabs (mobile) | Hem, Lager, Ink?p, Skanna, Mer | 5 tabbar sedan #214 — Lager egen tab med stale badge (`nav-config.ts`) |
| Inventory add | `/inventory/[location]` | EN **L�gg till** ? sheet (kvitto/foto/streckkod/manuellt) |
| Skafferi (Pantry V2) | `/inventory` | Shelf view (zones + use-soon, flag retired — always on); unified data grid at `/inventory/[location]` |
| Scan hub | `/scan` | 3-card choice hub; **ScanModeTabs desktop only** |
| Ink�p (Shopping V2) | `/inkop` | Plan + Shop modes (flag retired — always on); checklist data grid in overflow drawer |
| �ta (meal plan) | `/planer` | Nav/header **�ta**; veckokalender + id�panel; veckof�rslag p� `/planer/vecka` ([ATA_PAGE.md](./ATA_PAGE.md)) |
| Memory Explorer | `/settings/memory` | Vad Skaffu vet ? household rules (learning gate) |
| Post-register wedge | `/hem?welcome=1` | Ny registrering/OAuth ? guided start on hem ([#46](https://github.com/arpi09/grocery-manager/pull/46)) |
| Delad lista W1 | `/lista/[token]` | Guest join + `lista_join_token` cookie; **Acquisition Loops V1** branding + telemetry ([ACQUISITION_LOOPS_V1.md](./ACQUISITION_LOOPS_V1.md)) |
| Delad utg�ende W3 | `/dela/[token]` | Conversion pass aligned with lista (V1) |
| Onboarding | modal | **3 steg / ~15s** ? lista ? minne ? kvitto; finish ? `/inkop?quick=1` |
| Grannskafferiet (R16) | hidden | Ej i Mer unless `PUBLIC_CITY_FEED_ENABLED` |

## Kill switches & experiments

Flags live in `apphosting.yaml` on **master** (source of truth). **Deploy = publish** — no post-merge flag flip. See [RELEASE_MODEL.md](./RELEASE_MODEL.md).

**Full flag matrix (env, code default, prod, layout booleans, UI/data gates):** [FEATURE_FLAGS.md](./FEATURE_FLAGS.md).

Kill switches / Tier C (expect **off** unless noted): `EMAIL_SENDING_DISABLED`, `STRIPE_CHECKOUT_DISABLED`, `PUBLIC_CITY_FEED_ENABLED`, `KIVRA_FORWARD_ENABLED`.

Product flags (Brain, UX v2, W1 share, receipt estimates) follow master `apphosting.yaml`; merge ships the final value. @ prod `7e9440304`: UX v2 + Brain learning/feedback/proactive **on**; `STRIPE_CHECKOUT_DISABLED` **on**; Tier C off. Backend-only flags (`RECEIPT_AI_BATCH`, `GLOBAL_SHELF_LIFE_DB`, …) effective **on** via code default when absent from yaml — see FEATURE_FLAGS.md.


## Brain capabilities today

What users **see** when core Brain flags are on (prod target / master):

| Users see |
|-----------|
| **Uppskattat** ? receipt review dates + lager badge **only when expiry explanation exists** |
| **Location hints** ? suggested storage in receipt/scan parse; rules in Settings / Memory Explorer |
| **Replenishment learning** ? silent; home memory line (max 1) when replenishment data exists |
| **Memory Explorer** ? `/settings/memory` (Vad Skaffu vet?) when any learning flag on |

Deferred (not V1): LLM predictor tier; household favorites (migration `0049`).

**USER_LOCAL Gate (PO):** Run on prod **`72b02f49b`** ? checklist: [MICRO_UX_SWEEP_2026-06.md](./MICRO_UX_SWEEP_2026-06.md#user_local-gates-post-deploy). Agents must not substitute or claim this pass.

## Tier snapshot

- **A:** inkop, household, checkoff-bridge, eat-first, replenishment, onboarding?inkop
- **B:** receipt import, barcode/photo add, price memory, Brain V1 (flags on), Memory Explorer � foundation audit: [PRICE_INTELLIGENCE_AUDIT.md](./PRICE_INTELLIGENCE_AUDIT.md). **Receipt automation V1 (2026-06-20):** one-tap import (hem/ink�p), PWA Android `share_target`, funnel telemetry `source`, quick confirm all, install nudge � see [RECEIPT_IMPORT_AUTOMATION_SPIKE.md](./RECEIPT_IMPORT_AUTOMATION_SPIKE.md)
- **C:** grannskafferiet gate, onboarding v2, landing copy, design system doc (R12?R16 on master)

## K?nda drift (fixa n?r du ser dem)

- [x] **Batch: SEO/SERP + onboarding delight + member-proveniens + login-pass** — prod **`d74fc01e6`** @ [28854580035](https://github.com/arpi09/grocery-manager/actions/runs/28854580035) (release 2026.7.7, deploy_tier=auto→fast, e2e critical grön; home-v2 replenishment-flaken grön på retry — samma test fällde gårdagens deploy-försök [28805948077](https://github.com/arpi09/grocery-manager/actions/runs/28805948077), stabiliseringstask fortsatt öppen). Merged/deployad 2026-07-07; curl-smoke grön. #244+#254: brand-SERP-fix — inga synliga datum på `/`, kvadratisk Organization-logga (`/pwa/icon-512.png`), breadcrumbs på alla marknadssidor, WebSite `alternateName`; **USER_LOCAL kvar: GSC → URL-inspektion på skaffu.com → Begär indexering** (gamla snippeten från ~19 juni byts först efter omcrawl). #251: migration 0075 (`added_by_user_id`) auto-applicerad. Non-blocking flake: `smoke-prod-auth` prod-test-creds (400 = korrekt appbeteende, jfr #228).
- [x] **Skaffu 2.0 Våg 1: trust-kontraktet** — prod **`b2bca83b6`** @ [28922015598](https://github.com/arpi09/grocery-manager/actions/runs/28922015598) (release 2026.7.8, auto→full, e2e 3/3). Merged+deployad 2026-07-07/08. #255: per-rad Ta bort med Ångra-kvitto (clearList-mönstret). #257: död clearChecked-kedja raderad i fem lager. #258: gäst-checkoff-kvitto (proveniens medvetet struken — publika GDPR-noten lovar "inga hushållsnamn"; ägarbeslut öppet). #259: färskhetsrad "Senast uppdaterat …" + synk-länk på /inventory (hem-delen → våg 5.3; hem-pulsens freshness-presenter är död kod). #260: ett verb "Använd" överallt + konsumtions-Ångra (8s, alla grid-vägar via InventoryConsumeSheet) + "Data trust (LOCKED)"-gate i UX_GUIDELINES + loop-funnel-event (`shopping_first_item_added`, `shopping_loop_closed`) + **portal-fix** (`portal={false}` var tyst no-op — StalenessBatchReviews undo-toast visade aldrig kvittotexten). Deploy-lärdomar: e2e-flake på 5/5 PR (rerun-playbook höll; stabiliseringstask spawnad), pmf.ts+schema.ts dubbellista fällde quality-fast (enkälla → våg 2/6). Masterplan: `~/.claude/plans/vi-beh-ver-g-ra-en-shimmying-snowglobe.md`.
- [x] Prod DB migrations `0047`?`0048` ? applied 2026-06-14
- [x] **UI living polish** ? prod **`72b02f49b`** @ [27611180553](https://github.com/arpi09/grocery-manager/actions/runs/27611180553) (fast E2E). PR #101 merged 2026-06-16.
- [x] **Prod feature flags + hem redesign** � prod **`92d4915`** @ [27701442233](https://github.com/arpi09/grocery-manager/actions/runs/27701442233) (full E2E). PR #113 merged 2026-06-17.
- [x] **Home redesign remaining + Brain feedback gaps** � prod **`73c7c5493`** @ [27713747492](https://github.com/arpi09/grocery-manager/actions/runs/27713747492) (full E2E). PRs #114, #115, #117 merged 2026-06-17.
- [x] **Shopping V2 + Pantry V2 canary** - prod **`0b999e153`** @ [27790521211](https://github.com/arpi09/grocery-manager/actions/runs/27790521211). `SHOPPING_UX_V2_ENABLED` + `PANTRY_UX_V2_ENABLED` live.
- [x] **SMUI + Reality Audit + Settings hub** ? prod **`c267c172c`** @ [27608398776](https://github.com/arpi09/grocery-manager/actions/runs/27608398776) (fast E2E). PRs #96?#100 merged 2026-06-16.
- [x] **Mobile UX Recovery** ? prior prod **`d585cbd5`** @ [27570192623](https://github.com/arpi09/grocery-manager/actions/runs/27570192623)
- [x] **PR #95** CI/CD v2 merged 2026-06-15
- [x] **Price Intelligence Phase 1** � prod **`f049e3cb0`** @ [27883692872](https://github.com/arpi09/grocery-manager/actions/runs/27883692872) (fast E2E critical). `receipt_price_captured` telemetry + Price Memory discovery (chip tooltip/link, import hint).
- [x] **Onboarding + statistik + account deletion + Capacitor spike** � prod **`6e28b4956`** @ [27897856697](https://github.com/arpi09/grocery-manager/actions/runs/27897856697) (auto tier, full E2E).
- [x] **Login flow cleanup** — prod **`fc51a307b`** @ [28661077873](https://github.com/arpi09/grocery-manager/actions/runs/28661077873) (auto→fast, e2e critical). PR #176 merged 2026-07-03; curl-smoke grön (4 URLs ×2, VAPID, /login).
- [x] **Email logo canonical mark** — prod **`046542052`** @ [28665190055](https://github.com/arpi09/grocery-manager/actions/runs/28665190055) (auto→fast, e2e critical). PR #178 merged 2026-07-03; curl-smoke grön (/, /guider, /login). Sista logo-avvikaren (e-post "S"-monogram) ersatt med kanoniska hus-märket.
- [x] **Mobil-UX polish + onboarding-fixar** — prod **`e918c64ee`** @ [28682670848](https://github.com/arpi09/grocery-manager/actions/runs/28682670848) (auto→full, e2e 3/3). PRs #181+#182 merged 2026-07-03; curl-smoke grön (/, /guider, /login). Onboarding: Kanske senare/Kivra-länk fungerar, stepper fit. Hem: "Mer på hem" ersatt med pulskort. Lager: en Lägg till-knapp, "Att se över i skafferiet", polerade zonsektioner. Scan: copy+spacing. OBS: pantry-v2/home-v2-e2e körs ej i CI (flagg-lucka) — uppföljningstask öppen.
- [x] **Storpaket: flaggpensionering + svep + fixar** — prod **`8d02a97a2`** @ [28705401202](https://github.com/arpi09/grocery-manager/actions/runs/28705401202) (auto→full, e2e 3/3 efter rerun). Merged 2026-07-04; curl-smoke grön (/, /guider, /login). #188: UX v2-flaggorna (SHOPPING/PANTRY/HOME_UX_V2 + HOME_REDESIGN_V1) pensionerade, legacy-layouter raderade, e2e-skips borta — CI-flagg-luckan STÄNGD vid roten. #197: svep-Använd i lagerlistan (slimmad rad, peek-hint, kebab-fallback). #184/#185: tile-overflow + Kivra-dödlänk. #198: NaN-expiry-fix från kvittoimport (räddad ur #190). Plus parallella sessioners #186/#191/#192/#193/#196. Kända flaky nykomlingar i CI: kebab-konsumtionstestet (karantän, fixme) + pulse quick-add — stabiliseringstask öppen.
- [x] **Batch: CSS-preload + dead-code + onboarding-toast** — prod **`473f25f12`** @ [28798857449](https://github.com/arpi09/grocery-manager/actions/runs/28798857449) (release 2026.7.6.2, deploy_tier=auto→fast, e2e critical grön efter flake-rerun). Merged 2026-07-06; curl-smoke grön (/, /guider, /login, /inkop = 200, rent). #230: stale-CSS-preload self-heal (`isChunkLoadError` matchar även "Unable to preload CSS" → engångs-reload-guard, slutar flooda error-loggen). #238: −53 oreferenserade filer (knip Svelte-aware → adversariell verifiering; frozen-holds `plan-limits.ts`+`MealTimeSuggestions.svelte`). #243: onboarding fill-steg synlig pantry-write-toast (trust over taps — löser tyst sidoeffekt; kom in via #242-squash, deduperad). Deploy-lärdom: e2e critical flakade (pantry-v2 filter-sheet timing) → ren rerun grön; branch-kollision (min commit hamnade på parallell `feat/landing-comparison-seo`) → återhämtad via isolerad worktree cherry-pick (se [[shared-worktree-collision-risk]]).
- [x] **PWA: service worker reload-loop-fix** — prod **`6ce2be61e`** @ [28739479233](https://github.com/arpi09/grocery-manager/actions/runs/28739479233) (release 2026.7.5.2, deploy_tier=auto→fast, e2e critical grön). Merged 2026-07-05; curl-smoke grön (/, /guider, /login, /inkop = 200); prod `/sw.js` innehåller `cleanupOutdatedCaches` = nya SW live. #228: iOS Safari "laddar aldrig + varm telefon" = SW `autoUpdate` reload-loop (controllerchange-reload nollställs vid varje reload → oändlig loop på enhet med stuck SW; bekräftat via private mode = ingen SW). Fix: `registerType` `autoUpdate`→`prompt` + klient-guardad reload (sessionStorage, max 1×/session, samma mönster som chunk-reload-guarden) + `workbox.cleanupOutdatedCaches` (självläkning). Enhets-recovery: rensa webbplatsdata för skaffu.com en gång. Non-blocking flake: `smoke-prod-auth` failade på prod-test-konto-creds (ej login-regression — appen svarade korrekt 400).
- [x] **Declutter-batch (Lager + Äta)** — prod **`8efc9d33c`** @ [28735052802](https://github.com/arpi09/grocery-manager/actions/runs/28735052802) (release 2026.7.5, deploy_tier=auto→fast, e2e critical grön). Merged 2026-07-05; curl-smoke grön (/, /guider, /login = 200, /planer = 302). #223: Lager/skafferi — max 1 primär CTA/sektion, bort med dubblerade expiry-chip/banner + "Fördjupa", "Visa alla"→URL. #224: Äta/planer — tvillingbannrarna (EatHubHero + PlanerContextBanner) ihopslagna till ett topp-kort (behåller primär "Generera maträtt"), PlanerContextBanner raderad, per-idé-schemaform bakom `<details>`-disclosure, 9 döda i18n-nycklar bort. Ingen migration. Uppföljning (USER_LOCAL): ögna faktiska Äta/Lager-vyerna på enhet — presentationsändring, e2e critical gatade eat-hub-generate.
- [x] **"Stäng loopen"-UX-batch** — prod **`86b9e061c`** @ [28719382101](https://github.com/arpi09/grocery-manager/actions/runs/28719382101) (deploy_tier=full, e2e 3/3 grön). Merged 2026-07-04; curl-smoke grön (/, /guider, /login). 8 vågor mot kärnflödet: #203 butikssäkert Handla-läge (ångra/fanns inte/live-total/peek), #205 Packa upp (batch checkoff→skafferi + kvitto-dedup), #206 gäst-checkoff på /lista/[token] utan konto, #209 ät-bryggan (utgår snart→middag), #211 äta vid 60% data (extras i receptgeneratorn), #213 kvitto/scan-polish, #214 Lager som egen mobiltabb (5 tabbar), #215 plan-vy visar hela listan + hem-städning, #220 rensa listan med Ångra. #221 a11y-fix (role=img på nav stale-dot — löste aria-prohibited-attr som blockerade första deploy-försöket). Migration 0073 (shopping_list_item.unavailable_at) auto-applicerad. Uppföljning: member-proveniens ("Tillagd av Amanda") kräver addedByUserId-migration — medvetet skippad.

## Acquisition (V1)

- **W1** `/lista/[token]` � shared list growth surface; events `shared_list_*`, `public_surface_*`
- **W3** `/dela/[token]` � expiring share conversion pass
- **W4** Invite value moments � receipt success, trip completed, post-list-share (solo household)
- **V2 backlog:** store comparison public share (no price engine in V1)
- Spec: [ACQUISITION_LOOPS_V1.md](./ACQUISITION_LOOPS_V1.md)

## Branches in flight (manuell)

| Branch | Syfte | Status |
|--------|-------|--------|
| `fix/reality-audit-d1-d5` | Reality Audit polish R17?R29 | **Merged** (#96 ? `c267c172c`) |
| `feat/settings-ios-hub` | iOS settings hub drill-down | **Merged** (#100 ? `c267c172c`) |
| `feat/ui-living-polish` | Home priority cards, news/scan SVGs, inventory table | **Merged** (#101 ? `72b02f49b`) |
| `feat/smui-*` / `feat/marketing-*` | SMUI tables + home + marketing | **Merged** (#97?#99) |
| `feat/pantry-ux-v2` | Pantry shelf UX V2 | **Merged + canary live** @ `0b999e153` |
| `feature/home-ux-v2` | Home briefing UX V2 (PR1-PR5) | **Merged + canary live** @ `ab46f3c49` |
| `feature/unified-data-grid` | Unified MUI-style data grid (pantry location + shopping checklist) | **In flight** � PR4 cleanup |
