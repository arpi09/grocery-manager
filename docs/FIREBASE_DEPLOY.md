# Deploy home-pantry to Firebase

This guide deploys the SvelteKit SSR app (Lucia auth + PostgreSQL) to **Firebase App Hosting**.

## Architecture choice

| Option | Verdict | Why |
|--------|---------|-----|
| **Firebase App Hosting** (recommended) | ✅ Use this | Full-stack Node/SSR on Cloud Run + CDN. Native SvelteKit support via Node buildpack. Works with existing `@sveltejs/adapter-node`. |
| Cloud Run + Dockerfile | ✅ Alternative | Same runtime, manual `gcloud run deploy`. Useful for CI or non-Firebase pipelines. See [Cloud Run path](#alternative-cloud-run-via-docker). |
| Firebase Hosting + Cloud Functions | ⚠️ Possible | Community adapters exist; more config, cold starts, less maintained than App Hosting. |
| Static Hosting only | ❌ Not suitable | App requires SSR (Lucia sessions, `hooks.server.ts`, API routes). |

**Database:** The app uses **PostgreSQL** in production (`DATABASE_URL`). PGlite (`USE_PGLITE=true`) is **dev-only**. This project uses **Cloud SQL for PostgreSQL** in GCP project `home-pantry-4bee5` (see [Database](#database)).

**Firestore / Realtime Database:** Not required. Do not migrate unless you explicitly want to.

## Prerequisites

- Google account with [Firebase](https://console.firebase.google.com/)
- **Blaze (pay-as-you-go) plan** — required for App Hosting and Cloud Run
- Node.js 20 (matches `Dockerfile` and CI)
- A **PostgreSQL** instance reachable from Google Cloud (see [Database](#database))

Firebase CLI is a **devDependency** in this repo — use `npx firebase` or the npm scripts below (no global install required).

## First deploy (one-time setup)

### 1. Firebase project and billing

1. Open [Firebase Console](https://console.firebase.google.com/) → use project **`home-pantry-4bee5`** (or create your own and update `.firebaserc`)
2. Upgrade to **Blaze** plan (Project settings → Usage and billing)
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

#### App Hosting ↔ Cloud SQL (`apphosting.yaml`)

`apphosting.yaml` lists the instance under `cloudSqlInstances`. App Hosting mounts a Unix socket at:

```
/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

Set the **`DATABASE_URL` secret** (not in git) to a URL that uses that socket (works with `postgres` / Drizzle):

```
postgresql://pantry_app:YOUR_PASSWORD@/pantry?host=/cloudsql/home-pantry-4bee5:europe-west4:home-pantry-4bee5-instance
```

`USE_PGLITE` must stay `false` in `apphosting.yaml` (already set).

If you use **private IP only** (no socket), configure [VPC access](https://firebase.google.com/docs/app-hosting/vpc-networks) in `runConfig.vpcAccess` and put the private IP host in `DATABASE_URL` instead — only needed when not using `cloudSqlInstances`.

#### Local migrations (public IP)

1. GCP Console → **Cloud SQL** → `home-pantry-4bee5-instance` → **Connections** → **Authorized networks** → add your current public IP.
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

If you already have `firebase.json` / `apphosting.yaml` from this repo, init may merge — keep the committed templates and fill in secrets.

### 5. Secrets and environment

Never commit `.env` or service account keys.

Create secrets (CLI prompts for values). For `DATABASE_URL`, paste the **socket** URL from [Database](#database) (not the public IP URL).

```bash
npx firebase apphosting:secrets:set DATABASE_URL --project home-pantry-4bee5
npx firebase apphosting:secrets:set ADMIN_PASSWORD --project home-pantry-4bee5
npx firebase apphosting:secrets:set OPENAI_API_KEY --project home-pantry-4bee5
```

Grant App Hosting access (CLI usually offers this during `secrets:set`):

```bash
npx firebase apphosting:secrets:grantaccess DATABASE_URL --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess ADMIN_PASSWORD --backend home-pantry --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess OPENAI_API_KEY --backend home-pantry --project home-pantry-4bee5
```

Update non-secret values in `apphosting.yaml` or Firebase Console → **App Hosting → home-pantry → Settings → Environment**:

| Variable | Required | Notes |
|----------|----------|-------|
| `USE_PGLITE` | yes | Must be `false` in production |
| `DATABASE_URL` | yes | Secret — Cloud SQL socket URL (see [Database](#database)) |
| `ADMIN_EMAIL` | yes | Your admin login email (replace `REPLACE_WITH_YOUR_ADMIN_EMAIL` in `apphosting.yaml`) |
| `ADMIN_PASSWORD` | yes | Secret — creates/updates admin on startup |
| `PUBLIC_ORIGIN` | yes | `https://home-pantry--home-pantry-4bee5.REGION.hosted.app` or custom domain |
| `OPENAI_API_KEY` | optional | Recipe suggestions / image scan |
| `DEFAULT_MEMBER_EMAIL` | optional | Demo household member |
| `DEFAULT_MEMBER_PASSWORD` | optional | Demo household member (secret if set) |

After first deploy, set `PUBLIC_ORIGIN` to the live URL shown in the console.

### 6. Local smoke test

```bash
npm ci
npm run check
npm run build
npm run start   # node build — verify on http://localhost:3000 with DATABASE_URL set
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
- [ ] `PUBLIC_ORIGIN` matches live URL (Lucia secure cookies)
- [ ] Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Optional: [Custom domain](https://firebase.google.com/docs/app-hosting/custom-domain)
- [ ] Optional: set `minInstances: 1` in `apphosting.yaml` to reduce cold starts (costs more)

## Ongoing pipeline (GitHub Actions)

Workflow: [`.github/workflows/deploy-firebase.yml`](../.github/workflows/deploy-firebase.yml)

| Trigger | Behavior |
|---------|----------|
| Push to `master` | Runs check + test + build; **deploys** if `FIREBASE_TOKEN` secret is set |
| **workflow_dispatch** | Same verify job, then deploy (or skip deploy step if token missing) |

The deploy job uses the **`production`** GitHub Environment — add optional required reviewers there for manual approval before each deploy.

### GitHub secrets to add

| Secret | How to obtain |
|--------|----------------|
| `FIREBASE_TOKEN` | Run `npx firebase login:ci` locally and paste the token into **Settings → Secrets and variables → Actions** |

Alternative (not wired in the default workflow): a Google Cloud **service account JSON** with Firebase/App Hosting deploy permissions, stored as `FIREBASE_SERVICE_ACCOUNT` and passed to `google-github-actions/auth` — use if you prefer service accounts over CI tokens.

### Enable CI deploys

1. Merge this branch to `master`
2. Add `FIREBASE_TOKEN` in GitHub repo secrets
3. (Optional) Configure **Environments → production** with required reviewers
4. Push to `master` or run **Deploy Firebase App Hosting** manually from the Actions tab

App Hosting runtime secrets (`DATABASE_URL`, `ADMIN_PASSWORD`, etc.) stay in **Firebase Secret Manager**, not GitHub.

### Alternative: Firebase Console GitHub integration

Firebase Console → App Hosting → **home-pantry** → Settings → **GitHub** can also connect the repo for rollouts. The GitHub Actions workflow above is the repo-native option and runs tests before deploy.

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
| `db:migrate` only applies 4 migrations | Journal out of sync — run `npm test -- src/lib/infrastructure/db/migrations.test.ts` |
| Build fails: `vite` / `npm run build` | Do not set `NODE_ENV=production` at **BUILD** in `apphosting.yaml` — it makes `npm ci` skip devDependencies. Keep `NODE_ENV` on **RUNTIME** only. |
| Build fails: `DATABASE_URL is not set` | Drizzle config is only for `db:migrate` locally; App Hosting build uses a BUILD-only placeholder URL in `apphosting.yaml`. |
| 500 on login / DB errors | Check `DATABASE_URL` (socket URL on App Hosting), `cloudSqlInstances` in `apphosting.yaml`, and that migrations ran |
| Cloud SQL connection refused (local) | Add your IP to authorized networks; confirm public IP and password |
| App Hosting cannot reach DB | Ensure `cloudSqlInstances` matches connection name; secret uses `/cloudsql/...` host, not public IP |
| Cookies not sticking | Set `PUBLIC_ORIGIN` to exact HTTPS origin; `NODE_ENV=production` enables secure cookies |
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
| `.github/workflows/deploy-firebase.yml` | CI verify + deploy |
| `Dockerfile` | Optional Cloud Run container build |
| `.dockerignore` | Smaller Docker context |

## Security

- Do **not** commit `.env`, service account JSON, or API keys
- `firebase-debug.log` and `.firebase/` are gitignored
- Use Secret Manager for `DATABASE_URL`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`
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
2. `firebase.json` already ignores `node_modules.broken*` for deploy; keep that pattern if you customize ignores.
