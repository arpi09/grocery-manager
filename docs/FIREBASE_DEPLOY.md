# Deploy home-pantry to Firebase

This guide deploys the SvelteKit SSR app (Lucia auth + PostgreSQL) to **Firebase App Hosting**.

## Architecture choice

| Option | Verdict | Why |
|--------|---------|-----|
| **Firebase App Hosting** (recommended) | ✅ Use this | Full-stack Node/SSR on Cloud Run + CDN. Native SvelteKit support via Node buildpack. Works with existing `@sveltejs/adapter-node`. |
| Cloud Run + Dockerfile | ✅ Alternative | Same runtime, manual `gcloud run deploy`. Useful for CI or non-Firebase pipelines. See [Cloud Run path](#alternative-cloud-run-via-docker). |
| Firebase Hosting + Cloud Functions | ⚠️ Possible | Community adapters exist; more config, cold starts, less maintained than App Hosting. |
| Static Hosting only | ❌ Not suitable | App requires SSR (Lucia sessions, `hooks.server.ts`, API routes). |

**Database:** The app uses **PostgreSQL** in production (`DATABASE_URL`). PGlite (`USE_PGLITE=true`) is **dev-only**. Firebase does not replace Postgres — use **Cloud SQL for PostgreSQL**, **Neon**, or **Supabase** and set `DATABASE_URL` as a secret.

**Firestore / Realtime Database:** Not required. Do not migrate unless you explicitly want to.

## Prerequisites

- Google account with [Firebase](https://console.firebase.google.com/)
- **Blaze (pay-as-you-go) plan** — required for App Hosting and Cloud Run
- [Firebase CLI](https://firebase.google.com/docs/cli) **≥ 14.4.0**
- Node.js 20 (matches `Dockerfile` and CI)
- A **PostgreSQL** instance reachable from Google Cloud (see [Database](#database))

## 1. Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Note your **Project ID** (e.g. `home-pantry-prod`)
3. Upgrade to **Blaze** plan (Project settings → Usage and billing)
4. Enable APIs (usually auto-enabled on first App Hosting deploy):
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API

Replace placeholders in repo config:

```bash
# .firebaserc — set your project id
"default": "home-pantry-prod"
```

## 2. Set up PostgreSQL

Run migrations **before** the first app deploy.

### Option A — Neon / Supabase (simplest)

1. Create a project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
2. Copy the connection string (must include `?sslmode=require` for Neon)
3. From your machine (with `DATABASE_URL` set):

```bash
cd /path/to/home-pantry-firebase
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
npm run db:migrate
```

### Option B — Cloud SQL for PostgreSQL

1. Create a Cloud SQL PostgreSQL instance in the **same region** as App Hosting (e.g. `europe-north1` or `us-central1`)
2. Create database `pantry` and user
3. For production, use [VPC connector / private IP](https://firebase.google.com/docs/app-hosting/vpc-networks) in `apphosting.yaml` so Cloud Run can reach Cloud SQL
4. Run migrations from Cloud Shell or a machine with network access:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate
```

**Recommendation:** Start with **Neon** or **Supabase** for fastest setup; move to Cloud SQL later if you need everything in GCP.

## 3. Install Firebase CLI and log in

```bash
npm install -g firebase-tools@latest
firebase login
firebase projects:list
```

## 4. Link project and init App Hosting

From the repo root (worktree `home-pantry-firebase` on branch `feature/firebase-deploy`):

```bash
# Point CLI at your project (or edit .firebaserc)
firebase use YOUR_FIREBASE_PROJECT_ID

# Creates/updates firebase.json apphosting block and apphosting.yaml starter
firebase init apphosting
```

When prompted:

- **Backend ID:** `home-pantry` (matches `firebase.json` template)
- **Region:** closest to users (e.g. `europe-west1`, `us-central1`)
- **Root directory:** `.` (project root)

If you already have `firebase.json` / `apphosting.yaml` from this branch, init may merge — keep the committed templates and fill in secrets.

## 5. Configure secrets and environment

Never commit `.env` or service account keys.

Create secrets (CLI prompts for values):

```bash
firebase apphosting:secrets:set DATABASE_URL --project YOUR_FIREBASE_PROJECT_ID
firebase apphosting:secrets:set ADMIN_PASSWORD --project YOUR_FIREBASE_PROJECT_ID
firebase apphosting:secrets:set OPENAI_API_KEY --project YOUR_FIREBASE_PROJECT_ID
```

Grant App Hosting access (CLI usually offers this during `secrets:set`):

```bash
firebase apphosting:secrets:grantaccess DATABASE_URL --backend home-pantry
firebase apphosting:secrets:grantaccess ADMIN_PASSWORD --backend home-pantry
firebase apphosting:secrets:grantaccess OPENAI_API_KEY --backend home-pantry
```

Update non-secret values in `apphosting.yaml` or Firebase Console → **App Hosting → home-pantry → Settings → Environment**:

| Variable | Required | Notes |
|----------|----------|-------|
| `USE_PGLITE` | yes | Must be `false` in production |
| `DATABASE_URL` | yes | Secret — Postgres connection string |
| `ADMIN_EMAIL` | yes | Admin account email (seeded on startup) |
| `ADMIN_PASSWORD` | yes | Secret — creates/updates admin on startup |
| `PUBLIC_ORIGIN` | yes | `https://home-pantry--PROJECT_ID.REGION.hosted.app` or custom domain |
| `OPENAI_API_KEY` | optional | Recipe suggestions / image scan |
| `DEFAULT_MEMBER_EMAIL` | optional | Demo household member |
| `DEFAULT_MEMBER_PASSWORD` | optional | Demo household member |

After first deploy, set `PUBLIC_ORIGIN` to the live URL shown in the console.

## 6. Build locally (smoke test)

```bash
npm ci
npm run check
npm run build
npm run start   # node build — verify on http://localhost:3000 with DATABASE_URL set
```

## 7. Deploy

### Primary: Firebase App Hosting (local source)

```bash
npm run deploy:firebase
# equivalent to:
# firebase deploy --only apphosting:home-pantry
```

First deploy takes several minutes (Cloud Build + Cloud Run). URL format:

```
https://home-pantry--YOUR_FIREBASE_PROJECT_ID.REGION.hosted.app
```

### GitHub CI/CD (optional)

1. Firebase Console → App Hosting → **home-pantry** → Settings → **GitHub**
2. Connect repo, set live branch (e.g. `master`)
3. Push to trigger automatic rollouts

### Alternative: Cloud Run via Docker

If you prefer raw Cloud Run without App Hosting CDN:

```bash
# Build and push (replace PROJECT_ID and REGION)
gcloud builds submit --tag gcr.io/YOUR_FIREBASE_PROJECT_ID/home-pantry

gcloud run deploy home-pantry \
  --image gcr.io/YOUR_FIREBASE_PROJECT_ID/home-pantry \
  --region europe-north1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,USE_PGLITE=false,HOST=0.0.0.0" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest"
```

Use the existing root `Dockerfile`. Map Cloud Run URL to `PUBLIC_ORIGIN`.

## 8. Post-deploy checklist

- [ ] Migrations applied (`npm run db:migrate`)
- [ ] `PUBLIC_ORIGIN` matches live URL (Lucia secure cookies)
- [ ] Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Optional: [Custom domain](https://firebase.google.com/docs/app-hosting/custom-domain)
- [ ] Optional: set `minInstances: 1` in `apphosting.yaml` to reduce cold starts (costs more)

## CI snippet (GitHub Actions)

Add to `.github/workflows/deploy-firebase.yml` when ready (requires `FIREBASE_TOKEN` secret):

```yaml
name: Deploy Firebase App Hosting
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: YOUR_FIREBASE_PROJECT_ID
          channelId: live
```

For App Hosting specifically, use `firebase deploy --only apphosting:home-pantry` with a CI token:

```yaml
      - run: npm install -g firebase-tools
      - run: firebase deploy --only apphosting:home-pantry --non-interactive
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: `DATABASE_URL is not set` | Drizzle config only runs for `db:migrate` locally. App build should not need DB; if it does, set a dummy URL at BUILD time only. |
| 500 on login / DB errors | Check `DATABASE_URL`, SSL mode, and that migrations ran |
| Cookies not sticking | Set `PUBLIC_ORIGIN` to exact HTTPS origin; `NODE_ENV=production` enables secure cookies |
| Cold start latency | Increase `minInstances` in `apphosting.yaml` |
| Blaze billing | App Hosting uses Cloud Run + Cloud Build; free tier limits may not cover production traffic |

## Files in this setup

| File | Purpose |
|------|---------|
| `firebase.json` | App Hosting backend id and deploy ignore list |
| `.firebaserc` | Firebase project id placeholder |
| `apphosting.yaml` | Cloud Run sizing, build/run commands, env + secrets |
| `.apphosting/bundle.yaml` | SvelteKit adapter-node output hints for App Hosting |
| `Dockerfile` | Optional Cloud Run container build |
| `.dockerignore` | Smaller Docker context |

## Security

- Do **not** commit `.env`, service account JSON, or API keys
- `firebase-debug.log` and `.firebase/` are gitignored
- Use Secret Manager for `DATABASE_URL`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`
- Rotate `ADMIN_PASSWORD` after first login in production

## Blockers

- **Billing:** Blaze plan required
- **Region:** Pick App Hosting region near Postgres (latency + VPC if using Cloud SQL)
- **SSR:** Cannot use static-only Hosting; App Hosting or Cloud Run is mandatory
- **PGlite:** Not supported in Cloud Run (ephemeral filesystem); use Postgres
