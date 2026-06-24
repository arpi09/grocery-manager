# Cloud agent setup — Skaffu

> **Active (2026-06):** Use `npm run setup:agent` + `npm run quick:dev` on Linux/cloud. Coordinator workflow: [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md).

**Verdict: PARTIAL — usable for implementation agents, not for full-stack dev or deploy.**

Project Cursor hooks in [`.cursor/hooks.json`](../.cursor/hooks.json) are intentionally empty for agent speed — release safety lives in rules/skills only.

Skaffu is cloud-ready for the same work CI proves on `ubuntu-latest`: lint, typecheck, unit tests, PGlite integration tests, and production build. Cloud agents should mirror the **quality** job in [`.github/workflows/reusable-quality.yml`](../.github/workflows/reusable-quality.yml), not local PowerShell dev-runtime, Firebase deploy, or production smoke.

| Cloud safe | Cloud risky | Local only |
|------------|-------------|------------|
| Lint, check, unit/integration tests, build guards | Playwright E2E, `docker compose`, long-running dev | Firebase deploy, prod smoke, Cloud SQL migrate, real OpenAI |

**Node:** use **Node 24** (match [`.nvmrc`](../.nvmrc)). The repo [`Dockerfile`](../Dockerfile) exists for container deploys but is **not** the primary cloud-agent path — prefer `npm ci` + PGlite on the host.

---

## Bootstrap

`npm run cloud:bootstrap` and `npm run setup:agent` both run [`scripts/setup-agent.mjs`](../scripts/setup-agent.mjs) (cross-platform).

```bash
# Node 24 — match .nvmrc
npm ci && npm run setup:agent
npm run dev
```

PGlite applies migrations at runtime via `initDatabase()` — `npm run db:migrate` is optional for local PGlite dev.

**Windows note:** `dev:start:*` is PowerShell-only. Linux/cloud agents use `npm run dev` / `dev:watch` directly.

---

## Script matrix

| Script | Scope | Target time | When to run |
|--------|-------|-------------|-------------|
| `quick:dev` | lint + locales + server-imports + unit tests | ~2–3 min | **Default** during implementation |
| `quick:marketing` | `quick:dev` + `landing-variants.test.ts` | ~3 min | Marketing / landing copy |
| `pr:gate` | CI parity without audit | ~8–12 min | **Before claiming done** |
| `deploy:fast` | `pr:gate` + critical E2E + pre-deploy smoke | ~15–25 min | Low-risk pre-prod |
| `test:e2e:critical` | `@deploy-critical` tests only | ~5–8 min | Deploy-fast lane |
| `test:e2e:full` | Full Playwright suite | ~15–25 min | Core-loop / release:full |
| `ci:path-tier` | Path classification script | ~1 s | Debugging gating |
| `quality:ci` | Full CI + audit | ~8–15 min | With audit |
| `release:gate` | Alias for `quality:ci` | ~8–15 min | Coordinator sign-off |
| `nightly` | E2E + fixtures + audit | ~45+ min | Scheduled only |

**Agent defaults:** `npm run quick:dev` during edits; `npm run pr:gate` when done. Do not run full E2E unless assigned.

See [RELEASE_MODEL.md](./RELEASE_MODEL.md) and [CI_CD.md](./CI_CD.md).

---

## CI parity gate

```bash
npm run pr:gate
```

**Success criterion:** same bar as **`pr-gate / pr-gate`**.

---

## Optional E2E

```bash
npm run test:e2e:critical   # deploy:fast lane
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

See also [INDEX.md](./INDEX.md) for coordinator skills and prod reality, and [CURSOR_COORDINATOR.md](./CURSOR_COORDINATOR.md#coordinator-planning) for execution modes.
