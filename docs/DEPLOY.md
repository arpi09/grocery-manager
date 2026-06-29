# Deploy — Home Pantry / Skaffu

**Relaterat:** [CI_CD.md](./CI_CD.md) · [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) · [PROD_SMOKE.md](./PROD_SMOKE.md)

---

## Be coordinator om deploy i chatten

Det enklaste sättet att släppa till produktion: skriv till **coordinator** i Cursor-chatten. Du behöver **inte** öppna GitHub Actions själv.

**Exempel på fraser:**

| Säg till coordinator | |
|----------------------|---|
| `deploy` | Deploya senaste `master` |
| `kör deploy` / `deploya till prod` | Samma — full quality → E2E → Firebase |
| `release` / `släpp till prod` | Samma |

**Vad coordinator gör:**

1. Kontrollerar att CI `quality / quality` på `master` är grön på **samma SHA** som ska deployas (deploy-workflowen verifierar detta automatiskt via G1b SHA-gate).
2. Startar workflowen [**Deploy to production**](https://github.com/arpi09/grocery-manager/actions/workflows/deploy.yml) via `gh workflow run deploy.yml`.
3. Följer körningen tills **alla** jobb är gröna: `quality`, `e2e (1/3)(2/3)(3/3)`, `deploy`, `post-deploy smoke`, **`verify release completed`** (~12–20 min).
4. Om E2E, smoke eller `verify-release` failar: fixar minimalt, pushar `master`, väntar på grön CI, kör deploy igen.
5. Rapporterar tillbaka på svenska: SHA, länk till workflow-körning, prod-URL.

**Ingen prod-release utan grön Deploy-workflow inkl. `verify-release`.** Säg aldrig "deployed" om bara CI eller bara `quality` är grön.

Valfri mobilnotis skickas fortfarande om `DEPLOY_NOTIFY_WEBHOOK_URL` eller Telegram-secrets är konfigurerade.

**Manuellt i GitHub (fallback):** Actions → **Deploy to production** → Run workflow — se [Inputs](#inputs-deploy-to-production) nedan.

---

## Så deployar du (översikt)

Merge till `master` kör **bara snabb CI** (lint, check, tester, build — ~3–5 min). Ingen E2E och ingen Firebase-deploy sker automatiskt.

När du vill släppa till produktion: **be coordinator om deploy i chatten** (rekommenderat) eller kör workflowen manuellt i GitHub.

**E2E utan deploy:** Actions → **E2E** (manuellt), på PR mot `master`, eller nattligt kl. 03:00 UTC.

---

## Nattlig E2E och Cursor Automation

Produktion deployas **inte** automatiskt på natten. Två lager:

1. **GitHub Actions — E2E** (03:00 UTC): [`e2e.yml`](../.github/workflows/e2e.yml) kör quality + Playwright mot senaste `master`. Vid fel kan samma mobilnotis-secrets som deploy användas (valfritt).
2. **Cursor Automation** (04:00 UTC, ~1 h efter GitHub E2E): en schemalagd agent som:
   - Hämtar senaste **E2E**-körning på `master` (`gh run list --workflow=e2e.yml`)
   - Vid **grön:** rapporterar OK — ingen push, **ingen deploy**
   - Vid **röd:** läser loggar, gör minimal fix på `master`, pushar, kör lokal E2E om möjligt
   - **Aldrig** startar **Deploy to production**, `firebase deploy`, eller PROD_SMOKE

Skapa/redigera automationen i Cursor → **Automations** (prefill från coordinator-session). Beteende styrs av [`.cursor/rules/nightly-e2e-guard.mdc`](../.cursor/rules/nightly-e2e-guard.mdc).

Deploy till prod sker fortfarande bara när du ber coordinator om deploy i chatten eller kör **Deploy to production** manuellt.

---

## Workflows

| Fil | Namn (UI) | Trigger | Vad |
|-----|-----------|---------|-----|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | **CI** | Push/PR → `master` | G1 quality (reusable) — snabb feedback |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | **E2E** | PR → `master`; `workflow_dispatch`; nattlig schedule | G2 Playwright (3 shards) |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | **Deploy to production** | `workflow_dispatch`; guide-only `push` | G1b → G2 → G3 → G4 smoke → G5 verify-release |

Guide-only auto-deploy: push till `master` som **endast** ändrar `content/guides/**` kör full deploy-pipeline (samma gates som manuell deploy).

---

## Ägare — audit-checklista (GitHub + Firebase)

Dessa steg kan inte aktiveras från kod men är **högsta ROI** mot dubbel deploy och trasiga releases. Bocka av manuellt (~15 min, engångs + vid rotation):

- [ ] **Branch protection** på `master` — kräv status check **`quality / quality`** (inte bara `quality`; reusable workflow namnger check-runs så i GitHub UI) — GitHub → Settings → Branches
- [ ] **Firebase App Hosting auto-deploy AV** — enda deploy-källa: Actions → Deploy to production — Firebase Console → App Hosting
- [ ] **`FIREBASE_SERVICE_ACCOUNT`** satt i GitHub Secrets — se [Firebase deploy service account](#firebase-deploy-service-account)
- [ ] **`PRODUCTION_URL`** satt i GitHub Variables (t.ex. `https://skaffu.com`)
- [ ] **Watch → Custom → Actions** (eller GitHub Mobile) — notis vid röd workflow
- [ ] *(Valfritt)* **GitHub Environment `production`** med required reviewers eller väntetid — Settings → Environments (bra vid team; solo kan hoppa över)

Se [CI_CD.md](./CI_CD.md) för G0–G5 gate-tabell, deploy-SLO och incident-lärdomar (2026-06-07).

---

## Inputs (Deploy to production)

```bash
gh workflow run deploy.yml --ref master -f deploy_tier=auto
# eller explicit SHA (kräver grön pr-gate på samma SHA):
gh workflow run deploy.yml --ref master -f sha=7fd38e8ee -f deploy_tier=auto
```

| Input | Standard | Syfte |
|-------|----------|-------|
| `ref` | `master` | Branch eller tag att bygga och deploya |
| `sha` | *(tom)* | Specifik commit — överstyr `ref` om satt |
| `deploy_tier` | `auto` | `auto` \| `fast` \| `full` \| `hotfix` — E2E-djup (`auto` = path-tier på SHA) |
| `hotfix_reason` | *(tom)* | Krävs när `deploy_tier=hotfix` (audit trail) |

**Gate `guide_only=true` på manuell deploy är förväntat** — `workflow_dispatch` sätter alltid `guide_only=true` så att full release-pipeline (E2E + deploy + verify-release) körs. Det betyder *inte* att endast guide-innehåll deployas.

**Deploy kräver grön `pr-gate / pr-gate` på samma SHA** (G1b i `resolve-artifact`). Vänta på grön CI på `master` innan manuell deploy — annars failar `resolve CI artifact` med "No successful CI pr-gate check-run".

---

## Secrets

| Secret | Syfte |
|--------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | **Obligatorisk.** JSON-nyckel för GCP service account med Firebase/App Hosting deploy-rättigheter. Används via `google-github-actions/auth` + ADC — **inte** `FIREBASE_TOKEN`. Se [Firebase deploy service account](#firebase-deploy-service-account) |
| `DATABASE_URL` | **Public IP**-format för pre-deploy migrate i Actions (`postgresql://pantry_app:…@34.158.71.215:5432/pantry`). **Inte** samma som Firebase runtime-secret (socket-URL). Se [CI_CD.md — DATABASE_URL](./CI_CD.md#database_url--ägare-manuellt) |
| `DEPLOY_NOTIFY_WEBHOOK_URL` | Valfri push-notis (ntfy, Discord, Slack) |
| `DEPLOY_TELEGRAM_BOT_TOKEN` + `DEPLOY_TELEGRAM_CHAT_ID` | Valfri Telegram-notis |

**Firebase App Hosting runtime-secrets** (Secret Manager, inte GitHub): `DATABASE_URL` (socket), `ADMIN_PASSWORD`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `STRIPE_*`, `GOOGLE_CLIENT_*`, `VAPID_PRIVATE_KEY` — se `apphosting.yaml`.

Utan `FIREBASE_SERVICE_ACCOUNT` failar deploy-jobbet med tydligt fel efter quality + E2E (ingen tyst skip).

**Firebase Console → App Hosting → GitHub auto-deploy:** stäng av om Actions ska vara enda källan — undvik dubbel deploy.

---

## Firebase deploy service account

CI-deploy **kräver** GCP service account auth (Application Default Credentials). `FIREBASE_TOKEN` (`firebase login:ci`) används **inte** längre i `deploy.yml`.

### Skapa SA och sätt GitHub secret (engångs)

Kör lokalt med `gcloud` inloggad som projektägare på `home-pantry-4bee5`:

```bash
bash scripts/setup-firebase-deploy-sa.sh
gh secret set FIREBASE_SERVICE_ACCOUNT < ./github-deploy-sa-key.json
gh secret remove FIREBASE_TOKEN   # valfritt — legacy, används inte av workflow
rm ./github-deploy-sa-key.json    # radera lokalt efter secret är satt
```

Scriptet skapar `github-deploy@home-pantry-4bee5.iam.gserviceaccount.com` med roller:

| GCP-roll | Syfte |
|----------|-------|
| **Firebase App Hosting Admin** (`roles/firebaseapphosting.admin`) | `firebase deploy --only apphosting:…` |
| **Service Account User** (`roles/iam.serviceAccountUser`) | Impersonera build/runtime SAs vid deploy |

Manuell setup (utan script): GCP Console → IAM → Service Accounts → skapa SA → ladda ner JSON → GitHub → **Settings → Secrets → Actions** → `FIREBASE_SERVICE_ACCOUNT` (hela JSON-filen).

**Lokal deploy** (utan GitHub): `gcloud auth application-default login` eller sätt `GOOGLE_APPLICATION_CREDENTIALS` till samma JSON-fil, kör `npm run deploy:firebase`.

---

## Release-gates (G0–G5)

| Gate | Beskrivning |
|------|-------------|
| **G0** | Lokalt: `npm run check && npm test` |
| **G1** | CI `quality` på varje push/PR (+ `check:server-imports`, `check:client-bundle`) |
| **G1b** | Deploy kräver grön CI på samma SHA |
| **G2** | E2E × 3 shards inkl. marketing hydration smoke |
| **G3** | Firebase App Hosting deploy |
| **G4** | `scripts/smoke-prod-urls.sh` — HTTP 200 + ingen `Internal Error` i HTML |
| **G5** | `verify-release` — workflow failar om e2e/deploy/smoke inte kördes |

---

## Efter deploy

Coordinator eller e2e-agent kör [PROD_SMOKE.md](./PROD_SMOKE.md) (5 punkter) när deploy faktiskt skett — inte användaren som läxa. Verifiera `/` i browser med konsolen öppen (inte bara curl).

---

## Deploy SLO — definition of done (prod)

| Mått | Mål |
|------|-----|
| **Säg "prod är uppdaterad"** | Endast när **Deploy to production** är grön på rätt SHA **och** **`verify release completed`** = `success` — inte när bara CI, E2E eller `quality` är grön |
| **Obligatoriska jobb** | `quality` · `e2e (1/3)` · `e2e (2/3)` · `e2e (3/3)` · `deploy` · `post-deploy smoke` · `verify release completed` (alla `success`) |
| **Typisk tid** | quality ~3–5 min + E2E ~3–8 min + Firebase ~5–20 min + smoke ~1 min → **~12–25 min** |
| **Hotfix-undantag** | `deploy_tier=hotfix` + `hotfix_reason` — critical E2E + dubbel prod-smoke körs fortfarande |

---

## Troubleshooting

### Deploy failar med IAM 409 (`setIamPolicy`, `concurrent policy changes`)

**Orsak:** Firebase CLI uppdaterar IAM vid varje App Hosting deploy. Parallella deploys (dubbel workflow_dispatch, Console auto-deploy + Actions) ger HTTP 409.

**Fix i repo (automatiskt):**

- Workflow har `concurrency: deploy-production` med `cancel-in-progress: false` — bara en deploy i taget, och nya deploy-försök köas i stället för att avbryta en App Hosting-deploy som redan kan ha startat molnoperationer.
- `scripts/firebase-deploy-apphosting.sh` retryar IAM 409 upp till 8 gånger med exponential backoff + jitter (45s → 90s → …).

**Ägare — engångs (rekommenderat):**

1. Kör `bash scripts/setup-firebase-deploy-sa.sh` och sätt **`FIREBASE_SERVICE_ACCOUNT`** i GitHub Secrets — se [Firebase deploy service account](#firebase-deploy-service-account).
2. Ta bort legacy **`FIREBASE_TOKEN`** från GitHub Secrets (`gh secret remove FIREBASE_TOKEN`).
3. Stäng av **App Hosting → GitHub auto-deploy** i Firebase Console om den fortfarande är på.
4. Kör deploy igen.

### Cloud SQL-logg: `password authentication failed for user "database"`

**Inte deploy-blocker.** Prod-appen använder användaren **`pantry_app`** (databas `pantry`), se `.env.example` och `docs/FIREBASE_DEPLOY.md`. Användaren `"database"` förekommer **inte** i kod eller secrets.

Loggraden från extern IP (t.ex. `186.236.240.56`) mot Cloud SQL **public IP** (`34.158.71.215`) är nästan alltid **internet-scanning/brute force** mot öppen Postgres-port — inte App Hosting eller GitHub Actions.

| Kontroll | Förväntat |
|----------|-----------|
| Runtime secret (Firebase) | `postgresql://pantry_app:…@/pantry?host=/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance` |
| GitHub secret (migrate) | `postgresql://pantry_app:…@34.158.71.215:5432/pantry` |
| App Hosting anslutning | Unix socket via `cloudSqlInstances` i `apphosting.yaml` — **inte** public IP |

**Valfritt hårdning (GCP Console):** ta bort `0.0.0.0/0` från Authorized networks om den finns; behåll bara GitHub Actions IP-ranges + din egen IP för migrate. Det stoppar scanner-loggar men påverkar inte App Hosting runtime.

**Om prod faktiskt inte når DB:** kontrollera att Firebase Secret Manager `DATABASE_URL` har rätt `pantry_app`-lösenord och att `cloudSqlInstances` i `apphosting.yaml` matchar instansen.

---

## IAM during deploy

Varje `firebase deploy --only apphosting:home-pantry` (via `scripts/firebase-deploy-apphosting.sh`) kan trigga **setIamPolicy** i GCP: Firebase CLI synkar roller för build/runtime service accounts, Secret Manager-access och Cloud Run. Det är **förväntat** — inte ett tecken på fel konfiguration i sig. Transient **409 concurrent policy changes** kan uppstå om två deploys eller Console auto-deploy körs samtidigt.

### Vad repot gör automatiskt

| Steg | Var | Syfte |
|------|-----|--------|
| `experiments:disable pintags` | `firebase-deploy-apphosting.sh` | Undviker Cloud Run revision-tag PUT som ger 409 / IAM-race |
| IAM 409 retry (8×, backoff + jitter) | `firebase-deploy-apphosting.sh` | Transient policy-kollisioner |
| `concurrency: deploy-production` + `cancel-in-progress: false` | `deploy.yml` | Max en deploy i taget; köa nya försök i stället för att avbryta molnoperationer |
| **Ingen** `grantaccess` i CI | — | Secret IAM ändras bara vid engångs-setup (nedan), inte varje release |

### Engångs — secrets (ägare)

När du **skapar eller roterar** en runtime-secret:

```bash
npx firebase apphosting:secrets:set SECRET_NAME --project home-pantry-4bee5
bash scripts/grant-apphosting-secrets.sh   # alla befintliga secrets; hoppar över saknade
```

Eller per secret: `npx firebase apphosting:secrets:grantaccess SECRET_NAME --backend home-pantry --project home-pantry-4bee5`.

Kör **inte** `grantaccess` i deploy-loopen — det ökar IAM-churn utan att ändra appkod.

### Engångs — Cloud SQL Client (ägare)

Om App Hosting inte når Cloud SQL efter första deploy:

```bash
node scripts/grant-cloudsql-client.mjs   # kräver firebase login lokalt
```

Ger `roles/cloudsql.client` till default compute SA och Firebase App Hosting service agent.

### Console-checklista (GCP → IAM)

Verifiera att dessa **finns** (saknade roller ger runtime/build-fel, inte nödvändigtvis deploy-409):

| Principal | Förväntade roller (minst) | Används till |
|-----------|---------------------------|--------------|
| `firebase-app-hosting-compute@home-pantry-4bee5.iam.gserviceaccount.com` | Firebase App Hosting Compute Runner, Storage Object Viewer, Secret Manager Secret Accessor (per secret), Developer Connect Read Token Accessor | Cloud Run runtime — läser secrets, artifacts, Cloud SQL socket |
| `service-459524831747@gcp-sa-firebaseapphosting.iam.gserviceaccount.com` | Firebase App Hosting Service Agent (+ Cloud SQL Client om DB) | Backend provisioning, build pipeline |
| `459524831747-compute@developer.gserviceaccount.com` | Editor (Cloud Build default), Cloud SQL Client | Cloud Build / legacy compute paths |
| `firebase-adminsdk-*@home-pantry-4bee5.iam.gserviceaccount.com` | Firebase Admin SDK-relaterade roller | Admin API, ej App Hosting runtime |

**Secret Manager:** varje secret i `apphosting.yaml` (`DATABASE_URL`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`, …) ska ha **Secret Accessor** för compute-SA ovan. `grant-apphosting-secrets.sh` sätter detta via Firebase CLI.

**Deploy-autentisering (GitHub):** **`FIREBASE_SERVICE_ACCOUNT`** (obligatorisk) — deploy-SA behöver **Firebase App Hosting Admin** + **Service Account User**; den behöver **inte** samma roller som runtime compute-SA. `FIREBASE_TOKEN` används inte.

### När något saknas

| Symptom | Trolig saknad IAM / config |
|---------|----------------------------|
| Build: `secretmanager.versions.get` denied | Secret finns inte eller `grantaccess` inte kört |
| Runtime 503 på AI/e-post | Secret finns men compute-SA saknar accessor |
| DB connection errors i prod | `cloudSqlInstances` fel, eller compute/App Hosting SA saknar `cloudsql.client` |
| Deploy 409 trots retry | Parallell deploy (stäng Console auto-deploy) eller yttre policy-editor |

Se även [FIREBASE_DEPLOY.md — IAM & secrets](./FIREBASE_DEPLOY.md#iam-during-deploy).

---

## English summary

- **Merge to `master`** → fast CI only (~3–5 min).
- **Production release** → GitHub Actions → **Deploy to production** → all jobs green including **verify release completed**.
- **E2E before merge (optional)** → open a PR to `master` (E2E workflow) or run **E2E** manually.
