<p align="center">
  <img src="static/favicon.svg" width="72" height="72" alt="Skaffu" />
</p>

# Skaffu

**Gemensam veckohandel med matkoll** — [skaffu.com](https://skaffu.com)

Skaffu hjälper svenska hushåll hålla koll på mat hemma: delad inköpslista, skafferi med utgångsdatum, kvitto-AI och veckoplan. Intern repo heter fortfarande `home-pantry`.

## Om produkten

- **Delad inköpslista** — gemensam veckohandel för hela hushållet
- **Skafferi & utgång** — kyl, frys och skafferi med eat-first-prioritering
- **Kvitto & scan** — AI-kvitto, streckkod och foto för snabb inmatning

Produkt- och feature-detaljer: [`docs/features/`](docs/features/) · [ONBOARDING_DEVELOPER.md](docs/ONBOARDING_DEVELOPER.md)

## Tech stack

| Lager | Teknik |
|-------|--------|
| **Frontend** | SvelteKit 2, Svelte 5, PWA (install + web push) |
| **Backend** | SvelteKit server routes & actions, Lucia auth, Drizzle ORM |
| **Database** | PostgreSQL (Neon/Supabase/Cloud SQL; PGlite lokalt) |
| **AI** | OpenAI (vision + text), rate limits per plan |
| **Infra** | Firebase App Hosting, Resend, GitHub Actions |

Arkitektur: [ARCHITECTURE.md](ARCHITECTURE.md) — domain → application → infrastructure → routes.

## Kom igång

**Förutsättningar:** [Node.js](https://nodejs.org/) 24+ (match [`.nvmrc`](.nvmrc)), valfritt [Docker](https://www.docker.com/) för PostgreSQL.

**Zero-config (rekommenderat):**

```bash
npm ci && npm run setup:agent && npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173).

**PostgreSQL via Docker** (valfritt — standard dev använder PGlite):

```bash
docker compose up db -d
cp .env.example .env
npm install && npm run db:migrate
npm run dev:watch
```

**Delat hushåll (lokal dev):** kopiera `.env.example` till `.env`, sätt `ADMIN_PASSWORD` och `DEFAULT_MEMBER_PASSWORD`. Logga in med `ADMIN_EMAIL` / `DEFAULT_MEMBER_EMAIL` enligt `.env.example` (defaults: `admin@example.com` / `member@example.com`).

**Utvecklare / Cursor:** starta i [`AGENTS.md`](AGENTS.md) → [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) → [`docs/CURRENT_REALITY.md`](docs/CURRENT_REALITY.md).

## Test & kvalitet

| Kommando | Syfte |
|----------|--------|
| `npm run quick:dev` | Snabb G0 — lint, locales, unit (~2–3 min) |
| `npm run pr:gate` | Pre-merge CI-paritet (integration + build guards) |
| `npm run test:e2e` | Playwright (kräver `ADMIN_*` i `.env`) |

CI: tiered **`pr-gate / pr-gate`** på PR — se [docs/CI_CD.md](docs/CI_CD.md). E2E-setup: [docs/E2E.md](docs/E2E.md).

## Dokumentation

| Doc | Innehåll |
|-----|----------|
| [docs/README.md](docs/README.md) | Dokumentationsindex |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Lager, SOLID, Atomic Design |
| [docs/FIREBASE_DEPLOY.md](docs/FIREBASE_DEPLOY.md) | Prod-deploy, secrets |
| [docs/CASE_STUDY_SKAFFU.md](docs/CASE_STUDY_SKAFFU.md) | Case study (strategi + arkitektur) |

## Säkerhet

Rapportera sårbarheter enligt [SECURITY.md](.github/SECURITY.md) — **publicera inte** issues med exploit-detaljer före svar.

## GitHub Social preview (valfritt)

För repo-kort på GitHub: **Settings → General → Social preview** — ladda upp [`static/og-skaffu.png`](static/og-skaffu.png) (samma bild som LinkedIn/OG).

## Copyright

Copyright © 2026 Arvid Pilhall. All rights reserved. Se [LICENSE](LICENSE).
