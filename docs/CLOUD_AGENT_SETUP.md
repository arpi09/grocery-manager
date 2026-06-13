# Cloud agent setup — Skaffu

**Verdict: PARTIAL — usable for implementation agents, not for full-stack dev or deploy.**

Skaffu is cloud-ready for the same work CI proves on `ubuntu-latest`: lint, typecheck, unit tests, PGlite integration tests, and production build. Cloud agents should mirror the **quality** job in [`.github/workflows/reusable-quality.yml`](../.github/workflows/reusable-quality.yml), not local PowerShell dev-runtime, Firebase deploy, or production smoke.

**Cloud Handoff Protocol:** Manual Cloud agents are orchestrated via [AGENT_DISPATCH_LOG.md](./AGENT_DISPATCH_LOG.md). Append the [Standard Cloud Agent Prompt Footer](./AGENT_DISPATCH_LOG.md#standard-cloud-agent-prompt-footer) to every `MANUAL_CLOUD_AGENT` prompt. Coordinator owns prod SHA and deploy — see [hard rules](./AGENT_DISPATCH_LOG.md#hard-rules).

| Cloud safe | Cloud risky | Local only |
|------------|-------------|------------|
| Lint, check, unit/integration tests, build guards | Playwright E2E, `docker compose`, long-running dev | Firebase deploy, prod smoke, Cloud SQL migrate, real OpenAI |

**Node:** use **Node 24** (match [`.nvmrc`](../.nvmrc)). The repo [`Dockerfile`](../Dockerfile) exists for container deploys but is **not** the primary cloud-agent path — prefer `npm ci` + PGlite on the host.

---

## Bootstrap (copy-paste)

```bash
# Node 24 — match .nvmrc
npm run cloud:bootstrap
```

Or manually:

```bash
cp .env.example .env   # skip if .env already exists
# Ensure .env contains at minimum:
# USE_PGLITE=true
# PUBLIC_ORIGIN=http://localhost:5173
# ADMIN_PASSWORD=cloud-agent-dev
# EMAIL_SENDING_DISABLED=true

npm ci
```

PGlite applies migrations at runtime via `initDatabase()` — `npm run db:migrate` is optional for local PGlite dev.

**Windows note:** `cloud:bootstrap` is a bash script. Cloud agents run Linux/bash. On Windows, use Git Bash or WSL for bootstrap; day-to-day quality gates work via `npm run quality:ci` in any shell.

---

## Script matrix

| Script | Scope | Target time | When to run |
|--------|-------|-------------|-------------|
| `quick:dev` | lint + locales + server-imports + **unit tests only** | ~2–3 min | **Default** during implementation |
| `quick:marketing` | `quick:dev` + `landing-variants.test.ts` | ~3 min | Marketing / landing copy changes |
| `quality:integration` | PGlite integration suite (`USE_PGLITE=true`) | ~5–8 min | DB, routes, or migration work |
| `quality:ci` | Full CI parity (lint → check → unit → fixtures → integration → build → bundle guard) | ~8–15 min | **Before claiming done** / pre-merge |
| `release:gate` | Alias for `quality:ci` — same bar as deploy G1b | ~8–15 min | Coordinator sign-off, deploy prep |
| `nightly` | E2E + receipt fixtures + `npm audit` (audit warn-only) | ~45+ min | Scheduled / explicit assignment only |

**Agent defaults:** run `npm run quick:dev` after substantive edits. Run `npm run quality:ci` (or `release:gate`) only when the task is complete. Do **not** run `test:e2e` or `nightly` unless explicitly assigned — slow and flaky on cloud.

See [ENGINEERING_HEALTH.md](./ENGINEERING_HEALTH.md) for audit snapshot and Top 10 tracker.

---

## CI parity gate (run before claiming done)

Same steps as the CI **quality** job (skips optional `npm audit`):

```bash
npm run quality:ci
```

Equivalent manual sequence:

```bash
export PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
export USE_PGLITE=true
npm run lint
npm run check:locales
npm run check:server-imports
npm run check
npm test
npm run test:receipt-fixtures
npm run test:integration
DATABASE_URL=postgresql://pantry:pantry@localhost:5432/pantry npm run build
npm run check:client-bundle
```

**Success criterion:** all commands exit 0 — same bar as CI `quality / quality`.

---

## Optional E2E (risky — slow, flaky)

Only when explicitly assigned. Needs Chromium install and ~15–20 min runtime.

```bash
export USE_PGLITE=true ADMIN_EMAIL=e2e-admin@example.com ADMIN_PASSWORD=e2e-ci-password
export TURNSTILE_SKIP=true TURNSTILE_BYPASS=true E2E_MOCK_AI=true EMAIL_VERIFICATION_SKIP=true
npx playwright install chromium
npm run test:e2e
```

---

## Required env vars (cloud minimum)

| Var | Value | Why |
|-----|-------|-----|
| `USE_PGLITE` | `true` | Embedded Postgres — no Docker DB |
| `PUBLIC_ORIGIN` | `http://localhost:5173` | SSR, CSRF, canonical URLs |
| `ADMIN_PASSWORD` | any strong string (e.g. `cloud-agent-dev`) | Seeded admin login when exploring the app |
| `PUBLIC_TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` (Cloudflare test key) | `npm run check` and `npm run build` |
| `EMAIL_SENDING_DISABLED` | `true` | No accidental outbound email |

Bootstrap sets these only when missing — existing `.env` secrets are never overwritten.

---

## Linux dev (not PowerShell dev-runtime)

Cloud/Linux agents must **not** use `npm run dev:watch` or `dev:start:ai` — those are PowerShell worktree scripts.

```bash
USE_PGLITE=true npm run dev
```

Vite serves on `http://localhost:5173` with PGlite and auto-seed when `ADMIN_PASSWORD` is set.

---

## Forbidden tasks for cloud agents

Do **not** assign these without explicit user request:

- Production deploy (`npm run deploy:firebase`, deploy workflow)
- Prod URL smoke (`npm run smoke:prod-auth`, `scripts/smoke-prod-urls.sh`)
- Cloud SQL migrate (`scripts/db-migrate-cloudsql.ps1`) — GCP credentials required
- Setting real `OPENAI_API_KEY`, Stripe, or Resend keys unless testing those integrations
- Firebase / GCP secret setup scripts (`setup-*-secrets.ps1`)
- Assuming `dev:watch` / `dev:start:ai` work on Linux cloud
- Manual mobile barcode/camera flows
- Founder seed or prod household manipulation

---

## Cloud-safe task types

- Lint, locale encoding, server-import guards, svelte-check, client-bundle guard
- Unit tests (`npm test`)
- Integration tests (`USE_PGLITE=true npm run test:integration`)
- Domain / application refactors with tests
- i18n copy (with `check:locales`)
- Schema + migration + repository work (PGlite tests)
- Receipt fixture validation (`test:receipt-fixtures`)
- Docs-only changes

See also [INDEX.md](./INDEX.md) for coordinator skills and prod reality, and [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md#cloud-handoff-protocol) for execution modes and coordinator sync.
