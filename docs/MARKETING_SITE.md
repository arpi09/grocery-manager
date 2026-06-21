# Marketing site (v1)

Public information pages for **Skaffu**, served from the same SvelteKit app as the product. Visitors see marketing content without logging in; CTAs link to `/login` (or the configured app URL).

## Architecture

**Route group `(marketing)`** at the site root — option B from the product brief:

| Path | Page |
|------|------|
| `/` | Landing (value prop, features preview, steps, CTA) |
| `/funktioner` | Features |
| `/sa-fungerar-det` | How it works (3 steps) |
| `/faq` | FAQ stub + contact email |
| `/guider` | SEO guides hub (public, indexable) |
| `/guider/[slug]` | Individual guide articles from `content/guides/sv/*.md` **and** published DB rows (`guide_article`) |

The authenticated app dashboard moved from `/` to **`/hem`**. All other app routes (`/scan`, `/inkop`, `/inventory/…`, etc.) are unchanged.

Why this approach:

- **Zero extra deploy** — same Firebase App Hosting build and pipeline (`deploy.yml` → `npm run build` → `firebase deploy --only apphosting:home-pantry`).
- **Shared brand tokens** — reuses `src/app.css` and `docs/BRAND.md` (kitchen green `#2c4a3e`, warm background).
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
| http://localhost:5173/guider | SEO guides hub |
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

**`https://skaffu.com`** (canonical; legacy `*.hosted.app` redirects after deploy)

- `/` → marketing landing  
- `/login`, `/hem`, `/scan`, … → app  
- Set `PUBLIC_ORIGIN` and `ORIGIN` to `https://skaffu.com` (in `apphosting.yaml`).  
- Leave `PUBLIC_APP_URL` unset so CTAs use relative `/login`.  
- Marketing `canonical` / `og:url` meta tags use `PUBLIC_ORIGIN` via `src/lib/marketing/app-url.ts`.

## Custom domain: skaffu.com

> **Live (jun 2026).** Brand and canonical URL: **`https://skaffu.com`**. See [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md) for DNS, www redirect and post-cutover checks.

**Full setup guide:** [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) · [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md)

### A. Single domain (current)

**skaffu.com** (and `www` → apex redirect) points to Firebase App Hosting backend **home-pantry** — same path layout as today.

Production env:

```bash
PUBLIC_ORIGIN=https://skaffu.com
ORIGIN=https://skaffu.com
```

Leave `PUBLIC_APP_URL` unset so CTAs use relative `/login`.

### B. Split domains (marketing vs app) — not used today

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
| **a** (default) | “Skaffu — handla ihop med koll på skafferiet” | `http://localhost:5173/` |
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

## Guider vs Nyheter (two content tracks)

| Track | URL | Audience | Indexed |
|-------|-----|----------|---------|
| **Guider (SEO)** | `/guider`, `/guider/[slug]` | All visitors | Yes — sitemap + Article JSON-LD |
| **Nyheter (changelog)** | `/nyheter` | Logged-in product users | No — `robots.txt` disallow |

- Marketing nav links to **Guider** (`/guider`), not `/nyheter`.
- Landing `/` shows **Senaste guider** (up to 3 cards) — not a full blog feed in the hero.
- Guide markdown lives in `content/guides/sv/*.md` with frontmatter (`title`, `description`, `date`, `keywords`, `published`).
- **Admin-published guides** live in Postgres (`guide_article`) and merge with filesystem guides in `src/lib/marketing/guides.server.ts` (DB wins on slug conflict). No deploy needed to publish from prod admin.

### Admin campaign: guide + LinkedIn (prod)

| Step | Where |
|------|--------|
| Generate pair | `/admin?tab=social` → **Generera artikel + LinkedIn-inlägg** → `POST /api/admin/marketing-campaigns/generate` |
| Preview draft | `/admin/guide-preview/[id]` (admin-only) |
| Approve | Form actions `approveGuide` + existing `approveSocialPost` |
| Publish site | `publishGuide` → article appears on `/guider/{slug}` |
| Publish LinkedIn | `publishSocialPost` (after guide is live) |

Requires `OPENAI_API_KEY` in prod (same as cron). LinkedIn UTM: `utm_campaign=guide_link`, `utm_content={slug}`. Core generation: `src/lib/marketing/generate-guide-article.server.ts`.

Marketing footer includes [Skaffu on LinkedIn](https://www.linkedin.com/company/skaffu) and [Facebook Page](https://www.facebook.com/profile.php?id=100066978903320) via `footer.socialLinks` in `content.ts`. Facebook assets: [`docs/FACEBOOK_PAGE.md`](./FACEBOOK_PAGE.md); generate with `npm run generate:facebook`.

### AI-assisted guide pipeline

| Step | Command / file |
|------|----------------|
| Generate draft | `npm run guides:generate -- --keyword 0` (needs `OPENAI_API_KEY`) |
| Next in queue | `npm run guides:publish-next` — picks first keyword without a `.md` file **or** DB slug (`--next --publish`) |
| SVT news gate | `src/lib/marketing/guide-news-context.ts` — fetches SVT Nyheter RSS; when no Skaffu-relevant headline, continues keyword-only (no skip) |
| Content rules | `src/lib/marketing/guide-generation-rules.ts` — documented editorial policy for prompts |
| Quality checklist | `src/lib/marketing/guide-quality.ts` — min 800 words, internal links, forbidden phrases |
| Publish | Set `published: true` in frontmatter after manual review, or pass checklist via `--publish` |

Drafts default to `published: false`. `--publish` sets `published: true` only when the checklist passes. Do not mass-publish without spot-checking kvitto/butik claims.

#### AI content policy

| Rule | Detail |
|------|--------|
| Tone | Professional Swedish for practical households; butiksneutralt, not clickbait |
| Topics | Food, pantry, shopping, food waste, prices, expiry dates, receipts, meal planning |
| Forbidden | Fabricated facts/quotes/stats, medical/nutrition advice beyond basic food safety, politics, crime/celebrity news, conspiracy angles, competitor defamation |
| News tie-in | Cron fetches [SVT Nyheter RSS](https://www.svt.se/nyheter/rss.xml) before generation. **No relevant headline → keyword-only** (`news_not_relevant`, generation continues). Attribute cautiously ("enligt rapportering …") without invented quotes |
| RSS failure | Log warning, fall back to keyword-matrix-only generation (no news hook) |
| Local override | `--skip-news-check` bypasses the SVT gate for manual runs |

Quality checks reject a small maintainable list of forbidden phrases (pricing guarantees, conspiracy-adjacent wording, unsupported medical claims). See `GUIDE_FORBIDDEN_PHRASES` in `guide-quality.ts`.

Keyword queue helpers live in `src/lib/marketing/guides.ts`: `slugForGuideKeyword`, `resolveNextGuideKeywordIndex`, and `GUIDE_KEYWORD_MATRIX` (6 rows from COMPETITIVE_ANALYSIS §10). When all six guides exist, the cron exits quietly — expand the matrix (or add `GUIDE_KEYWORD_MATRIX_EXTRA`) before the queue runs dry.

### Scheduled guide generation (GitHub Actions)

Workflow: [`.github/workflows/guides-generate-cron.yml`](../.github/workflows/guides-generate-cron.yml)

| Aspect | Detail |
|--------|--------|
| Schedule | Monday + Thursday 07:00 UTC (~09:00 CET) |
| Manual run | Actions → **Guides generate cron** → `workflow_dispatch` |
| Secret | `OPENAI_API_KEY` (repo → Settings → Secrets → Actions) |
| PR label | `seo-guide` |
| Branch | `guides/auto/{slug}` |

**Flow:** `npm run guides:publish-next` → SVT news relevance check (optional hook) → `npm test` + `npm run check` → commit `content/guides/sv/{slug}.md` → open PR for review. **Guider = PR — merga för att synas på `/`.** Skips only when the keyword queue is empty or a branch/PR for that slug already exists.

**Human review before merge:** spot-check kvitto/butik claims; the checklist does not catch factual errors.

### Auto-deploy after guide merge

[`deploy.yml`](../.github/workflows/deploy.yml) also triggers on `push` to `master` when paths under `content/guides/**` change.

| Commit type | Deploy |
|-------------|--------|
| Guide-only merge (`content/guides/**` only) | Full pipeline auto-runs (quality → e2e → Firebase) |
| Mixed commit (guides + code) | Auto-deploy **skipped** — run manual **Deploy to production** |
| Feature release (no guide paths) | Manual **Deploy to production** as today |

Requires existing `FIREBASE_TOKEN` secret. Sitemap picks up new slugs via `getPublishedGuideSitemapEntries` after deploy.

### Guide analytics

| Event | When | Metadata |
|-------|------|----------|
| `guide_view` | Guide page load (server, consent-gated) | `slug` |
| `register_click` | CTA from guide | `slug`, `source: guide` |

Guide CTAs append `utm_campaign=seo-guide&utm_content={slug}` to `/register`.

### Reviews and social proof on `/`

**Policy (current):** No star ratings, `AggregateRating` JSON-LD, or fabricated testimonials on the landing page. PMF is not proven at low volume; fake reviews undermine the honest comparison positioning.

**Later (after real interviews):** Optional “Vad beta-testare säger” with 2–3 quotes — written consent, first name + city only. Implement only when the owner has real interview transcripts; never AI-generated quotes.

Keep the comparison table (Bring / ICA / Matdags) as positioning-based social proof until then.

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
| `/guider` | `content.guidesHub.meta` |
| `/guider/[slug]` | Guide frontmatter + `Article` JSON-LD |
| `/login`, `/register` | i18n `auth.*.metaDescription` |

Keywords in Swedish copy include **skafferi-app** and **minska matsvinn**. English locale mirrors meta where pages are bilingual (cookie-based locale on same URL).

### Technical SEO

| URL | Purpose |
|-----|---------|
| `/sitemap.xml` | Dynamic sitemap — marketing paths + published `/guider/[slug]` (not `/hem`, not `/nyheter`) |
| `/robots.txt` | Allow `/`; disallow `/admin`, `/api/`, `/hem`, `/settings`, `/inventory`, `/inkop`, `/planer`, `/statistik`, `/scan`, `/profile`, `/item`, `/husdjur`, `/invite`, `/install-app`, `/logout`; `Sitemap:` points to canonical origin |

OG image: `/og-skaffu.png` (1200×630; regenerate from SVG with `npm run generate:og-image`). Absolute URL via `PUBLIC_ORIGIN`, with `?v=` cache-bust (`OG_IMAGE_VERSION` in `src/lib/seo/seo.ts`). Use PNG — LinkedIn does not preview SVG `og:image`. After deploy, refresh LinkedIn cache via [Post Inspector](https://www.linkedin.com/post-inspector/) (see [LINKEDIN_LAUNCH.md](./LINKEDIN_LAUNCH.md)).

PWA manifest (`static/manifest.webmanifest`): name/description aligned with Skaffu brand.

### USER_LOCAL — Google Search Console & www (product owner)

These steps are **not in repo** but critical after domain cutover and 301 redirect deploy. Track in [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md).

| Step | Action |
|------|--------|
| 1 | **www → apex:** Finish Firebase TXT for `www.skaffu.com` or Cloudflare Redirect Rule (301 to `https://skaffu.com`). |
| 2 | **Google Search Console:** Add property `https://skaffu.com`, verify via DNS TXT in Cloudflare. |
| 3 | **Submit sitemap:** `https://skaffu.com/sitemap.xml`. |
| 4 | **URL inspection:** Request indexing of `/`, `/funktioner`, `/skafferi-app`. |
| 5 | **Legacy hosted.app:** After 301 deploy, in GSC → legacy property → remove outdated URLs or wait for re-crawl. |
| 6 | **Turnstile:** Add `skaffu.com` (+ `www`) to widget hostnames ([`CAPTCHA.md`](./CAPTCHA.md)). |
| 7 | **Social:** LinkedIn/Facebook profiles link to `https://skaffu.com` (strengthens brand entity). |

Brand search for “skaffu” often takes **2–6 weeks** after domain change even with correct SEO — 301 + GSC accelerates.

### App routes (noindex)

Authenticated routes (`/hem`, `/inventory/*`, `/inkop`, `/admin`, etc.) get sensible `<title>` tags but `robots: noindex, nofollow` via `AppSeoHead`.

## Community launch UTM

When visitors land with standard UTM query params (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), marketing layout CTAs forward them to `/login` and `/register`. See [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) for channel links and naming.

## Auth / public paths

`hooks.server.ts` treats marketing paths as public (no redirect to `/login`). Logged-in users visiting marketing URLs are redirected to `/hem`.
