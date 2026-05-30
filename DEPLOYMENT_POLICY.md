# Deployment policy

Authority, environments, risk classification, and rollback rules for **home-pantry** production releases.

**Last reviewed:** 2026-05-30

**Related:** [RELEASE_PIPELINE.md](./RELEASE_PIPELINE.md) · [docs/CI_CD.md](./docs/CI_CD.md) · [docs/FIREBASE_DEPLOY.md](./docs/FIREBASE_DEPLOY.md)

---

## Deployment authority

| Actor | May deploy to production? | How |
|-------|---------------------------|-----|
| **GitHub Actions — Release workflow** | Yes (default path) | Push to `master`/`main` → G1 → G2 → G3 when gates pass and `FIREBASE_TOKEN` is set |
| **Human (local CLI)** | Yes (exception / bootstrap) | `npm run deploy:firebase` with authenticated Firebase CLI — document reason in chat |
| **Firebase Console auto-deploy** | **Discouraged** | Disable GitHub integration in App Hosting when using Actions — avoid double deploy |
| **Implementation agents** | Indirect only | Commit + push to `master` after G0 and coordinator/user approval; Actions deploys |
| **Pipeline agent** | No direct deploy | Maintains policy and workflow; does not run production deploy unless explicitly assigned |

**Rule:** Production deploys must flow through documented gates (G0–G3) or an documented **incident / emergency** path (see below). No silent or undocumented production changes.

---

## Environments

| Environment | Purpose | Database | Deploy trigger |
|-------------|---------|----------|----------------|
| **Local dev** | Feature work, G0 checks | PGlite (`USE_PGLITE=true`) or Cloud SQL via `.env` | Manual (`npm run dev`, `dev:watch`) |
| **CI (GitHub Actions)** | G1 quality, G2 E2E | PGlite in workflow env | Push to `master`/`main`, `workflow_dispatch` |
| **Production (Firebase App Hosting)** | Live users | Cloud SQL PostgreSQL (`USE_PGLITE=false`) | G3 after G1+G2 pass; project `home-pantry-4bee5`, backend `home-pantry` |

Production URL format: `https://home-pantry--home-pantry-4bee5.<region>.hosted.app` (or custom domain).

---

## Risk classification

Default: **if uncertain, classify as high**.

### Low risk

- Documentation-only changes (`docs/**`, `*.md`, comments)
- Copy / styling with no auth, API, or schema impact
- Test-only changes outside production paths (unit tests, no workflow change)
- Coordinator / agent metadata (`.cursor/rules/**`, `OWNERSHIP.md`) with no infra change

**Auto-deploy:** Allowed via fast path after G0–G3 pass.

### Medium risk

- UI feature changes in isolated routes (no auth/session/schema)
- Non-breaking API response shape changes with tests updated
- Dependency patch bumps (non-auth, non-DB drivers) with green CI
- New E2E specs or Playwright config (pipeline consumes; E2E agent owns)
- `package.json` script changes that do not alter deploy/build semantics

**Auto-deploy:** Allowed via fast path after G0–G3 pass; run E2E locally if auth or navigation touched.

### High risk

| Category | Examples |
|----------|----------|
| **Schema / migrations** | `drizzle/**`, `src/lib/infrastructure/db/schema.ts`, new SQL migrations |
| **Auth & session** | `hooks.server.ts`, Lucia/session, login/register/logout routes |
| **Secrets & env** | `apphosting.yaml` secret refs, new env vars, `.env.example` production values |
| **OpenAI / AI routes** | `/api/recipes`, `/api/product-from-image`, `openai.ts`, scan flows |
| **Infra & deploy YAML** | `.github/workflows/**`, `firebase.json`, `apphosting.yaml`, Cloud SQL config |
| **Database init / seed** | `init.ts`, `seed-admin.ts`, migration journal fixes |
| **Global wiring** | `di.ts`, `app.d.ts`, root layout affecting all routes |

**Auto-deploy:** **Not allowed** without **guarded path** (coordinator approval, extra checks, documented migration/deploy order).

---

## Auto-deploy rules

| Risk | Push to `master` → Actions | G3 deploy |
|------|----------------------------|-----------|
| **Low** | Yes | Automatic when G1+G2 pass and `FIREBASE_TOKEN` set |
| **Medium** | Yes | Automatic when G1+G2 pass; agent runs G0 + E2E if auth/UI touched |
| **High** | Only after guarded-path approval | Requires explicit approval; run migration tests; apply DB migrations **before** app deploy when schema changed |

**Blockers for G3 (even on low/medium):**

- Missing `FIREBASE_TOKEN` in GitHub Actions (G1+G2 still run; deploy skipped with notice)
- Failed `quality` or `e2e` job
- Production GitHub Environment required reviewers not satisfied (if configured)
- Undocumented high-risk change on `master`
- **Security agent gate blocked** — see [SECURITY_REPORT.md](./SECURITY_REPORT.md) and [SECURITY_DEPLOYMENT_CHECKLIST.md](./SECURITY_DEPLOYMENT_CHECKLIST.md); critical/high findings or secrets in git block deploy until fixed or explicitly approved

---

## Secrets handling

| Secret | Storage | Never |
|--------|---------|-------|
| `FIREBASE_TOKEN` | GitHub Actions repository secret | In repo, logs, or chat |
| `DATABASE_URL`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`, … | Firebase Secret Manager (App Hosting) | In git, `apphosting.yaml` values, or CI logs |
| Local dev credentials | User `.env` (gitignored) | Committed |

Obtain CI token: `npx firebase login:ci` → paste into **Settings → Secrets and variables → Actions**.

Rotate production credentials after first login and on any suspected leak.

---

## Rollback strategy

### 1. Firebase App Hosting rollout (fastest for bad deploy)

1. Firebase Console → **App Hosting → home-pantry → Rollouts**
2. Select previous healthy rollout → **Roll back** (or redeploy prior revision)
3. Verify login, dashboard, and critical API routes

Use when application code deploy is bad but **database schema is unchanged**.

### 2. Git revert + push (source-of-truth fix)

1. `git revert <bad-commit>` on `master` (or revert merge commit)
2. G0 locally: `npm run check && npm test`
3. `git push origin master` → Release workflow redeploys known-good code

Preferred when the fix is a clear code regression and trunk history should reflect rollback.

### 3. Database migration caution

| Situation | Action |
|-----------|--------|
| **Forward-only migration already applied** | Do **not** assume git revert alone fixes DB state; plan forward migration or manual SQL with user approval |
| **Migration not yet applied to production** | Revert code before deploy; safe |
| **Destructive migration** | Guarded path only; backup / maintenance window; test on staging equivalent first |

**Rule:** App Hosting rollback does **not** reverse SQL migrations. Coordinate schema rollback separately with user.

---

## Incident / emergency deploy

For production outage or critical hotfix when normal gates are too slow:

1. **Prefer:** Fix forward on `master` with minimal diff; push; let G1→G2→G3 run.
2. **Emergency skip E2E:** Actions → **Release** → **Run workflow** → enable **Skip E2E** (`workflow_dispatch` input). Use **rarely**; document reason in commit message and chat.
3. **Local deploy:** `npm run deploy:firebase` only if Actions unavailable; document in chat.
4. **Post-incident:** Update `DELIVERY_METRICS.md` row; review whether guarded path should have applied.

---

## Coordinator approval triggers

Escalate to coordinator (or user) **before** push to `master` when:

| Trigger | Required action |
|---------|-----------------|
| High-risk classification | Guarded path checklist in [RELEASE_PIPELINE.md](./RELEASE_PIPELINE.md) |
| New or changed SQL migration | Run `npm test -- src/lib/infrastructure/db/migrations.test.ts`; apply migration to production DB before or as part of deploy plan |
| Auth / session changes | Full E2E locally; confirm E2E agent coverage adequate |
| Infra YAML (workflow, `apphosting.yaml`) | Pipeline agent review; no double deploy sources |
| Secrets rotation or new secret | User sets Firebase Secret Manager; never commit values |
| Skip E2E or bypass gate | Explicit user approval; log in delivery metrics |
| Concurrent agents touching deploy paths | Check [OWNERSHIP.md](./OWNERSHIP.md) and [MERGE_QUEUE.md](./MERGE_QUEUE.md) |

---

## Policy meta

This document satisfies the rule: **no direct production deployment until deployment policy is documented**. Policy is now in effect; pipeline and coordinator agents should treat it as authoritative and keep it updated when workflow or infra changes.
