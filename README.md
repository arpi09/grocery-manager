<p align="center">
  <img src="static/favicon.svg" width="72" height="72" alt="Skaffu" />
</p>

<h1 align="center">Skaffu</h1>

<p align="center">
  Shared household grocery planning — plan the week, shop together on one list,
  and keep a pantry that knows what's running out.
</p>

<p align="center">
  Production PWA · live at <a href="https://skaffu.com">skaffu.com</a> · internal repo name <code>home-pantry</code>
</p>

---

Skaffu is a full-stack TypeScript web app (installable PWA) for Swedish households. This README covers what it does, how it's built, and how to run it locally.

## What it does

- **Shared shopping list** — one weekly list the whole household shares, including guest check-off without an account.
- **Pantry with expiry** — fridge/freezer/pantry inventory with eat-first prioritization so food gets used in time.
- **Receipt & scan capture** — a receipt photo is parsed by AI vision into structured items you review before saving; barcode and photo add too.
- **Weekly meal planning** — dinner ideas from what's already at home, one tap into the plan and onto the shopping list.

More detail: [`docs/features/`](docs/features/) · [case study](docs/CASE_STUDY_SKAFFU.md).

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | SvelteKit 2, Svelte 5 (runes), TypeScript, PWA (install + web push) |
| **Backend** | SvelteKit server routes & form actions, Lucia auth (Argon2), Drizzle ORM |
| **Database** | PostgreSQL (Cloud SQL / Neon / Supabase) · PGlite for local & tests |
| **AI** | OpenAI (vision + text) for receipt parsing and suggestions |
| **Native** | Capacitor (iOS / Android) |
| **Infra** | Firebase App Hosting · Resend (email) · GitHub Actions |
| **Quality** | Vitest · Playwright · ESLint · svelte-check · axe |

## Architecture

Hexagonal / layered — business rules stay framework-agnostic; the database, AI provider, email, and billing sit behind ports.

```
src/
  routes/              SvelteKit routes — pages, server endpoints, form actions
  lib/
    domain/            Business rules & types (no framework, no I/O)
    application/       Use-cases / services + ports (interfaces)
    infrastructure/    Adapters — DB repositories, external providers
    components/        UI, Atomic Design (atoms → molecules → organisms)
    i18n/              sv / en localization
e2e/                   Playwright end-to-end specs
docs/                  Architecture, codebase map, feature docs
```

Full write-up: [ARCHITECTURE.md](ARCHITECTURE.md) · file-level map: [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 24+ (matches [`.nvmrc`](.nvmrc)); [Docker](https://www.docker.com/) optional (only needed for a real PostgreSQL).

**Quick start** — uses PGlite, so there's no database to set up:

```bash
npm ci
npm run setup:agent   # one-time local config
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**With PostgreSQL (optional):**

```bash
docker compose up db -d
cp .env.example .env
npm install && npm run db:migrate
npm run dev:watch
```

**Logging in locally:** copy `.env.example` to `.env` and set the household passwords (`ADMIN_PASSWORD`, `DEFAULT_MEMBER_PASSWORD`), then sign in with the matching emails from `.env.example` (defaults `admin@example.com` / `member@example.com`). More setup notes: [docs/ONBOARDING_DEVELOPER.md](docs/ONBOARDING_DEVELOPER.md).

## Testing & quality

| Command | Purpose |
|---------|---------|
| `npm run quick:dev` | Fast local gate — lint, i18n, unit tests |
| `npm run pr:gate` | Full pre-merge parity — integration + build guards |
| `npm run test:e2e` | Playwright end-to-end suite |

The project runs ~340 test files (1,500+ tests) on Vitest and 28 Playwright specs, all against PGlite so no external database is needed. Every pull request is gated on `pr-gate`, and core-loop changes additionally require a green E2E run. CI is path-aware — fast checks on each PR, then sharded E2E and post-deploy smoke before a release. See [docs/CI_CD.md](docs/CI_CD.md).

## Documentation

| Doc | Contents |
|-----|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, ports & adapters, SOLID, Atomic Design |
| [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md) | Feature → routes → key files |
| [docs/CASE_STUDY_SKAFFU.md](docs/CASE_STUDY_SKAFFU.md) | Product & architecture case study |
| [docs/AI_TOOLING.md](docs/AI_TOOLING.md) | AI-assisted development workflow (Cursor / Claude Code) |
| [docs/README.md](docs/README.md) | Full documentation index |

## Security

Responsible disclosure only — please follow [SECURITY.md](.github/SECURITY.md), and don't open public issues with exploit details before a response.

## License

Copyright © 2026 Arvid Pilhall. All rights reserved. See [LICENSE](LICENSE).
