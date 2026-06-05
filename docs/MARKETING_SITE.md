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

- **Zero extra deploy** — same Firebase App Hosting build and pipeline (`deploy.yml` → `npm run build` → `firebase deploy --only apphosting:home-pantry`).
- **Shared brand tokens** — reuses `src/app.css` and `docs/BRAND.md` (kitchen green `#3d6b4f`, warm background).
- **Clean separation** — marketing uses `(marketing)/+layout.svelte` (header/footer, light theme); app uses `AppLayout` with nav shell.

### Key files

```
src/routes/(marketing)/          # Public marketing pages
src/routes/(app)/hem/            # Logged-in dashboard (was /)
src/lib/marketing/               # Copy, landing-variants, routes, app URL helper
src/lib/components/marketing/    # Header, footer, cards, CTA, ComparisonTable
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
| `PUBLIC_ORIGIN` | Canonical origin for emails, CSRF, and marketing SEO (`canonical`, `og:url`). **Production:** `https://skaffu.com`. **Dev:** `http://localhost:5173`. |
| `PUBLIC_LANDING_VARIANT` | Optional. `a` or `b` — default hero when no `?hero=` or cookie (see Landing hero A/B). |

Example for split domains later (not used today — single hosted.app deploy):

```bash
# Marketing at homepantry.com (future — domän ej kopplad än), app at Firebase hosted URL
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

## Production URL (current)

Marketing and app share one Firebase App Hosting deploy:

**`https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app`**

- `/` → marketing landing  
- `/login`, `/hem`, `/scan`, … → app  
- Set `PUBLIC_ORIGIN` and `ORIGIN` to the URL above (already in `apphosting.yaml`).  
- Leave `PUBLIC_APP_URL` unset so CTAs use relative `/login`.  
- Marketing `canonical` / `og:url` meta tags use `PUBLIC_ORIGIN` via `src/lib/marketing/app-url.ts` (fallback: hosted.app constant in code).

## Custom domain: homepantry.com (future, optional)

> **Domän ej kopplad än.** Brand name *homepantry.com* appears in copy and vision docs; live traffic uses `*.hosted.app` until DNS is attached.

**Full setup guide (when you own the domain):** [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) — DNS, SSL, env vars, and post-cutover checks.

### A. Single domain (recommended when custom domain goes live)

Point **homepantry.com** (and `www`) to Firebase App Hosting backend **home-pantry** — same path layout as today on hosted.app.

After the domain is connected, set in production:

```bash
PUBLIC_ORIGIN=https://homepantry.com
ORIGIN=https://homepantry.com
```

Leave `PUBLIC_APP_URL` unset so CTAs use relative `/login`.

### B. Split domains (marketing vs app)

| Domain | Serves |
|--------|--------|
| `homepantry.com` | Marketing (future — domän ej kopplad än) |
| `app.homepantry.com` or current `*.hosted.app` | Full app (today: hosted.app URL above) |

Requires either:

1. **Two Firebase App Hosting backends** (or Hosting + App Hosting) with separate builds/env, plus `PUBLIC_APP_URL` on the marketing site, or  
2. **Reverse proxy / CDN rules** routing `/login`, `/hem`, `/api/*`, etc. to the app backend and `/`, `/funktioner`, … to marketing.

For v1 today, **one hosted.app URL** is enough; custom domain is optional later.

## Landing hero A/B (item #8)

Hero copy has two variants for lightweight testing:

| Variant | Angle | How to preview |
|---------|--------|----------------|
| **a** (default) | “Skanna först — slipp gissa vad som finns hemma” | `http://localhost:5173/` |
| **b** | “Butiksneutralt skafferi för hela hushållet” | `http://localhost:5173/?hero=b` |

**Resolution order:** `?hero=a|b` (also writes cookie `landing_variant` for 90 days) → cookie → `PUBLIC_LANDING_VARIANT` → `a`.

```bash
# Force variant B for all visitors (e.g. staging)
PUBLIC_LANDING_VARIANT=b
```

Files:

- `src/lib/marketing/landing-variants.ts` — hero A/B copy (sv/en)
- `src/routes/(marketing)/+page.server.ts` — variant resolution + cookie
- `src/routes/(marketing)/+page.svelte` — hero + jämförelse-sektion (Bring / ICA / Matdags)
- `src/lib/components/marketing/ComparisonTable.svelte` — comparison table

The comparison block uses honest copy from `docs/COMPETITIVE_ANALYSIS.md` (section 4 + messaging). Anchor: `/#jamforelse`.

### Measuring hero A/B conversion

Events land in `product_event` with metadata `{ "variant": "a"|"b" }`:

| Event | When |
|-------|------|
| `landing_view` | Server-side on `/` load (once per 30 min session per variant) |
| `register_click` | Client click on “Prova gratis” / register CTA |
| `signup_complete` | Successful `/register` action |

**Evaluate weekly** (same cadence as [PMF_WEEKLY.md](./PMF_WEEKLY.md)): compare signup rate (`signup_complete / landing_view`) and register-click rate per variant. Example SQL against prod:

```sql
SELECT
  metadata::json->>'variant' AS variant,
  event_type,
  COUNT(*) AS events
FROM product_event
WHERE event_type IN ('landing_view', 'register_click', 'signup_complete')
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1, 2;
```

Pick the winner when one variant has materially higher signup rate with comparable traffic (roughly ≥100 views per arm). Tie or low volume → keep default `a`.

## i18n

Copy lives in `src/lib/marketing/content.ts` with Swedish (`sv`) as primary. English (`en`) mirrors comparison and shared sections. Hero A/B strings live in `landing-variants.ts`.

## SEO

Canonical URLs, Open Graph, Twitter cards, and JSON-LD use **`PUBLIC_ORIGIN`** via `src/lib/marketing/app-url.ts` (production: `https://skaffu.com`).

### Shared components

| File | Role |
|------|------|
| `src/lib/components/seo/MarketingSeoHead.svelte` | Marketing pages: title, description, canonical, hreflang sv/en, OG/Twitter, optional JSON-LD |
| `src/lib/components/seo/AuthSeoHead.svelte` | `/login`, `/register` — indexable with light meta |
| `src/lib/components/seo/AppSeoHead.svelte` | App shell via `AppLayout` — per-route titles, `noindex` on private routes |
| `src/lib/seo/seo.ts` | Sitemap entries, robots rules, OG image path, landing JSON-LD helpers |

### Indexable pages (marketing + auth)

| Path | Meta source |
|------|-------------|
| `/` | `content.meta` + WebApplication & Organization JSON-LD |
| `/funktioner` | `content.features.meta` |
| `/sa-fungerar-det` | `content.howItWorks.meta` |
| `/faq` | `content.faq.meta` |
| `/priser` | `pricing-content.ts` meta |
| `/privacy` | `privacy-content.ts` meta |
| `/login`, `/register` | i18n `auth.*.metaDescription` |

Keywords in Swedish copy include **skafferi-app** and **minska matsvinn**. English locale mirrors meta where pages are bilingual (cookie-based locale on same URL).

### Technical SEO

| URL | Purpose |
|-----|---------|
| `/sitemap.xml` | Dynamic sitemap — `/`, `/funktioner`, `/sa-fungerar-det`, `/faq`, `/priser`, `/privacy`, `/login`, `/register` (not `/hem`) |
| `/robots.txt` | Allow `/`; disallow `/admin`, `/api/`, `/hem`, `/settings`, `/inventory`, `/inkop`, `/planer`, `/statistik`, `/scan`, `/profile`, `/item`, `/husdjur`, `/invite`, `/install-app`, `/logout`; `Sitemap:` points to canonical origin |

OG image: `/og-skaffu.png` (1200×630; regenerate from SVG with `npm run generate:og-image`). Absolute URL via `PUBLIC_ORIGIN`, with `?v=` cache-bust (`OG_IMAGE_VERSION` in `src/lib/seo/seo.ts`). Use PNG — LinkedIn does not preview SVG `og:image`. After deploy, refresh LinkedIn cache via [Post Inspector](https://www.linkedin.com/post-inspector/) (see [LINKEDIN_LAUNCH.md](./LINKEDIN_LAUNCH.md)).

PWA manifest (`static/manifest.webmanifest`): name/description aligned with Skaffu brand.

### App routes (noindex)

Authenticated routes (`/hem`, `/inventory/*`, `/inkop`, `/admin`, etc.) get sensible `<title>` tags but `robots: noindex, nofollow` via `AppSeoHead`.

## Community launch UTM

When visitors land with standard UTM query params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), marketing layout CTAs forward them to `/login` and `/register`. See [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) for channel links and naming.

## Auth / public paths

`hooks.server.ts` treats marketing paths as public (no redirect to `/login`). Logged-in users visiting marketing URLs are redirected to `/hem`.
