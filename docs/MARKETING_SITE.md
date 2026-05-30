# Marketing site (v1)

Public information pages for Home Pantry, served from the same SvelteKit app as the product. Visitors see marketing content without logging in; CTAs link to `/login` (or the configured app URL).

## Architecture

**Route group `(marketing)`** at the site root — option B from the product brief:

| Path | Page |
|------|------|
| `/` | Landing (value prop, features preview, steps, CTA) |
| `/funktioner` | Features |
| `/sa-fungerar-det` | How it works (3 steps) |
| `/faq` | FAQ stub + contact email |

The authenticated app dashboard moved from `/` to **`/hem`**. All other app routes (`/scan`, `/inkop`, `/inventory/…`, etc.) are unchanged.

Why this approach:

- **Zero extra deploy** — same Firebase App Hosting build and pipeline (`release.yml` → `npm run build` → `firebase deploy --only apphosting:home-pantry`).
- **Shared brand tokens** — reuses `src/app.css` and `docs/BRAND.md` (kitchen green `#3d6b4f`, warm background).
- **Clean separation** — marketing uses `(marketing)/+layout.svelte` (header/footer, light theme); app uses `AppLayout` with nav shell.

### Key files

```
src/routes/(marketing)/          # Public marketing pages
src/routes/(app)/hem/            # Logged-in dashboard (was /)
src/lib/marketing/               # Copy, routes, app URL helper
src/lib/components/marketing/    # Header, footer, cards, CTA
src/lib/navigation/app-home.ts   # APP_HOME_PATH = '/hem'
src/hooks.server.ts              # Marketing paths are public; authed users → /hem
```

## Run locally

Same dev server as the app:

```bash
npm run dev
```

| URL | What you see |
|-----|----------------|
| http://localhost:5173/ | Marketing landing |
| http://localhost:5173/funktioner | Features |
| http://localhost:5173/sa-fungerar-det | How it works |
| http://localhost:5173/faq | FAQ |
| http://localhost:5173/login | App login |
| http://localhost:5173/hem | App dashboard (requires login) |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PUBLIC_APP_URL` | Optional. Base URL for “Öppna appen” / “Logga in” when marketing and app are on **different domains**. Defaults to production hosted URL when unset on server; uses same origin in dev. |
| `PUBLIC_ORIGIN` | Existing — canonical origin for emails/CSRF (unchanged). |

Example for split domains later:

```bash
# Marketing at https://homepantry.com, app at Firebase hosted URL
PUBLIC_APP_URL=https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app
```

CTAs then point to `PUBLIC_APP_URL/login`. When unset, CTAs use relative `/login` (same deployment).

## Deploy

No pipeline changes. Push to `main`/`master` as today — marketing pages ship with the SSR build.

```bash
npm run check
npm run build
npm run deploy:firebase   # or CI deploy job
```

## Custom domain: homepantry.com

Two practical options:

### A. Single domain (simplest)

Point **homepantry.com** (and `www`) to the existing Firebase App Hosting backend in [Firebase Console → App Hosting → Custom domains](https://console.firebase.google.com/).

- `/` → marketing landing  
- `/login`, `/hem`, `/scan`, … → app  
- One SSL cert, one deploy, path-based routing only.

### B. Split domains (marketing vs app)

| Domain | Serves |
|--------|--------|
| `homepantry.com` | Marketing (this repo, `(marketing)` routes only) |
| `app.homepantry.com` or current `*.hosted.app` | Full app |

Requires either:

1. **Two Firebase App Hosting backends** (or Hosting + App Hosting) with separate builds/env, plus `PUBLIC_APP_URL` on the marketing site, or  
2. **Reverse proxy / CDN rules** routing `/login`, `/hem`, `/api/*`, etc. to the app backend and `/`, `/funktioner`, … to marketing.

For v1, **option A** is recommended: one custom domain, minimal ops.

## i18n

Copy lives in `src/lib/marketing/content.ts` with Swedish (`sv`) as primary. English (`en`) is stubbed for a future locale switch on marketing pages (app i18n unchanged).

## SEO

Landing page (`/`) sets `<title>`, `description`, Open Graph, and Twitter card meta tags in `(marketing)/+page.svelte`.

## Auth / public paths

`hooks.server.ts` treats marketing paths as public (no redirect to `/login`). Logged-in users visiting marketing URLs are redirected to `/hem`.
