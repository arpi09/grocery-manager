# Deploy home-pantry to Firebase

This guide deploys the SvelteKit SSR app (Lucia auth + PostgreSQL) to **Firebase App Hosting**.

## Architecture choice

| Option | Verdict | Why |
|--------|---------|-----|
| **Firebase App Hosting** (recommended) | âœ… Use this | Full-stack Node/SSR on Cloud Run + CDN. Native SvelteKit support via Node buildpack. Works with existing `@sveltejs/adapter-node`. |
| Cloud Run + Dockerfile | âœ… Alternative | Same runtime, manual `gcloud run deploy`. Useful for CI or non-Firebase pipelines. See [Cloud Run path](#alternative-cloud-run-via-docker). |
| Firebase Hosting + Cloud Functions | âš ï¸ Possible | Community adapters exist; more config, cold starts, less maintained than App Hosting. |
| Static Hosting only | âŒ Not suitable | App requires SSR (Lucia sessions, `hooks.server.ts`, API routes). |

**Database:** The app uses **PostgreSQL** in production (`DATABASE_URL`). PGlite (`USE_PGLITE=true`) is **dev-only**. This project uses **Cloud SQL for PostgreSQL** in GCP project `home-pantry-4bee5` (see [Database](#database)).

**Firestore / Realtime Database:** Not required. Do not migrate unless you explicitly want to.

## Prerequisites

- Google account with [Firebase](https://console.firebase.google.com/)
- **Blaze (pay-as-you-go) plan** â€” required for App Hosting and Cloud Run
- Node.js 20 (matches `Dockerfile` and CI)
- A **PostgreSQL** instance reachable from Google Cloud (see [Database](#database))

Firebase CLI is a **devDependency** in this repo â€” use `npx firebase` or the npm scripts below (no global install required).

## First deploy (one-time setup)

### 1. Firebase project and billing

1. Open [Firebase Console](https://console.firebase.google.com/) â†’ use project **`home-pantry-4bee5`** (or create your own and update `.firebaserc`)
2. Upgrade to **Blaze** plan (Project settings â†’ Usage and billing)
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

#### App Hosting â†” Cloud SQL (`apphosting.yaml`)

`apphosting.yaml` lists the instance under `cloudSqlInstances`. App Hosting mounts a Unix socket at:

```
/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

Set the **`DATABASE_URL` secret** (not in git) to a URL that uses that socket (works with `postgres` / Drizzle):

```
postgresql://pantry_app:YOUR_PASSWORD@/pantry?host=/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

`USE_PGLITE` must stay `false` in `apphosting.yaml` (already set).

If you use **private IP only** (no socket), configure [VPC access](https://firebase.google.com/docs/app-hosting/vpc-networks) in `runConfig.vpcAccess` and put the private IP host in `DATABASE_URL` instead â€” only needed when not using `cloudSqlInstances`.

#### Local migrations (public IP)

1. GCP Console â†’ **Cloud SQL** â†’ `home-pantry-4bee5-instance` â†’ **Connections** â†’ **Authorized networks** â†’ add your current public IP.
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

If you already have `firebase.json` / `apphosting.yaml` from this repo, init may merge â€” keep the committed templates and fill in secrets.

### 5. Secrets and environment

Never commit `.env` or service account keys.

Create secrets (CLI prompts for values). For `DATABASE_URL`, paste the **socket** URL from [Database](#database) (not the public IP URL).

```bash
npx firebase apphosting:secrets:set DATABASE_URL --project home-pantry-4bee5
npx firebase apphosting:secrets:set ADMIN_PASSWORD --project home-pantry-4bee5
npx firebase apphosting:secrets:set OPENAI_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:set RESEND_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:set TURNSTILE_SECRET_KEY --project home-pantry-4bee5
```

Grant App Hosting access (CLI usually offers this during `secrets:set`):

```bash
npx firebase apphosting:secrets:grantaccess DATABASE_URL --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess ADMIN_PASSWORD --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess OPENAI_API_KEY --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess TURNSTILE_SECRET_KEY --backend home-pantry --project home-pantry-4bee5
```

Update non-secret values in `apphosting.yaml` or Firebase Console â†’ **App Hosting â†’ home-pantry â†’ Settings â†’ Environment**:

| Variable | Required | Notes |
|----------|----------|-------|
| `USE_PGLITE` | yes | Must be `false` in production |
| `DATABASE_URL` | yes | Secret â€” Cloud SQL socket URL (see [Database](#database)) |
| `ADMIN_EMAIL` | yes | Your admin login email (replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` in `apphosting.yaml`) |
| `ADMIN_PASSWORD` | yes | Secret â€” creates/updates admin on startup |
| `PUBLIC_ORIGIN` | yes | `https://home-pantry--home-pantry-4bee5.REGION.hosted.app` or custom domain |
| `ORIGIN` | yes (runtime) | Same HTTPS URL as `PUBLIC_ORIGIN` â€” required by `@sveltejs/adapter-node` for form-action CSRF |
| `OPENAI_API_KEY` | optional* | Recipe suggestions, receipt scan, **photo product scan** (`/api/product-from-image`) |
| `RESEND_API_KEY` | optional | Household invite email via Resend â€” see [`EMAIL.md`](./EMAIL.md) |
| `TURNSTILE_SECRET_KEY` | yes (prod) | Turnstile server verification on `/register` â€” see [`CAPTCHA.md`](./CAPTCHA.md) |
| `PUBLIC_TURNSTILE_SITE_KEY` | yes (prod) | Turnstile widget site key â€” set in `apphosting.yaml` or Firebase Console (BUILD + RUNTIME) |
| `RESEND_FROM` | optional | Sender address; defaults to `Home Pantry <onboarding@resend.dev>` until domain verified |

\*Photo scan and other AI routes return **503** with a clear JSON error when this secret is missing, invalid, or not granted to the `home-pantry` backend. Create the secret and run `grantaccess` before relying on scan in production.
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
npm run start   # node build â€” verify on http://localhost:3000 with DATABASE_URL set
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
- [ ] Optional: [Custom domain](https://firebase.google.com/docs/app-hosting/custom-domain)
- [ ] Optional: set `minInstances: 1` in `apphosting.yaml` to reduce cold starts (costs more)

## Ongoing pipeline (GitHub Actions)

Trunk-baserad CI/CD (ingen PR): **[`docs/CI_CD.md`](./CI_CD.md)**.

| Workflow | Gate | Trigger |
|----------|------|---------|
| [`.github/workflows/release.yml`](../.github/workflows/release.yml) | G1 `quality` â†’ G2 `e2e` â†’ G3 `deploy` | Push till `master`/`main`; `workflow_dispatch` (nÃ¶dlÃ¤ge) |

| Trigger | Behavior |
|---------|----------|
| Push to `master`/`main` | G1 â†’ G2 â†’ G3 automatiskt (deploy om `FIREBASE_TOKEN` finns) |
| **workflow_dispatch** on **Release** | Samma kedja; *Skip E2E* endast vid nÃ¶dlÃ¤ge |

The deploy job uses the **`production`** GitHub Environment â€” optional required reviewers there (solo dev: lÃ¤mna tomt fÃ¶r helt automatisk deploy).

**Firebase Console auto-deploy:** stÃ¤ng av GitHub-integration i App Hosting om Actions ska vara enda kÃ¤llan â€” undvik dubbel deploy.

### GitHub secrets to add

| Secret | How to obtain |
|--------|----------------|
| `FIREBASE_TOKEN` | Run `npx firebase login:ci` locally and paste the token into **Settings â†’ Secrets and variables â†’ Actions** |

Alternative (not wired in the default workflow): a Google Cloud **service account JSON** with Firebase/App Hosting deploy permissions, stored as `FIREBASE_SERVICE_ACCOUNT` and passed to `google-github-actions/auth` â€” use if you prefer service accounts over CI tokens.

### Enable CI deploys

1. Merge this branch to `master`
2. Add `FIREBASE_TOKEN` in GitHub repo secrets
3. (Optional) Configure **Environments â†’ production** with required reviewers
4. Push to `master` (Release workflow: quality â†’ e2e â†’ deploy) or run **Release** manually from Actions

App Hosting runtime secrets (`DATABASE_URL`, `ADMIN_PASSWORD`, etc.) stay in **Firebase Secret Manager**, not GitHub.

### Alternative: Firebase Console GitHub integration

Firebase Console â†’ App Hosting â†’ **home-pantry** â†’ Settings â†’ **GitHub** can connect the repo for rollouts. **Use either Console auto-deploy or the Actions `release.yml` workflow â€” not both.** Actions is recommended (tests before deploy).

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
| `db:migrate` only applies 4 migrations | Journal out of sync â€” run `npm test -- src/lib/infrastructure/db/migrations.test.ts` |
| Build fails: `vite` / `npm run build` | Do not set `NODE_ENV=production` at **BUILD** in `apphosting.yaml` â€” it makes `npm ci` skip devDependencies. Keep `NODE_ENV` on **RUNTIME** only. |
| Build fails: `DATABASE_URL is not set` | Drizzle config is only for `db:migrate` locally; App Hosting build uses a BUILD-only placeholder URL in `apphosting.yaml`. |
| 500 on login / DB errors | Check `DATABASE_URL` (socket URL on App Hosting), `cloudSqlInstances` in `apphosting.yaml`, and that migrations ran |
| Cloud SQL connection refused (local) | Add your IP to authorized networks; confirm public IP and password |
| App Hosting cannot reach DB | Ensure `cloudSqlInstances` matches connection name; secret uses `/cloudsql/...` host, not public IP |
| Cookies not sticking | Set `PUBLIC_ORIGIN` to exact HTTPS origin; `NODE_ENV=production` enables secure cookies |
| Login/form POST returns 403 | Set `ORIGIN` (runtime) to the same HTTPS origin as the browser URL; proxy `Host` alone is not enough for adapter-node CSRF |
| Cold start latency | Increase `minInstances` in `apphosting.yaml` |
| Blaze billing | App Hosting uses Cloud Run + Cloud Build; free tier limits may not cover production traffic |

## Files in this setup

| File | Purpose |
|------|---------|
| `firebase.json` | App Hosting backend id and deploy ignore list |
| `.firebaserc` | Firebase project id |
| `apphosting.yaml` | Cloud Run sizing, `cloudSqlInstances`, build/run commands, env + secrets |
| `scripts/db-migrate-cloudsql.ps1` | Windows helper to run `db:migrate` from `.env` |
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
