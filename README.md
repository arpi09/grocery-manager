# Home Pantry

A simple home grocery inventory app: track what you have in the **fridge**, **freezer**, and **cupboard**. Each account has its own private inventory.

Built with **SvelteKit**, **PostgreSQL**, **Lucia** auth, and **Docker**.

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

Open [http://localhost:5173](http://localhost:5173), create an account, and start adding items.

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

Photo product scan also uses the same `OPENAI_API_KEY`.

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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript / Svelte check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Generate migrations from schema |

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for layers, SOLID boundaries, and Atomic Design conventions.

## Manual test checklist

- [ ] Register a new account
- [ ] Sign out and sign back in
- [ ] Add items to fridge, freezer, and cupboard
- [ ] Search items on a location page
- [ ] Edit an item (name, location, quantity, expiry)
- [ ] Delete an item
- [ ] Dashboard shows correct counts and expiring items (within 7 days)
- [ ] Second account cannot see the first account's items

## GitHub

Initialize git locally (if not already), create a repo on GitHub, and push:

```bash
git init
git add .
git commit -m "Initial Home Pantry app"
git remote add origin https://github.com/YOUR_USER/home-pantry.git
git push -u origin main
```

CI runs lint, check, test, and build on push/PR (see `.github/workflows/ci.yml`).
