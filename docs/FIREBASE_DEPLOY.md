# Deploy home-pantry to Firebase

This guide deploys the SvelteKit SSR app (Lucia auth + PostgreSQL) to **Firebase App Hosting**.

## Architecture choice

| Option | Verdict | Why |
|--------|---------|-----|
| **Firebase App Hosting** (recommended) | �S& Use this | Full-stack Node/SSR on Cloud Run + CDN. Native SvelteKit support via Node buildpack. Works with existing `@sveltejs/adapter-node`. |
| Cloud Run + Dockerfile | �S& Alternative | Same runtime, manual `gcloud run deploy`. Useful for CI or non-Firebase pipelines. See [Cloud Run path](#alternative-cloud-run-via-docker). |
| Firebase Hosting + Cloud Functions | �a�️ Possible | Community adapters exist; more config, cold starts, less maintained than App Hosting. |
| Static Hosting only | �R Not suitable | App requires SSR (Lucia sessions, `hooks.server.ts`, API routes). |

**Database:** The app uses **PostgreSQL** in production (`DATABASE_URL`). PGlite (`USE_PGLITE=true`) is **dev-only**. This project uses **Cloud SQL for PostgreSQL** in GCP project `home-pantry-4bee5` (see [Database](#database)).

**Firestore / Realtime Database:** Not required. Do not migrate unless you explicitly want to.

## Prerequisites

- Google account with [Firebase](https://console.firebase.google.com/)
- **Blaze (pay-as-you-go) plan** � required for App Hosting and Cloud Run
- Node.js 20 (matches `Dockerfile` and CI)
- A **PostgreSQL** instance reachable from Google Cloud (see [Database](#database))

Firebase CLI is a **devDependency** in this repo � use `npx firebase` or the npm scripts below (no global install required).

## First deploy (one-time setup)

### 1. Firebase project and billing

1. Open [Firebase Console](https://console.firebase.google.com/) �  use project **`home-pantry-4bee5`** (or create your own and update `.firebaserc`)
2. Upgrade to **Blaze** plan (Project settings �  Usage and billing)
3. Enable APIs (usually auto-enabled on first App Hosting deploy):
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API

### 2. Database (Cloud SQL)

| Setting | Value |
|---------|--------|
| Project | `home-pantry-4bee5` |
| Instance | `home-pantry-4bee5-instance` |
| Region | `europe-west4` (match App Hosting) |
| Connection name | `home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance` |
| Database / user | `pantry` / `pantry_app` |

Run migrations **before** the first app deploy so the schema is complete on an empty database.

`npm run db:migrate` uses Drizzle's journal (`drizzle/meta/_journal.json`) and applies **all** SQL files (`0000_init` through `0011_consumption_event`). Verify the journal with:

```bash
npm test -- src/lib/infrastructure/db/migrations.test.ts
```

#### App Hosting �  Cloud SQL (`apphosting.yaml`)

`apphosting.yaml` lists the instance under `cloudSqlInstances`. App Hosting mounts a Unix socket at:

```
/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

Set the **`DATABASE_URL` secret** (not in git) to a URL that uses that socket (works with `postgres` / Drizzle):

```
postgresql://pantry_app:YOUR_PASSWORD@/pantry?host=/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

`USE_PGLITE` must stay `false` in `apphosting.yaml` (already set).

If you use **private IP only** (no socket), configure [VPC access](https://firebase.google.com/docs/app-hosting/vpc-networks) in `runConfig.vpcAccess` and put the private IP host in `DATABASE_URL` instead � only needed when not using `cloudSqlInstances`.

#### Local migrations (public IP)

1. GCP Console �  **Cloud SQL** �  `home-pantry-4bee5-instance` �  **Connections** �  **Authorized networks** �  add your current public IP.
2. In `.env` (never commit):

```bash
USE_PGLITE=false
DATABASE_URL=postgresql://pantry_app:YOUR_PASSWORD@34.158.71.215:5432/pantry
```

3. Migrate:

```bash
# Bash
npm run db:migrate

# Windows (loads .env)
powershell -File scripts/db-migrate-cloudsql.ps1 -FromEnvFile
```

Public IP may change; update authorized networks if migrate fails with a connection timeout.

#### Alternative hosts (Neon / Supabase)

Any Postgres URL works if you set `DATABASE_URL` accordingly and run `npm run db:migrate` before deploy. Remove or adjust `cloudSqlInstances` in `apphosting.yaml` if you are not on Cloud SQL.

### 3. Firebase CLI login (local)

```bash
npm ci
npx firebase login
npx firebase projects:list
npx firebase use home-pantry-4bee5
```

### 4. App Hosting backend

If the backend does not exist yet:

```bash
npx firebase init apphosting
```

When prompted:

- **Backend ID:** `home-pantry` (matches `firebase.json`)
- **Region:** closest to users (e.g. `europe-west4`, `us-central1`)
- **Root directory:** `.` (project root)

If you already have `firebase.json` / `apphosting.yaml` from this repo, init may merge � keep the committed templates and fill in secrets.

### 5. Secrets and environment

Never commit `.env` or service account keys.

Create secrets (CLI prompts for values). For `DATABASE_URL`, paste the **socket** URL from [Database](#database) (not the public IP URL).

```bash
npx firebase apphosting:secrets:set DATABASE_URL --project home-pantry-4bee5
npx firebase apphosting:secrets:set ADMIN_PASSWORD --project home-pantry-4bee5
npx firebase apphosting:secrets:set OPENAI_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:set RESEND_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:set TURNSTILE_SECRET_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:set CRON_SECRET --project home-pantry-4bee5
```

Grant App Hosting access (CLI usually offers this during `secrets:set`):

```bash
npx firebase apphosting:secrets:grantaccess DATABASE_URL --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess ADMIN_PASSWORD --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess OPENAI_API_KEY --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess TURNSTILE_SECRET_KEY --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess CRON_SECRET --backend home-pantry --project home-pantry-4bee5
```



### Optional secrets (Google OAuth, demo account)

These are **not** required for deploy. `apphosting.yaml` keeps their bindings commented out until the secrets exist in Secret Manager; otherwise Cloud Build fails at the preparer step with `secretmanager.versions.get` denied.

| Secret | When you need it |
|--------|------------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in on login/register (`isGoogleOAuthConfigured()` hides the button when unset) |
| `DEMO_ACCOUNT_PASSWORD` | Demo household seed and `POST /api/cron/reset-demo` (see [`DEMO_ACCOUNT.md`](./DEMO_ACCOUNT.md)) |

Create each secret, grant the `home-pantry` backend access, then uncomment the matching `env` entries in `apphosting.yaml` and redeploy:

```bash
npx firebase apphosting:secrets:set GOOGLE_CLIENT_ID --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess GOOGLE_CLIENT_ID --backend home-pantry --project home-pantry-4bee5

npx firebase apphosting:secrets:set GOOGLE_CLIENT_SECRET --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess GOOGLE_CLIENT_SECRET --backend home-pantry --project home-pantry-4bee5

npx firebase apphosting:secrets:set DEMO_ACCOUNT_PASSWORD --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess DEMO_ACCOUNT_PASSWORD --backend home-pantry --project home-pantry-4bee5
```

### Google Sign-In (OAuth)

Google login is **not** Firebase Authentication. The app uses a server-side OAuth 2.0 PKCE flow ([Arctic](https://arcticjs.dev/)) with Lucia sessions and PostgreSQL (`oauth_account` links). Routes: `GET /auth/google` � Google � `GET /auth/google/callback`. The button on `/login` and `/register` appears only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (`isGoogleOAuthConfigured()`).

**GitHub Actions:** no repo secrets for Google OAuth  credentials live in Firebase App Hosting Secret Manager (or local `.env`).

#### 1. Google Cloud Console (OAuth client)

Use the same GCP project as Firebase: **`home-pantry-4bee5`**.

1. [Google Cloud Console](https://console.cloud.google.com/) � project **home-pantry-4bee5** � **APIs & Services** � **OAuth consent screen**.
   - User type: **External** (or Internal for Workspace-only testing).
   - Add scopes: `openid`, `email`, `profile` (the app requests these).
   - Add test users while the app is in **Testing** publishing status.
2. **Credentials** � **Create credentials** � **OAuth client ID** � type **Web application**.
3. Copy **Client ID** and **Client secret** (these become `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).

You do **not** need to enable **Google** under Firebase Console � **Authentication** � **Sign-in method** for this app.

#### 2. Authorized redirect URIs

Redirect URI must match `getAppOrigin()` + `/auth/google/callback` (`src/lib/server/google-oauth.ts`). `getAppOrigin()` prefers `ORIGIN`, then `PUBLIC_ORIGIN` (see `src/lib/server/origin.ts`).

| Environment | Typical `getAppOrigin()` | Redirect URI |
|-------------|--------------------------|--------------|
| Vite dev (`npm run dev`, port 5173) | Set `ORIGIN=http://localhost:5173` (or leave `ORIGIN` unset and use `PUBLIC_ORIGIN`) | `http://localhost:5173/auth/google/callback` |
| Production (`apphosting.yaml`) | `https://skaffu.com` | `https://skaffu.com/auth/google/callback` |
| Legacy hosted.app (optional) | `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app` | same host + `/auth/google/callback` |

Add every host you actually use to **Authorized redirect URIs**. Mismatch causes Googles `redirect_uri_mismatch` error.

**Authorized JavaScript origins** (optional but useful for dev): same origins without path, e.g. `http://localhost:5173`, `https://skaffu.com`.

#### 3. Production: Secret Manager + `apphosting.yaml`

1. Create secrets and grant the App Hosting backend (commands in [Optional secrets](#optional-secrets-google-oauth-demo-account) above).
2. Uncomment the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` `env` blocks in `apphosting.yaml` (they stay commented until secrets exist  otherwise deploy fails at the preparer step).
3. Redeploy via PR merge + manuell **Deploy to production** (eller `npm run deploy:firebase` lokalt). Confirm `PUBLIC_ORIGIN` / `ORIGIN` in `apphosting.yaml` match the redirect URI host.

#### 4. Local development

In `.env` (from `.env.example`):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
ORIGIN=http://localhost:5173
PUBLIC_ORIGIN=http://localhost:5173
```

Restart is handled by the dev watcher when `.env` changes.

#### 5. Verify

1. Open `/login`  **Continue with Google** should appear when env vars are set.
2. Click it � Google account picker � redirect back to `/hem` (or `redirectTo` if provided).
3. New users: account row + `oauth_account` link; returning users: existing session.
4. If the button is missing: both env vars unset or empty.
5. If Google shows `redirect_uri_mismatch`: fix redirect URI vs `ORIGIN`/`PUBLIC_ORIGIN`.
6. If callback shows Google sign-in failed: check server logs; common causes are wrong client secret, consent screen not configured, or unverified email on the Google account.

Update non-secret values in `apphosting.yaml` or Firebase Console �  **App Hosting �  home-pantry �  Settings �  Environment**:

| Variable | Required | Notes |
|----------|----------|-------|
| `USE_PGLITE` | yes | Must be `false` in production |
| `DATABASE_URL` | yes | Secret � Cloud SQL socket URL (see [Database](#database)) |
| `ADMIN_EMAIL` | yes | Your admin login email (replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` in `apphosting.yaml`) |
| `ADMIN_PASSWORD` | yes | Secret � creates/updates admin on startup |
| `PUBLIC_ORIGIN` | yes | `https://home-pantry--home-pantry-4bee5.REGION.hosted.app` or custom domain |
| `ORIGIN` | yes (runtime) | Same HTTPS URL as `PUBLIC_ORIGIN` � required by `@sveltejs/adapter-node` for form-action CSRF |
| `OPENAI_API_KEY` | optional* | Recipe suggestions, receipt scan, **foto-runda** (`/api/inventory/photo-scan`), photo product scan (`/api/product-from-image`) |
| `RESEND_API_KEY` | optional | Household invite email via Resend � see [`EMAIL.md`](./EMAIL.md) |
| `TURNSTILE_SECRET_KEY` | yes (prod) | Turnstile server verification on `/register` � see [`CAPTCHA.md`](./CAPTCHA.md) |
| `PUBLIC_TURNSTILE_SITE_KEY` | yes (prod) | Turnstile widget site key � set in `apphosting.yaml` or Firebase Console (BUILD + RUNTIME) |
| `RESEND_FROM` | optional | Sender address; defaults to `Home Pantry <onboarding@resend.dev>` until domain verified |
| `CRON_SECRET` | yes (prod cron) | Bearer for `POST /api/cron/expiry-reminders`  set in Secret Manager; same value as GitHub Actions secret  see [90_DAY_ROADMAP.md � punkt 5](./90_DAY_ROADMAP.md#�gare--github-actions--firebase-prod) |

\*Photo scan, foto-runda, and other AI routes return **503** with a clear JSON error when this secret is missing, invalid, or not granted to the `home-pantry` backend. Create the secret and run `grantaccess` before relying on scan in production.

Quick setup (Windows):

```powershell
powershell -File scripts/setup-openai-secret.ps1
```

| `BODY_SIZE_LIMIT` | yes (runtime) | Adapter-node request body cap. Must be **e 20M** for foto-runda (up to 3�6 MB images). Set in `apphosting.yaml`. Receipt PDF scan still works best under ~1 MB. |
| `DEFAULT_MEMBER_EMAIL` | optional | Demo household member |
| `DEFAULT_MEMBER_PASSWORD` | optional | Demo household member (secret if set) |

After first deploy, set `PUBLIC_ORIGIN` to the live URL shown in the console.


### Resend and Turnstile secrets (helper script)

If `RESEND_API_KEY` or `TURNSTILE_SECRET_KEY` are missing in Secret Manager (deploy or email/captcha fails), run:

```powershell
powershell -File scripts/setup-resend-turnstile-secrets.ps1
```

The script opens Notepad twice so you can paste each secret without leaving values in shell history, then runs `apphosting:secrets:set` and `grantaccess` for backend `home-pantry`. Optional: add `-PatchAppHostingFromEnv` to copy `PUBLIC_TURNSTILE_SITE_KEY` from `.env` into `apphosting.yaml` (public site key, not a secret).

Verify:

```bash
npx firebase apphosting:secrets:describe RESEND_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:describe TURNSTILE_SECRET_KEY --project home-pantry-4bee5
```

After secrets or `PUBLIC_TURNSTILE_SITE_KEY` changes, redeploy (GitHub **Release** workflow or `npm run deploy:firebase`). See [EMAIL.md](./EMAIL.md) and [CAPTCHA.md](./CAPTCHA.md).

### 6. Local smoke test

```bash
npm ci
npm run check
npm run build
npm run start   # node build � verify on http://localhost:3000 with DATABASE_URL set
```

### 7. First deploy

```bash
npm run deploy:firebase
# equivalent to: npx firebase deploy --only apphosting:home-pantry
```

Preview without applying (when supported by CLI):

```bash
npm run deploy:firebase:dry
```

First deploy takes several minutes (Cloud Build + Cloud Run). URL format:

```
https://home-pantry--home-pantry-4bee5.REGION.hosted.app
```

### 8. Post-deploy checklist

- [ ] Migrations applied (`npm run db:migrate`)
- [ ] `ADMIN_EMAIL` set to your real admin address
- [ ] `PUBLIC_ORIGIN` and `ORIGIN` match live URL (cookies + form POST / login)
- [ ] Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Optional (future): [Custom domain](./CUSTOM_DOMAIN.md)  `homepantry.com` not connected yet
- [ ] Optional: set `minInstances: 1` in `apphosting.yaml` to reduce cold starts (costs more)

## Ongoing pipeline (GitHub Actions)

PR-first CI/CD: **[`docs/CI_CD.md`](./CI_CD.md)** — merge via PR, deploy manuellt, CalVer release efter lyckad deploy.

| Workflow | Gate | Trigger |
|----------|------|---------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | G1 `pr-gate` | Push/PR → `master`/`main` |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | G2 `e2e` | PR; `workflow_dispatch`; nattlig schedule |
| [`.github/workflows/changelog-on-merge.yml`](../.github/workflows/changelog-on-merge.yml) | docs | Merged PR → `master` |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | G1 → G2 → G3 → GitHub Release | `workflow_dispatch`; guide-only `push` → `master` |

| Trigger | Behavior |
|---------|----------|
| **Pull request → master** | `pr-gate` + tiered E2E; merge → CHANGELOG bot-commit |
| **Deploy to production** | quality → e2e → deploy → CalVer GitHub Release (`continue-on-error`); hotfix via `deploy_tier=hotfix` |

The deploy job uses the **`production`** GitHub Environment � optional required reviewers there (solo dev: lämna tomt för helt automatisk deploy).

**Firebase Console auto-deploy:** stäng av GitHub-integration i App Hosting om Actions ska vara enda källan � undvik dubbel deploy.

### GitHub secrets to add

| Secret | How to obtain |
|--------|----------------|
| `FIREBASE_SERVICE_ACCOUNT` | **Required.** Run `bash scripts/setup-firebase-deploy-sa.sh`, then `gh secret set FIREBASE_SERVICE_ACCOUNT < ./github-deploy-sa-key.json`. Wired in [`deploy.yml`](../.github/workflows/deploy.yml) via `google-github-actions/auth` + ADC. Roles: Firebase App Hosting Admin + Service Account User. |
| `DATABASE_URL` | **Public IP** Postgres URL for pre-deploy `npm run db:migrate` in Actions — `postgresql://pantry_app:PASSWORD@PUBLIC_IP:5432/pantry`. **Not** the socket URL in Firebase Secret Manager. Password: parse from Firebase `DATABASE_URL` secret or Cloud SQL user `pantry_app`. Cloud SQL **Authorized networks** must allow [GitHub Actions IPs](https://api.github.com/meta) (`actions` ranges). Full steps: [CI_CD.md — DATABASE_URL](./CI_CD.md#database_url--ägare-manuellt) |

| DEPLOY_NOTIFY_WEBHOOK_URL (optional) | ntfy topic URL, Discord webhook, or Slack incoming webhook  push on deploy success; see [docs/CI_CD.md � Mobilnotis](./CI_CD.md#mobilnotis-vid-deploy) |
| DEPLOY_TELEGRAM_BOT_TOKEN + DEPLOY_TELEGRAM_CHAT_ID (optional) | Telegram bot push instead of or in addition to webhook |

`FIREBASE_SERVICE_ACCOUNT` is **required** in [`deploy.yml`](../.github/workflows/deploy.yml) via `google-github-actions/auth`. `FIREBASE_TOKEN` is not used.

### Enable CI deploys

1. Merge via PR to `master`
2. Run `bash scripts/setup-firebase-deploy-sa.sh` and add **`FIREBASE_SERVICE_ACCOUNT`** in GitHub repo secrets — see [`DEPLOY.md`](./DEPLOY.md#firebase-deploy-service-account)
3. Remove legacy **`FIREBASE_TOKEN`** from GitHub secrets if present
4. (Optional) Configure **Environments → production** with required reviewers
5. Run **Deploy to production** from Actions after green CI (see [`DEPLOY.md`](./DEPLOY.md))

App Hosting runtime secrets (`DATABASE_URL` **socket URL**, `ADMIN_PASSWORD`, etc.) stay in **Firebase Secret Manager**. GitHub also needs a separate **`DATABASE_URL` secret (public IP format)** so deploy can run migrations — see [CI_CD.md — DATABASE_URL](./CI_CD.md#database_url--ägare-manuellt).

## IAM during deploy

Each `firebase deploy --only apphosting:home-pantry` reconciles GCP IAM (build SAs, runtime compute SA, Secret Manager bindings, Artifact Registry, Cloud Run). That is normal Firebase App Hosting behavior. Transient **HTTP 409 / concurrent policy changes** usually means two deploys overlapped — not a missing secret value.

| Layer | Repo behavior |
|-------|----------------|
| **Deploy script** | [`scripts/firebase-deploy-apphosting.sh`](../scripts/firebase-deploy-apphosting.sh) — disables `pintags` experiment, retries IAM 409 up to 8× |
| **CI** | [`deploy.yml`](../.github/workflows/deploy.yml) — single-flight concurrency; **does not** run `grantaccess` per release |
| **One-time secrets** | [`scripts/grant-apphosting-secrets.sh`](../scripts/grant-apphosting-secrets.sh) — run after `secrets:set` when adding secrets |
| **One-time Cloud SQL** | [`scripts/grant-cloudsql-client.mjs`](../scripts/grant-cloudsql-client.mjs) — `roles/cloudsql.client` for compute + App Hosting SAs |

### Runtime service account (`firebase-app-hosting-compute@…`)

App Hosting runs your SSR app as this SA. It needs (managed by Firebase + `grantaccess`):

- **Firebase App Hosting Compute Runner** — run the backend
- **Storage Object Viewer** — build artifacts / staging
- **Secret Manager Secret Accessor** — one binding per secret in `apphosting.yaml`
- **Cloud SQL Client** — when using `cloudSqlInstances` (socket at `/cloudsql/…`)

Optional in console: **Developer Connect Read Token Accessor**, **Firebase Admin SDK Administrator Service Agent** — Firebase may attach these during backend setup.

### Default compute SA (`459524831747-compute@developer.gserviceaccount.com`)

Used by Cloud Build steps. Often has **Editor** on the project. Needs **Cloud SQL Client** if build/migrate paths touch Cloud SQL — run `grant-cloudsql-client.mjs` if missing.

### Deploy auth (GitHub Actions)

| Secret | Roles (typical) |
|--------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase App Hosting Admin, Service Account User — create via [`scripts/setup-firebase-deploy-sa.sh`](../scripts/setup-firebase-deploy-sa.sh) |

Deploy credentials are **separate** from runtime `firebase-app-hosting-compute@`.

### Secrets checklist (`apphosting.yaml` RUNTIME)

| Secret | Required for deploy | Notes |
|--------|---------------------|-------|
| `DATABASE_URL` | yes | Socket URL + `pantry_app` user — see [Database](#database) |
| `ADMIN_PASSWORD` | yes | |
| `OPENAI_API_KEY` | yes (prod features) | 503 if missing |
| `RESEND_API_KEY` | yes (email) | |
| `TURNSTILE_SECRET_KEY` | yes (prod auth) | |
| `CRON_SECRET` | yes (cron) | Match GitHub `CRON_SECRET` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | if Stripe enabled | Checkout currently kill-switched |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | if Google login | Bound in yaml — secret must exist |
| `VAPID_PRIVATE_KEY` | if push enabled | |
| `DEMO_ACCOUNT_PASSWORD` | optional | Commented out in yaml |

**Do not** confuse Firebase `DATABASE_URL` (socket, `pantry_app`) with GitHub Actions `DATABASE_URL` (public IP for `db:migrate`). Wrong postgres user in logs (`"database"`) is almost always internet scanners — see [`DEPLOY.md` — Cloud SQL-logg](./DEPLOY.md#cloud-sql-logg-password-authentication-failed-for-user-database).

Owner checklist: [`DEPLOY.md` — IAM during deploy](./DEPLOY.md#iam-during-deploy).

### Alternative: Firebase Console GitHub integration

Firebase Console �  App Hosting �  **home-pantry** �  Settings �  **GitHub** can connect the repo for rollouts. **Use either Console auto-deploy or the Actions `deploy.yml` workflow � not both.** Actions is recommended (tests before deploy).

## Alternative: Cloud Run via Docker

If you prefer raw Cloud Run without App Hosting CDN:

```bash
# Build and push (replace PROJECT_ID and REGION)
gcloud builds submit --tag gcr.io/home-pantry-4bee5/home-pantry

gcloud run deploy home-pantry \
  --image gcr.io/home-pantry-4bee5/home-pantry \
  --region europe-west4 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,USE_PGLITE=false,HOST=0.0.0.0" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest"
```

Use the existing root `Dockerfile`. Map Cloud Run URL to `PUBLIC_ORIGIN`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `db:migrate` only applies 4 migrations | Journal out of sync � run `npm test -- src/lib/infrastructure/db/migrations.test.ts` |
| Build fails: `vite` / `npm run build` | Do not set `NODE_ENV=production` at **BUILD** in `apphosting.yaml` � it makes `npm ci` skip devDependencies. Keep `NODE_ENV` on **RUNTIME** only. |
| Build fails: `DATABASE_URL is not set` | Drizzle config is only for `db:migrate` locally; App Hosting build uses a BUILD-only placeholder URL in `apphosting.yaml`. |
| 500 on login / DB errors | Check `DATABASE_URL` (socket URL on App Hosting), `cloudSqlInstances` in `apphosting.yaml`, and that migrations ran |
| Cloud SQL connection refused (local) | Add your IP to authorized networks; confirm public IP and password |
| App Hosting cannot reach DB | Ensure `cloudSqlInstances` matches connection name; secret uses `/cloudsql/...` host, not public IP |
| Cookies not sticking | Set `PUBLIC_ORIGIN` to exact HTTPS origin; `NODE_ENV=production` enables secure cookies |
| Login/form POST returns 403 | Set `ORIGIN` (runtime) to the same HTTPS origin as the browser URL; proxy `Host` alone is not enough for adapter-node CSRF |
| Cold start latency | Increase `minInstances` in `apphosting.yaml` |
| Foto-runda: �AI-tj�nsten �r inte tillg�nglig� | `OPENAI_API_KEY` missing or backend lacks `grantaccess`  run `scripts/setup-openai-secret.ps1` and redeploy |
| Foto-runda fails with generic server error / 413 | Request exceeded `BODY_SIZE_LIMIT`  ensure `apphosting.yaml` has `BODY_SIZE_LIMIT: "20M"` and redeploy |
| Blaze billing | App Hosting uses Cloud Run + Cloud Build; free tier limits may not cover production traffic |

## Files in this setup

| File | Purpose |
|------|---------|
| `firebase.json` | App Hosting backend id and deploy ignore list |
| `.firebaserc` | Firebase project id |
| `apphosting.yaml` | Cloud Run sizing, `cloudSqlInstances`, build/run commands, env + secrets |
| `scripts/firebase-deploy-apphosting.sh` | CI/local deploy with pintags off + IAM 409 retry |
| `scripts/grant-apphosting-secrets.sh` | One-time `grantaccess` for all `apphosting.yaml` secrets |
| `scripts/grant-cloudsql-client.mjs` | One-time `roles/cloudsql.client` for compute + App Hosting SAs |
| `.apphosting/bundle.yaml` | SvelteKit adapter-node output hints for App Hosting |
| `.github/workflows/ci.yml`, `e2e.yml`, `deploy.yml` | Tiered CI/CD (see `docs/CI_CD.md`) |
| `Dockerfile` | Optional Cloud Run container build |
| `.dockerignore` | Smaller Docker context |

## Security

- Do **not** commit `.env`, service account JSON, or API keys
- `firebase-debug.log` and `.firebase/` are gitignored
- Use Secret Manager for `DATABASE_URL`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`
- Rotate `ADMIN_PASSWORD` after first login in production

## Blockers (user-owned)

- **Billing:** Blaze plan required
- **Region:** App Hosting and Cloud SQL should share a region (`europe-west4`)
- **Secrets:** `DATABASE_URL`, `ADMIN_PASSWORD`, and optionally `OPENAI_API_KEY` must exist before deploy
- **Authorized networks:** Required only for local `db:migrate` over public IP
- **SSR:** Cannot use static-only Hosting; App Hosting or Cloud Run is mandatory
- **PGlite:** Not supported in Cloud Run (ephemeral filesystem); use Postgres

## Troubleshooting deploy CLI errors

If `npm run deploy:firebase` fails immediately with **"An unexpected error has occurred"** (often twice), run with debug and check the end of `firebase-debug.log`:

```powershell
npx firebase-tools@latest deploy --only apphosting:home-pantry --project home-pantry-4bee5 --debug
```

**EPERM on `node_modules.broken.*`:** A failed local `npm install` can leave a folder like `node_modules.broken.20260529172544`. Firebase zips the repo root and only ignores `node_modules`, not that rename backup, so Windows file locks cause EPERM. Fix:

1. Close dev servers/terminals using the project, then delete `node_modules.broken*` in the repo root.
2. `firebase.json` ignores `node_modules.broken*` for deploy; keep that pattern if you customize ignores.

**Cloud Build ENOENT on `starter-pack.json`:** The App Hosting ignore list used `"data"`, which also excluded `src/lib/data/` from the deploy zip. Use `"/data"` to ignore only the repo-root PGlite folder.
