# Security report

**Last scanned:** 2026-05-30 (initial Security agent read-only scan)

**Scope:** Repo state at deploy candidate **`master`** (recent commits include e2e Turnstile fix `661a372`, pipeline alignment `f1d37aca`; prior tip referenced `26ba088` in delivery metrics). **Uncommitted local work** (including this security program) is **not on the deploy candidate until pushed**.

**Related:** [SECURITY_DEPLOYMENT_CHECKLIST.md](./SECURITY_DEPLOYMENT_CHECKLIST.md) · [DEPENDENCY_HEALTH.md](./DEPENDENCY_HEALTH.md) · [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md)

---

## Executive summary

| Field | Value |
|-------|-------|
| **Security status** | Mixed — strong auth/API baseline; open dependency and hardening gaps |
| **Risk level** | **Medium–high** (runtime dependency advisory + missing CI audit gate) |
| **Deploy candidate** | `master` @ ~`661a372` / `f1d37aca` (per recent trunk history; verify SHA at push time) |
| **Deploy** | **blocked** |

**Rationale:** Unapproved **high** severity `drizzle-orm` advisory affects production SQL paths. `npm audit` is not a release pipeline gate. Coordinator or human owner must approve an exception or schedule ORM upgrade before G3.

---

## Findings

### F01 — OpenAI API routes require authenticated session

- **Severity:** low (remediated)
- **Affected files:** `src/lib/server/api-guards.ts`, `src/routes/api/recipes/+server.ts`, `src/routes/api/product-from-image/+server.ts`, `src/routes/api/receipt/parse/+server.ts`, `src/routes/api/ica-shopping-list/+server.ts`, `src/routes/api/inventory-insights/+server.ts`
- **Description:** All OpenAI-backed POST handlers call `requireUser(locals)` and `requireOpenAiKey()` before processing.
- **Exploit/risk scenario:** Unauthenticated callers could burn OpenAI quota or exfiltrate AI features without this guard.
- **Recommended fix:** None — maintain pattern on new API routes.
- **Blocks deployment:** no
- **Required owner/agent:** E2E / API owners on new routes

---

### F02 — `drizzle-orm` SQL identifier escaping advisory (GHSA-gpj5-g38j-94v9)

- **Severity:** high
- **Affected files:** `package.json`, `package-lock.json`, `src/lib/infrastructure/db/**`, all Drizzle query paths
- **Description:** Locked `drizzle-orm@0.39.3`; npm audit reports **high** advisory; fix available at ≥ 0.45.2 (major bump). Documented in `DEPENDENCY_HEALTH.md`.
- **Exploit/risk scenario:** Crafted identifiers in dynamic SQL paths could lead to SQL injection depending on query construction patterns.
- **Recommended fix:** Coordinator assigns impl agent: upgrade `drizzle-orm` + `drizzle-kit`, run integration/migration tests, re-audit.
- **Blocks deployment:** **yes** (high — requires explicit approval to waive)
- **Required owner/agent:** Coordinator → implementation agent (DB owner)

---

### F03 — No `npm audit` in CI release pipeline

- **Severity:** medium
- **Affected files:** `.github/workflows/release.yml`, `RELEASE_PIPELINE.md`
- **Description:** G1 `quality` job runs lint, check, test, integration, build — but not `npm audit`. Dependency regressions can reach production undetected.
- **Exploit/risk scenario:** New commit or lockfile change introduces critical vuln; green CI still deploys.
- **Recommended fix:** Pipeline agent adds non-blocking or blocking audit step; Security agent gates on `DEPENDENCY_HEALTH.md` until then.
- **Blocks deployment:** no (alone); contributes to **needs review** posture
- **Required owner/agent:** Pipeline / Release agent

---

### F04 — Cloudflare Turnstile on registration (production-safe skip)

- **Severity:** low (remediated with ops dependency)
- **Affected files:** `src/routes/register/+page.server.ts`, `src/lib/server/captcha.ts`, `src/lib/components/molecules/TurnstileWidget.svelte`, `docs/CAPTCHA.md`, `apphosting.yaml`
- **Description:** Registration verifies Turnstile token; `TURNSTILE_SKIP` bypass works only outside production; production ignores skip even if set.
- **Exploit/risk scenario:** Without Turnstile keys in Firebase, registration fails closed (not open bot signup).
- **Recommended fix:** Confirm `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in App Hosting before first prod deploy.
- **Blocks deployment:** no (if secrets configured); **needs review** if prod keys unverified
- **Required owner/agent:** Human owner (Firebase secrets)

---

### F05 — Resend email API key from environment only

- **Severity:** low (remediated)
- **Affected files:** `src/lib/server/email.ts`, `.env.example`, `apphosting.yaml` (if `RESEND_API_KEY` added)
- **Description:** `getResendApiKey()` reads `RESEND_API_KEY` from SvelteKit private env; no hardcoded keys in source. Tests use `re_test` mocks only.
- **Exploit/risk scenario:** Committed API key would allow email abuse and credential leak.
- **Recommended fix:** Keep key in Secret Manager; rotate on leak.
- **Blocks deployment:** no
- **Required owner/agent:** Human owner

---

### F06 — Session auth gate and admin route protection

- **Severity:** low (remediated)
- **Affected files:** `src/hooks.server.ts`, `src/lib/server/session.ts`, `src/lib/server/auth.ts`, `src/lib/infrastructure/auth/lucia.ts`
- **Description:** Unauthenticated users redirected to `/login` except public paths (`/login`, `/register`, `/invite/*`, `/api/health`). `/admin` requires `isAdmin(user)`. Session cookies: `secure` in production, `sameSite: 'lax'`.
- **Exploit/risk scenario:** Missing gate would expose household inventory and admin panels.
- **Recommended fix:** Re-run E2E auth/admin specs on auth changes.
- **Blocks deployment:** no
- **Required owner/agent:** Auth-area implementation agent on changes

---

### F07 — Open user registration (no invite-only mode)

- **Severity:** medium
- **Affected files:** `src/routes/register/**`, `src/lib/application/auth.service.ts`, `src/hooks.server.ts`
- **Description:** Any visitor can register with email/password (+ Turnstile in prod). No env flag to disable registration for private deployments.
- **Exploit/risk scenario:** Account sprawl, reconnaissance, resource consumption on a household-private app.
- **Recommended fix:** Optional `REGISTRATION_DISABLED` or invite-only policy if product requires closed signup.
- **Blocks deployment:** no (product decision)
- **Required owner/agent:** Coordinator → implementation agent if closed signup required

---

### F08 — No application-level rate limiting on auth or API

- **Severity:** medium
- **Affected files:** `src/routes/login/**`, `src/routes/register/**`, `src/routes/api/**`, `src/hooks.server.ts`
- **Description:** No login/register/API rate limits in app code. `express-rate-limit` appears only as transitive dependency in lockfile, unused in SvelteKit handlers.
- **Exploit/risk scenario:** Credential stuffing, registration spam, OpenAI route abuse despite session auth.
- **Recommended fix:** Add edge or middleware rate limits (login, register, `/api/*`); consider Firebase/App Hosting limits.
- **Blocks deployment:** no
- **Required owner/agent:** Coordinator → implementation agent

---

### F09 — Missing security headers (CSP, HSTS, X-Frame-Options)

- **Severity:** medium
- **Affected files:** `src/hooks.server.ts`, `svelte.config.js` (no global headers configured)
- **Description:** No Content-Security-Policy, Strict-Transport-Security, or frame-ancestors headers set in application hooks.
- **Exploit/risk scenario:** Increased XSS impact, clickjacking on admin/settings pages, no explicit HSTS at app layer (may rely on hosting).
- **Recommended fix:** Add response headers in `handle` or hosting config; start with report-only CSP.
- **Blocks deployment:** no
- **Required owner/agent:** Pipeline or implementation agent

---

### F10 — CSRF / canonical origin for form actions

- **Severity:** low (configuration-dependent)
- **Affected files:** `.env.example`, `apphosting.yaml`, `src/lib/server/origin.ts`, `docs/FIREBASE_DEPLOY.md`
- **Description:** SvelteKit adapter-node requires matching `ORIGIN` at runtime for form POST CSRF. Documented; misconfiguration causes 403 on login/actions.
- **Exploit/risk scenario:** Wrong `ORIGIN` breaks CSRF protection or blocks legitimate users; must match live HTTPS URL.
- **Recommended fix:** Verify `ORIGIN` and `PUBLIC_ORIGIN` equal production URL before deploy (checklist item).
- **Blocks deployment:** no (if configured correctly)
- **Required owner/agent:** Human owner / Pipeline agent

---

### F11 — Household invite token security

- **Severity:** low (remediated)
- **Affected files:** `src/lib/application/household.service.ts`, `src/routes/invite/[token]/**`, `src/lib/infrastructure/db/schema.ts`
- **Description:** Tokens generated with `randomBytes(32).toString('base64url')`; 7-day expiry; accept requires authenticated user with matching email; owner-only create/revoke.
- **Exploit/risk scenario:** Weak tokens or missing email check would allow unauthorized household access.
- **Recommended fix:** None for current design; consider single-use invalidation audit logging for high-security deployments.
- **Blocks deployment:** no
- **Required owner/agent:** Shared household agent on changes

---

### F12 — File upload limits on receipt and product-image APIs

- **Severity:** low (partial hardening)
- **Affected files:** `src/routes/api/receipt/parse/+server.ts` (8 MB), `src/routes/api/product-from-image/+server.ts` (6 MB)
- **Description:** Both require auth; enforce `image/*` MIME prefix and max size. No magic-byte validation beyond browser-reported type.
- **Exploit/risk scenario:** Large uploads could stress memory/OpenAI costs; MIME spoofing could send non-image payloads to vision models.
- **Recommended fix:** Optional file-type sniffing; stricter per-user quotas.
- **Blocks deployment:** no
- **Required owner/agent:** AI / scan implementation agent

---

### F13 — Admin password seeding on startup

- **Severity:** medium (operational)
- **Affected files:** `src/lib/infrastructure/db/seed-admin.ts`, `apphosting.yaml`, `docs/FIREBASE_DEPLOY.md`
- **Description:** `ensureDefaultAdminUser()` creates or **updates** admin password hash when `ADMIN_PASSWORD` env is set on every startup.
- **Exploit/risk scenario:** Predictable seed password in prod if not rotated; env change unexpectedly resets admin password.
- **Recommended fix:** Rotate `ADMIN_PASSWORD` after first login; document that unset password skips create with warning only.
- **Blocks deployment:** no (if strong secret in Secret Manager)
- **Required owner/agent:** Human owner

---

### F14 — Public DB health endpoint

- **Severity:** low
- **Affected files:** `src/routes/api/health/db/+server.ts`, `src/hooks.server.ts` (public path exception)
- **Description:** `GET /api/health/db` is unauthenticated; returns `{ ok, backend, userFound }` without sensitive rows (query uses nonexistent email).
- **Exploit/risk scenario:** Reveals DB backend type (`pglite` vs `postgres`) and connectivity to scanners.
- **Recommended fix:** Restrict to internal network, auth, or strip backend detail in production.
- **Blocks deployment:** no
- **Required owner/agent:** Pipeline / implementation agent

---

### F15 — CI E2E uses `TURNSTILE_SKIP=true` (appropriate)

- **Severity:** low (accepted)
- **Affected files:** `.github/workflows/release.yml`, `playwright.config.ts`
- **Description:** E2E job sets `TURNSTILE_SKIP: 'true'` for CI only — matches `captcha.ts` non-production bypass. Not injected into G3 deploy env.
- **Exploit/risk scenario:** None in CI; would be critical if skip applied to production build.
- **Recommended fix:** None — keep skip CI-local; verify production build does not set `TURNSTILE_SKIP`.
- **Blocks deployment:** no
- **Required owner/agent:** E2E / Pipeline agent

---

### F16 — No committed secrets in repository scan

- **Severity:** low (remediated)
- **Affected files:** `.gitignore`, `.env.example`, docs (placeholders only)
- **Description:** `.env` and `.env.*` gitignored; grep for live key patterns found only test mocks and documentation placeholders. `apphosting.yaml` uses secret references, not values.
- **Exploit/risk scenario:** Committed `.env` or API keys would force immediate rotation and block all deploys.
- **Recommended fix:** Maintain pre-commit / CI secret scanning; never commit `.env`.
- **Blocks deployment:** no
- **Required owner/agent:** Human owner; Security agent on each scan

---

### F17 — Lucia auth library deprecated

- **Severity:** medium (maintenance)
- **Affected files:** `src/lib/infrastructure/auth/lucia.ts`, `package.json`, `DEPENDENCY_HEALTH.md`
- **Description:** Lucia v3 ecosystem marked deprecated; auth centralized but migration is a large project.
- **Exploit/risk scenario:** No immediate CVE; future lack of patches for auth-critical code.
- **Recommended fix:** Plan auth migration epic; monitor advisories.
- **Blocks deployment:** no
- **Required owner/agent:** Coordinator (long-term)

---

## Deploy candidate status

| Item | Detail |
|------|--------|
| **Candidate branch** | `master` |
| **Recent commits (reported)** | `661a372` (e2e Turnstile fix), `f1d37aca` (pipeline) |
| **Uncommitted work** | Security agent program files — **not on candidate until pushed** |
| **Gate result** | **blocked** |
| **Waivable blockers** | F02 (`drizzle-orm` high) — requires documented coordinator/human approval |
| **Checklist** | [SECURITY_DEPLOYMENT_CHECKLIST.md](./SECURITY_DEPLOYMENT_CHECKLIST.md) — dependency scan item fails until F02 resolved or approved |

---

## Notes for coordinator

- Invoke Security agent **before every push to `master`** that triggers G3; link status in `AGENT_STATUS.md` when deploy is planned.
- **F02** should route: Dependency Health (already documented) → coordinator → DB owner implementation agent.
- **F03** pipeline gap: request Pipeline agent add audit step to G1.
- Security agent does **not** implement fixes; assigns via coordinator only.
