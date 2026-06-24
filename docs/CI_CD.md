# CI/CD — PR-first pipeline (home-pantry)

**PR → merge till `master` = snabb CI (~3–5 min).** Produktion deployas **manuellt** via Actions → **Deploy to production**. Se [DEPLOY.md](./DEPLOY.md).

**Relaterat:** [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) · [DEPLOY.md](./DEPLOY.md) · [CHANGELOG.md](./CHANGELOG.md) · [RELEASES.md](./RELEASES.md) · [PR workflow](../.cursor/rules/pr-workflow.mdc)

---

## Översikt (CI/CD model v2)

```mermaid
flowchart TB
  subgraph tier0 [quick:dev]
    QD[quick:lint + locales + server-imports + quick:unit]
  end
  subgraph tier0b [gate:fast]
    GF[lint + check + unit]
  end
  subgraph tier1 [pr:gate]
    PG[gate:fast + integration + build]
  end
  subgraph tier2 [deploy:fast]
    DF[critical E2E + Firebase + smoke + verify-release]
  end
  subgraph tier3 [release:full]
    RF[full E2E 3 shards + deploy chain]
  end
  QD --> PG
  PG --> DF
  PG --> RF
```

| Tier | Trigger | E2E | Måltid | Blockerar prod? |
|------|---------|-----|--------|-----------------|
| **quick:dev** | Agent före commit | Ingen | 2–3 min | Lokalt |
| **gate:fast** | Valfritt pre-merge lokalt | Ingen | ~5–7 min | Lokalt |
| **pr:gate** | CI full path / pre-deploy lokalt | Ingen (E2E separat) | 3–5 min CI; ~12–18 min lokalt | Merge |
| **deploy:fast** | Deploy tier fast/auto low-risk | Critical `@deploy-critical` | ~8–15 min | Prod |
| **release:full** | Deploy tier full / core paths | Full 3 shards | ~20–35 min | Prod |
| **nightly** | 03:00 UTC | Full + heavy specs | ~25–45 min | Signal only |

| Gate | När | Vad | Blockerar |
|------|-----|-----|-----------|
| **G0** | Före commit | `npm run quick:dev` only — **aldrig** `pr:gate` pre-push | Lokalt |
| **G1** | Push/PR | `pr-gate / pr-gate` (tiered via path-tier) | Deploy SHA-gate |
| **G2a** | Deploy fast/hotfix | Critical E2E | G3 |
| **G2b** | Deploy full / core PR | Full E2E × 3 | G3 |
| **G3–G5** | Deploy | Firebase + smoke + verify-release | Prod claim |

Path-tier: `scripts/ci-path-tier.mjs` — **`ci.yml`** och E2E/deploy återanvänder samma klassificering:

| Tier | CI (`ci.yml`) | E2E / deploy |
|------|---------------|--------------|
| **docs-only** | lint + `check:locales` (~2 min) | E2E skip |
| **low-risk** | lint + check + unit (skip build + integration) | critical E2E |
| **core-loop** | full pr-gate + build artifact | full E2E |

**Efter merge:** ~2 min (docs) till ~5 min (full) `pr-gate`. Deploy fast ~8–15 min, full ~20–35 min.

### Deploy SLO

| Mått | Sanning |
|------|---------|
| **Prod uppdaterad** | Grön Deploy + `verify release completed` på rätt SHA |
| **Fast lane jobb** | `pr-gate` → `e2e critical` → `deploy` → smoke → verify |
| **Full lane jobb** | `pr-gate` → `e2e (1/3–3/3)` → `deploy` → smoke → verify |
| **Branch protection** | Kräv `pr-gate / pr-gate` (uppdatera från `quality / quality`) |

### Incident 2026-06-07 (lärdomar)

| Gap | Konsekvens | Åtgärd i repo |
|-----|------------|---------------|
| CI körde inte E2E | `process is not defined` i klient nådde prod | Marketing E2E `pageerror`-check; client-bundle guard |
| Deploy utan E2E tilläts | Firebase deploy utan Playwright | `verify-release` på `workflow_dispatch` **och** guide-only `push` |
| Workflow **success** när bara `quality` kördes | Agent trodde prod var uppdaterad | `verify-release` failar om e2e/deploy/smoke inte `success` |
| Post-deploy smoke = curl HTTP 200 | SSR 200 + JS-krasch passerade | Smoke läser HTML-body; dubbelkoll med paus |
| Ingen guard mot server-kod i client bundle | Guides-regression | `check:client-bundle` + `check:server-imports` |
| Playwright plockade vitest under `e2e/helpers/` | Hotfix deploy blockerades | `testMatch: **/*.spec.ts` + `tests/unit/receipt-fixtures.test.ts` |
| Playwright-artifacts (trace/video) | Stora CI-uppladdningar | `video: 'off'`, `trace: 'retain-on-failure'` i `playwright.config.ts` (+ critical/pre-deploy configs) |

### Nattlig E2E + Cursor Automation

| Steg | Tid (UTC) | Vad |
|------|-----------|-----|
| **GitHub E2E** | 03:00 | Schedule i [`e2e.yml`](../.github/workflows/e2e.yml) kör Playwright mot `master`-tip. Ingen deploy. |
| **Valfri notis** | Efter körning | Vid röd nattlig/manuell E2E: samma webhook/Telegram-secrets som deploy (`DEPLOY_NOTIFY_*`) om konfigurerade. |
| **Cursor Automation** | 04:00 | Schemalagd agent (se [DEPLOY.md](./DEPLOY.md)) läser senaste E2E på `master` via `gh`. |

**Cursor-agenten vid röd E2E:** minimal fix, push `master`, ev. lokal `test:e2e`. **Aldrig** `deploy.yml` eller Firebase.

**Cursor-agenten vid grön E2E:** rapportera OK — ingen push, ingen deploy.

Regel för coordinator: [`.cursor/rules/nightly-e2e-guard.mdc`](../.cursor/rules/nightly-e2e-guard.mdc).

---

## Agentens happy path

| Steg | Kommando / åtgärd | Väntetid |
|------|-------------------|----------|
| **G0 lokalt** | `npm run quick:dev` — **aldrig** `pr:gate` före push | ~2–3 min |
| **Branch** | `feat/*` eller `fix/*` — **aldrig** direkt till `master` | — |
| **Svelte/typning only** | `npm run quick:check` eller `quick:types` | ~1–2 min |
| **TS/JS only** | `npm run quick:lint` | ~30–60 s |
| **Server/DB touched** | `npm run quality:integration` (eller valfritt `gate:fast` + integration) | ~5–10 min |
| **Öppna PR** | `gh pr create` mot `master` (mall: `.github/pull_request_template.md`) | ~2 min |
| **CI** | Vänta grön `pr-gate / pr-gate` (+ PR E2E om core-loop) | ~2–5 min |
| **Merge** | Merge PR — `changelog-on-merge` uppdaterar `docs/CHANGELOG.md` | ~30 s |
| **Deploy** | Coordinator: `gh workflow run deploy.yml` eller Actions UI | ~8–35 min |
| **Prod claim** | Coordinator kör [PROD_SMOKE.md](./PROD_SMOKE.md) — inte användaren | — |

**Valfritt pre-merge lokalt:** `npm run gate:fast` (~5–7 min) när du vill köra check+unit utan integration/build. **`pr:gate`** = CI-paritet; kör bara före deploy-lokal eller debugging CI-fail.

När uppgiften är klar:

1. **G0 lokalt:** `npm run quick:dev` (plus `npm run quality:integration` om server actions/DB rörts; E2E endast om tilldelad).
2. **Öppna PR** mot `master` från `feat/*` / `fix/*` — se [`.cursor/rules/pr-workflow.mdc`](../.cursor/rules/pr-workflow.mdc).
3. **Vänta på grön CI** (~2–5 min tiered) — inte full E2E/deploy.
4. **Merge PR** — CHANGELOG uppdateras automatiskt.
5. **Deploy (coordinator):** Actions → **Deploy to production** (eller `gh workflow run deploy.yml`) — CalVer GitHub Release skapas efter lyckad deploy.
6. **Efter grön deploy:** coordinator kör [PROD_SMOKE.md](./PROD_SMOKE.md) och uppdaterar CURRENT_REALITY från deploy summary — inte användaren.

---

## Workflows (GitHub Actions)

| Fil | Namn (UI) | Trigger |
|-----|-----------|---------|
| [`.github/workflows/reusable-quality.yml`](../.github/workflows/reusable-quality.yml) | *(reusable)* | `workflow_call` från CI, E2E och deploy |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | **CI** | `push` / `pull_request` → `master`/`main` |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | **E2E** | PR → `master`/`main`; `workflow_dispatch`; schedule 03:00 UTC |
| [`.github/workflows/changelog-on-merge.yml`](../.github/workflows/changelog-on-merge.yml) | **Changelog on merge** | Merged PR → `master` — append `docs/CHANGELOG.md` |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | **Deploy to production** | `workflow_dispatch`; `push` → `master` när **endast** `content/guides/**` ändrats; CalVer release efter lyckad deploy |

Deploy-kedja: `gate` → `quality` (reusable + **CI SHA-gate**) → `e2e` (matrix 3 shards) → `deploy` → **`post-deploy smoke`** → **`verify-release`**. Varje shard laddar ner samma `sveltekit-build`-artifact från `quality`. Smoke curl:ar `/`, `/login`, `/guider` och failar på fel HTTP **eller** fel HTML (`Internal Error`, SvelteKit 500).

### Deploy gates (obligatoriska)

| Gate | Var | Blockerar prod? | Varför |
|------|-----|-----------------|--------|
| **G1 quality** | `ci.yml`, `e2e.yml` + `deploy.yml` via reusable | Ja (deploy kräver grön CI på samma SHA) | En sanning för lint/test/build — inget drift |
| **G1b CI SHA** | `reusable-quality.yml` när `verify_ci_sha: true` | Ja | Sparar tid; stoppar deploy av commit som inte passerat CI |
| **G2 E2E** | `deploy.yml` job `e2e` (3 shards) | Ja — **alltid** vid normal deploy | SSR + marketing hydration (`pageerror`) |
| **G2b client bundle** | Efter build i reusable | Ja | `process.cwd` / `node:fs` i klient |
| **G3 Firebase** | `deploy.yml` job `deploy` | Ja (utan `FIREBASE_TOKEN`: skip → `verify-release` röd) | Faktisk App Hosting-deploy |
| **G4 prod smoke** | `deploy.yml` job `post-deploy smoke` | Ja | HTML-body, inte bara HTTP 200 |
| **G5 verify-release** | Sista jobbet i `deploy.yml` | Ja | Workflow **röd** om e2e/deploy/smoke skippades |

**E2E hoppas aldrig över** utom explicit hotfix: `skip_e2e=true` **och** `hotfix_confirm=hotfix`. Deploy till prod utan grön E2E **och** grön smoke **och** grön `verify-release` räknas som misslyckad release.

**Skript:**

| Skript | Roll |
|--------|------|
| [`scripts/smoke-prod-urls.sh`](../scripts/smoke-prod-urls.sh) | G4 — prod URL + HTML (lokal: `BASE_URL=https://skaffu.com bash scripts/smoke-prod-urls.sh`) |
| [`scripts/check-client-bundle.mjs`](../scripts/check-client-bundle.mjs) | G2b — efter `npm run build` |
| [`scripts/check-server-imports.mjs`](../scripts/check-server-imports.mjs) | G1 — förbjud `.server` i `.svelte`, `node:fs` utanför server paths |

**Concurrency:**
- **CI / E2E:** ny körning avbryter pågående på samma ref (`cancel-in-progress: true`).
- **Deploy:** `deploy-production` — avbryter inte pågående deploy.

**Node:** 20 (`.nvmrc`, `package.json` `engines`).

### Nödläge (hotfix)

Actions → **Deploy to production** → Run workflow → *Skip E2E* = `true` **och** *hotfix_confirm* = `hotfix`. Annars körs E2E som vanligt. Dokumentera varför i chat/commit. **Prod smoke körs fortfarande** efter Firebase — rollback om smoke failar.

---

## Ägare — GitHub och Firebase (kan inte kodas i repot)

Dessa inställningar stoppar upprepning av incidenten. **Checklista för repo-ägare:**

| Åtgärd | Var | Varför |
|--------|-----|--------|
| **Branch protection** på `master` | GitHub → Settings → Branches | Kräv status check **`pr-gate / pr-gate`** + **Require pull request** (0 approvals OK solo) |
| **Stäng av Firebase Console auto-deploy** | Firebase → App Hosting → GitHub | En deploy-källa: Actions only |
| **`FIREBASE_TOKEN` + `PRODUCTION_URL`** | GitHub Secrets/Variables | Deploy och smoke måste fungera |
| **Required reviewers** (valfritt) | Branch protection | Mänskligt deploy-beslut för stora releases |

Agentregel: [`.cursor/rules/deploy-safety.mdc`](../.cursor/rules/deploy-safety.mdc).

## Branch protection (rekommenderat)

| Inställning | Rekommendation solo | Varför |
|-------------|---------------------|--------|
| Require pull request | **Ja** (0 approvals OK) | Reviewbar historik; agent-regel — se [pr-workflow.mdc](../.cursor/rules/pr-workflow.mdc) |
| Require status check `pr-gate / pr-gate` | **Rekommenderat** | Blockerar merge/deploy på trasig lint/test/build; krävs för G1b SHA-gate |
| Require status check `e2e` | **Nej** | Långsammare — deploy-workflow kör E2E ändå |
| Require status check deploy `post-deploy smoke` | Ej möjligt solo | Smoke körs bara i deploy-workflow efter Firebase |
| Do not allow bypass | Valfritt | Sätt av om du vill tvinga PR även för ägare |

Valfritt script: [`scripts/github/apply-branch-protection.sh`](../scripts/github/apply-branch-protection.sh) (`gh api`).

---

## Secrets och Firebase

| Plats | Namn | Syfte |
|-------|------|--------|
| GitHub Actions | `FIREBASE_TOKEN` | `firebase login:ci` — deploy från Actions |
| GitHub Actions (secret) | `DATABASE_URL` | Pre-deploy `npm run db:migrate` i `deploy.yml` — **public IP**-URL, inte Firebase socket-URL (se [DATABASE_URL — ägare](#database_url--ägare-manuellt)) |
| GitHub Actions (secret) | `CRON_SECRET` | Bearer för schemalagda cron (`/api/cron/expiry-reminders`, `pmf-weekly`, `shopping-push`, `skaffurapport`, …) — måste matcha Firebase |
| GitHub Actions (variable) | `PRODUCTION_URL` | Prod-appens bas-URL (samma som `PUBLIC_ORIGIN`, utan `/` på slutet). **`https://skaffu.com`** — se [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md). |
| GitHub Actions (valfritt) | `DEPLOY_NOTIFY_WEBHOOK_URL` | Push-notis efter lyckad deploy — ntfy, Discord, Slack m.m. (se [Mobilnotis vid deploy](#mobilnotis-vid-deploy)) |
| GitHub Actions (valfritt) | `DEPLOY_TELEGRAM_BOT_TOKEN` + `DEPLOY_TELEGRAM_CHAT_ID` | Telegram-push efter lyckad deploy (alternativ till webhook) |
| Firebase Secret Manager | `DATABASE_URL` (socket-URL), `ADMIN_PASSWORD`, `OPENAI_API_KEY`, `CRON_SECRET`, … | Runtime i App Hosting — **inte** samma format som GitHub `DATABASE_URL` |

Utan `FIREBASE_TOKEN` körs quality + E2E vid deploy ändå; deploy-jobbet **skippar** med tydlig loggrad.

**Firebase Console → App Hosting → GitHub auto-deploy:** stäng av om du använder Actions — undvik **dubbel deploy**. En källa: **Actions → Deploy to production**.

### CRON_SECRET — ägare (manuellt)

Cron-jobb körs från **GitHub Actions** mot prod (`POST /api/cron/*`). Appen validerar `Authorization: Bearer <CRON_SECRET>` i `src/lib/server/cron-auth.ts` (inte i `hooks.server.ts`). **Samma sträng** måste finnas i GitHub (avsändare) och Firebase App Hosting (mottagare).

| Status (repo) | Detalj |
|---------------|--------|
| Kod | Fyra workflows: `expiry-reminders-cron.yml` (mån 07:00 UTC), `pmf-weekly-cron.yml` (mån 08:00), `shopping-push-cron.yml` (dagligen 06:00), `skaffurapport-cron.yml` (1:a i månaden 06:00). Endpoints: `/api/cron/expiry-reminders`, `pmf-weekly`, `shopping-push`, `skaffurapport` (+ valfritt `reset-demo` utan egen workflow). |
| `.env.example` | `CRON_SECRET=` med kommentar om Bearer och scheman. |
| `apphosting.yaml` | `CRON_SECRET` mappad från Secret Manager (kräver redeploy efter att secret skapats). |

**Du gör (engångs):**

1. **Generera** stark hemlighet (rotera inte utan avsikt): t.ex. `openssl rand -hex 32`.
2. **Firebase** (projekt `home-pantry-4bee5`, backend `home-pantry`):
   ```bash
   npx firebase apphosting:secrets:set CRON_SECRET --project home-pantry-4bee5
   npx firebase apphosting:secrets:grantaccess CRON_SECRET --backend home-pantry --project home-pantry-4bee5
   ```
   Deploya om så runtime får värdet (Actions → **Deploy to production**).
3. **GitHub** → *Settings* → *Secrets and variables* → *Actions*:
   - **Secret** `CRON_SECRET` — exakt samma sträng som i Firebase.
   - **Variable** `PRODUCTION_URL` — redan satt till `https://skaffu.com` om du följt domän-migreringen.
4. **Verifiera:** Actions → t.ex. **Expiry reminders cron** → *Run workflow*. Förväntat: HTTP 200, JSON `{ "ok": true, ... }`. Om GitHub saknar secret failar workflow direkt med `CRON_SECRET is not set`. Om Firebase saknar/värdet skiljer sig: HTTP **401** `Unauthorized`.

**Lokalt:** sätt `CRON_SECRET` i `.env` om du vill testa cron-rutter manuellt med `curl -H "Authorization: Bearer …"`.

### DATABASE_URL — ägare (manuellt)

Deploy-workflow kör `npm run db:migrate` mot prod **innan** Firebase deploy. Det kräver GitHub secret `DATABASE_URL` med **public IP**-format — **inte** socket-URL:en som App Hosting använder i runtime.

| Status (repo) | Detalj |
|---------------|--------|
| Kod | `.github/workflows/deploy.yml` — steget *Apply database migrations (pre-deploy)* failar om secret saknas |
| Firebase Secret Manager | Socket-URL för runtime (`postgresql://pantry_app:…@/pantry?host=/cloudsql/…`) — se [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md#database) |
| GitHub Actions | Public IP-URL enbart för migrate från Actions |

**Format (GitHub secret):**

```
postgresql://pantry_app:PASSWORD@PUBLIC_IP:5432/pantry
```

Exempel (public IP kan ändras — se GCP Console → Cloud SQL → Connections):

```
postgresql://pantry_app:YOUR_PASSWORD@34.158.71.215:5432/pantry
```

**Lösenord:** parsa `PASSWORD` från Firebase Secret Manager `DATABASE_URL` (socket-URL), eller hämta från Cloud SQL-användaren `pantry_app` i GCP Console.

**Cloud SQL — authorized networks:** GitHub Actions kör från dynamiska IP-adresser. Antingen:

1. Tillåt [GitHub Actions IP-ranges](https://api.github.com/meta) (`actions` i JSON) under Cloud SQL → **Connections** → **Authorized networks**, eller
2. Tillfälligt öppna `0.0.0.0/0` (eller din egen IP) endast under migrate, sedan ta bort.

Utan auktoriserat nätverk failar migrate med connection timeout — deploy stoppar innan Firebase.

**Du gör (engångs):**

1. Bygg public IP-URL enligt format ovan (samma lösenord som prod, annan host).
2. **GitHub** → *Settings* → *Secrets and variables* → *Actions* → **Secret** `DATABASE_URL`.
3. Verifiera: kör **Deploy to production** (eller push till `master`) — steget *Apply database migrations* ska logga `Pre-deploy migrations applied.`

**Lokalt:** `.env` med samma public IP-URL fungerar fortfarande för manuell `npm run db:migrate`; CI behöver inte din `.env`.

---

## Mobilnotis vid deploy

Du kan få notis på mobilen när **deploy-jobbet lyckas** (efter Firebase deploy, inte bara när CI är klart).

### Alternativ utan kod (rekommenderas att prova först)

| Metod | Fördelar | Nackdelar |
|-------|----------|-----------|
| **[GitHub Mobile](https://github.com/mobile)** (iOS/Android) | Ingen konfiguration i repot | Notiser för *hela* workflow-körningen |
| **GitHub e-post** | Zero setup | Samma som ovan |
| **GitHub → Watch → Custom → Actions** | Finare filter i appen | Fortfarande workflow-nivå |

**GitHub Mobile — snabbstart:**

1. Installera appen och logga in.
2. Gå till repot **home-pantry** → **Watch** → **Custom**.
3. Kryssa i **Actions**.
4. Aktivera push-notiser för GitHub i telefonens systeminställningar.

Du får notis när **Deploy to production** är klar (grön eller röd).

### Push-notis bara vid lyckad deploy (rekommenderat)

Workflow-steg **Notify deploy success** i [`deploy.yml`](../.github/workflows/deploy.yml) körs **endast** när Firebase-deploy faktiskt lyckades (`FIREBASE_TOKEN` satt och deploy OK). Ingen secret = steget hoppar tyst över.

#### A) ntfy.sh (enklast för mobil-push)

Gratis app ([ntfy](https://ntfy.sh/app)) med riktiga push-notiser. Ett enda GitHub-secret.

1. Välj ett unikt topic-namn (t.ex. `skaffu-deploy-dittnamn`).
2. Installera **ntfy** på mobilen och **Subscribe** till samma topic.
3. GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - Namn: `DEPLOY_NOTIFY_WEBHOOK_URL`
   - Värde: `https://ntfy.sh/skaffu-deploy-dittnamn`
4. Nästa lyckade deploy → push-notis: *"Skaffu deploy lyckades"* med commit och Actions-länk.

#### B) Telegram

1. Skapa bot via [@BotFather](https://t.me/BotFather) → spara **bot token**.
2. Skicka ett meddelande till boten; hämta **chat id** (t.ex. via `https://api.telegram.org/bot<TOKEN>/getUpdates`).
3. Lägg till GitHub-secrets:
   - `DEPLOY_TELEGRAM_BOT_TOKEN`
   - `DEPLOY_TELEGRAM_CHAT_ID`

#### C) Discord eller Slack

1. Skapa en **Incoming Webhook** i kanalen du vill ha notiser i.
2. Sätt `DEPLOY_NOTIFY_WEBHOOK_URL` till webhook-URL:en (Discord `discord.com/api/webhooks/…`, Slack `hooks.slack.com/…`).

Workflowen känner igen ntfy, Discord och Slack automatiskt. Andra URL:er får generisk JSON (`text`, `url`, `commit`).

**Obs:** Notis-steget använder `continue-on-error: true` — en trasig webhook ska inte markera deploy som misslyckad.

---

## Lokala kommandon (samma som CI)

```bash
npm ci
npm run quick:lint             # G0 subset
npm run quick:check            # sync + svelte-check
npm run quick:unit             # vitest
npm run quick:dev              # G0 — agent default
npm run gate:fast              # optional pre-merge (~5–7 min)
npm run lint                   # G1
npm run check:server-imports   # G1
npm run check                  # G0 + G1 (includes sync)
npm test                       # G0 + G1
USE_PGLITE=true npm run test:integration
npm run build
npm run check:client-bundle   # G2b
npm run pr:gate                # CI parity — not pre-push default

# G2 (innan deploy om auth/UI rörts)
USE_PGLITE=true npm run test:e2e

# G3 (lokalt om FIREBASE_TOKEN saknas i Actions)
npm run deploy:firebase

# G4 (efter deploy)
BASE_URL=https://skaffu.com bash scripts/smoke-prod-urls.sh
```

**G0:** husky pre-commit kör `lint-staged` vid commit. Agenter kör `npm run quick:dev` före commit — **aldrig** `pr:gate` pre-push.

---

## Framtida förbättringar

| Idé | Status |
|-----|--------|
| Path filters (skippa E2E på ren dokumentation) | **Implementerat** i [`e2e.yml`](../.github/workflows/e2e.yml) (`dorny/paths-filter@v4`) |
| Delade npm-cache artifacts mellan jobb | Ej implementerat |
| Preview deploy per commit | Ej implementerat |
| Post-deploy prod-smoke (curl) | **Implementerat** — `deploy.yml` job `post-deploy smoke` + [`scripts/smoke-prod-urls.sh`](../scripts/smoke-prod-urls.sh); coordinator kör utökad checklista i [`PROD_SMOKE.md`](./PROD_SMOKE.md) |

---

## Filer

| Fil | Roll |
|-----|------|
| `.github/workflows/reusable-quality.yml` | Delad G1 — lint, guards, test, build, artifact |
| `.github/workflows/ci.yml` | G1 — snabb CI vid push/PR |
| `.github/workflows/e2e.yml` | G2 — E2E på PR, manuellt, nattligt |
| `.github/workflows/deploy.yml` | G1b → G2 → G3 → G4 → G5 — prod-deploy + CalVer GitHub Release |
| `.github/workflows/changelog-on-merge.yml` | Append CHANGELOG vid merged PR |
| `scripts/generate-release-notes.mjs` | Release notes mellan taggar (lokal: `npm run release:notes`) |
| `docs/CHANGELOG.md` | Rolling merge-logg |
| `docs/RELEASES.md` | CalVer-index efter deploy |
| `.cursor/rules/pr-workflow.mdc` | Agent — PR-first, aldrig direkt push master |
| `scripts/check-client-bundle.mjs` | G2b — klientbundle efter build |
| `scripts/check-server-imports.mjs` | G1 — statisk server-import guard |
| `.cursor/rules/deploy-safety.mdc` | Agent — aldrig falskt "deployed" |
| `.github/workflows/expiry-reminders-cron.yml` | Veckovis utgångspåminnelse i prod (måndag 07:00 UTC) |
| `.github/workflows/pmf-weekly-cron.yml` | Veckovis PMF-digest till ägare (måndag 08:00 UTC) |
| `.github/workflows/shopping-push-cron.yml` | Daglig handla-idag-push (06:00 UTC) |
| `.github/workflows/skaffurapport-cron.yml` | Månatlig Skaffurapport-aggregering (1:a 06:00 UTC) |
| `.husky/pre-commit` | lint-staged (G0) |
| `apphosting.yaml` | Firebase build/run |
| `docs/DEPLOY.md` | Så deployar du (svenska) |
| `docs/FIREBASE_DEPLOY.md` | Infra, secrets, första deploy |
