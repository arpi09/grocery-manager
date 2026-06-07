# Skaffu

**Skanna först. Håll koll på skafferiet. Handla smart.**

[skaffu.com](https://skaffu.com) — live produkt för svenska hushåll: delat lager i kyl, frys och skafferi, kvitto-AI, smart inköpslista och veckoplan. Intern repo heter fortfarande `home-pantry`.

> **Portfolio / intervju:** Case study med arkitektur, beslut och ärliga metrics — [`docs/CASE_STUDY_SKAFFU.md`](docs/CASE_STUDY_SKAFFU.md).  
> Byggt som solo-produkt med PMF-disciplin (Head of Dev: prioritering, metrics, launch) och senior fullstack-leverans (hexagonal arkitektur, ~690 tester, deploy E2E-gate).

## Highlights

| Område | Detalj |
|--------|--------|
| **Prod** | [skaffu.com](https://skaffu.com) — SvelteKit SSR, Firebase App Hosting, PostgreSQL |
| **Arkitektur** | Domain → application → infrastructure → routes; ports/adapters, `di.ts` composition root |
| **AI** | Kvitto, foto, recept, smart fill — rate limits + månadstak per plan |
| **Kvalitet** | Testing diamond (~620 unit, ~72 integration, ~23 E2E); axe mobile + desktop |
| **Leverans** | CI G0→G3, deploy blockerad av E2E; agent coordinator (WIP 3) |
| **PMF** | `/admin` dashboard, veckocron, medvetet väntande Stripe/Capacitor |

## Tech stack

- **Frontend:** SvelteKit 2, Svelte 5, PWA (install + web push)
- **Backend:** SvelteKit server routes & actions, Lucia auth, Drizzle ORM
- **Database:** PostgreSQL (Neon/Supabase/Cloud SQL; PGlite lokalt)
- **AI:** OpenAI (vision + text), guardrailad via `AiRateLimitService`
- **Infra:** Firebase App Hosting, Resend (e-post), GitHub Actions CI/CD
- **Test:** Vitest, Playwright, `@axe-core/playwright`

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (for PostgreSQL and optional full-stack run)
- Git (optional, for GitHub)

## Quick start (development)

1. Start the database:

```bash
docker compose up db -d
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Install dependencies and migrate:

```bash
npm install
npm run db:migrate
```

4. Run the app (auto-restart on `.env` / DB / hooks changes):

```bash
npm run dev:watch
```

Or start the **AI worktree** from this repo:

```bash
npm run dev:start:ai
```

Health check (server should be running):

```bash
npm run dev:health
```

**AI coordinator:** roles, WIP, and agent spawn rules — [`docs/CURSOR_COORDINATOR.md`](docs/CURSOR_COORDINATOR.md) (plus local `private/NEW_CURSOR_AGENT_START.md` for environment and cost tracking).

Open [http://localhost:5173](http://localhost:5173), create an account, and start adding items.

### Shared household (local dev)

On startup the app seeds a default household **Hemmet** when `USE_PGLITE=true` (or after `npm run db:migrate` with Postgres):

1. Copy `.env.example` to `.env` and set passwords (never commit `.env`):

```bash
ADMIN_PASSWORD=your-admin-password
DEFAULT_MEMBER_PASSWORD=your-member-password
```

2. Sign in as admin (`ADMIN_EMAIL`, default `arvid.pilhall@me.com`) or the member (`DEFAULT_MEMBER_EMAIL`, default `amanda.derborn@hotmail.com`). **Use the same password as in `.env`** (`ADMIN_PASSWORD` / `DEFAULT_MEMBER_PASSWORD`). On each dev-server start, those env values are hashed into the database (overwriting any previous hash for that email). If login fails after a PGlite reset or merge, check that `.env` matches what you type—not an old password from before you changed `.env`.
3. Open **Settings** to see household name and members. Both accounts see the same inventory.

Other users get a personal household **Mitt hushåll** on first login until invited (invite flow is not in v1).

## Barcode scanning (mobile)

On **Add item** (`/item/new`), use **Scan barcode** on a phone or tablet to fill in product details from the barcode (via [Open Food Facts](https://world.openfoodfacts.org/)). On desktop, the button is disabled; hover it to see why.

You can also switch scan mode to **Photo** in Add item. This uploads a product photo and uses OpenAI vision to prefill fields (always review before saving).

- **PC / Cursor:** `npm run dev` → **http://localhost:5173**
- **iPhone (barcode camera):** `npm run dev:https` → **https://YOUR_LAN_IP:5173** (accept the security warning in Safari; camera does not work on plain `http://`)

## AI recipe suggestions

A centered floating **Recipe ideas** button appears on app pages. It generates recipe suggestions from your current inventory.

1. Create an API key in your OpenAI account.
2. Add it to `.env`:

```bash
OPENAI_API_KEY=your_key_here
```

3. Open the app and tap **Recipe ideas**.

Photo product scan (`/api/product-from-image`) also uses the same `OPENAI_API_KEY`. In production, set the Firebase App Hosting secret and grant access to backend `home-pantry` (see [docs/FIREBASE_DEPLOY.md](./docs/FIREBASE_DEPLOY.md)).

## Smart shopping list (Inköp)

Open **Inköp** in the top navigation for the shared household list and **Fyll på från skafferiet** — AI suggests items from your inventory, expiry dates, and meal plan via `/api/shopping-suggestions` and adds them to the list.

Uses the same `OPENAI_API_KEY` as recipes and photo scan.

## Meal planner calendar

Open **Planer** in the top navigation to manage planned meals in a calendar view.

- Add meals directly on any date
- Edit or delete existing planned meals
- See generated ChatGPT recipe ideas and add them to a calendar date

## Full stack with Docker

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

> Run migrations inside the app container on first deploy, or run `npm run db:migrate` locally against the same `DATABASE_URL` before starting the app.

## End-to-end tests (Playwright)

Browser tests use **Playwright** — it is **free and open source**. You do **not** need a paid Playwright account or cloud subscription.

**One-time setup** (in this worktree):

```powershell
npm ci
npx playwright install chromium
copy ..\\home-pantry\\.env .env   # needs ADMIN_EMAIL + ADMIN_PASSWORD for login tests
```

**Run** (starts `npm run dev` automatically unless port 5173 is already in use):

```powershell
npm run test:e2e
npm run test:e2e:ui      # optional visual debugger (still free)
```

Tests cover login redirect, admin sign-in, `/admin`, and navigation to Inköp / Planer. See `AGENTS-E2E.md` for the E2E agent charter.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript / Svelte check |
| `npm run lint` | ESLint |
| `npm test` | Vitest test suite |
| `npm run test:integration` | Integration tests (service + repository + real PGlite DB) |
| `npm run test:e2e` | Playwright browser tests |
| `npm run test:e2e:ui` | Playwright UI mode (debug) |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Generate migrations from schema |
| `npm run deploy:firebase` | Deploy to Firebase App Hosting |
| `npm run deploy:firebase:dry` | Preview Firebase deploy (dry run) |

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for layers, SOLID boundaries, and Atomic Design conventions. Portfolio deep-dive: [docs/CASE_STUDY_SKAFFU.md](docs/CASE_STUDY_SKAFFU.md).

## Documentation

| Doc | Purpose |
|-----|---------|
| [CASE_STUDY_SKAFFU.md](docs/CASE_STUDY_SKAFFU.md) | Portfolio case study (strategy + architecture) |
| [ROADMAP.md](docs/ROADMAP.md) | Product phases and PMF gates |
| [CODE_QUALITY_AUDIT.md](docs/CODE_QUALITY_AUDIT.md) | Architecture and quality snapshot |
| [FIREBASE_DEPLOY.md](docs/FIREBASE_DEPLOY.md) | Production deploy |

## Manual test checklist

- [ ] Register a new account
- [ ] Sign out and sign back in
- [ ] Add items to fridge, freezer, and cupboard
- [ ] Search items on a location page
- [ ] Edit an item (name, location, quantity, expiry)
- [ ] Delete an item
- [ ] Dashboard shows correct counts and expiring items (within 7 days)
- [ ] Two users in the same household see the same inventory (admin + default member)
- [ ] Users in different households do not see each other's items

## GitHub

Initialize git locally (if not already), create a repo on GitHub, and push:

```bash
git init
git add .
git commit -m "Initial Skaffu app"
git remote add origin https://github.com/YOUR_USER/home-pantry.git
git push -u origin main
```

CI runs lint, check, test, and build on push/PR (see `.github/workflows/ci.yml`).

## Production (Firebase)

Deploy to **Firebase App Hosting** with PostgreSQL (Neon, Supabase, or Cloud SQL). See **[docs/FIREBASE_DEPLOY.md](./docs/FIREBASE_DEPLOY.md)** for first deploy, migrations, secrets, and the GitHub Actions pipeline (`deploy-firebase.yml`).

**Live:** [https://skaffu.com](https://skaffu.com)
