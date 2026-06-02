# PWA — Home Pantry

## Stack

- **`@vite-pwa/sveltekit`** — service worker + web manifest at build time
- **`static/manifest.webmanifest`** — static fallback for hosts/CDN; production manifest is also emitted by the plugin
- **Brand colours:** `theme_color` `#3d6b4f`, `background_color` `#f7f5f0` (see `src/app.css` / BRAND)
- **Icons:** `static/pwa/icon.svg` (source) → PNG via `npm run generate:pwa-icons` — `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180×180 for iOS). Browser tab uses `static/favicon.svg` (same Skaffu mark).

## Dev vs production

| Environment | Service worker |
|-------------|----------------|
| `npm run dev` | **Off** (`devOptions.enabled: false` in `vite.config.ts`) — avoids stale cache while developing |
| `npm run build` + `npm run preview` / Firebase | **On** — precaches client assets; `static/push-sw.js` handles push via Workbox `importScripts`; `registerType: 'autoUpdate'` |

Registration runs in `src/routes/+layout.svelte` via `virtual:pwa-register` (client only).

SvelteKit’s built-in service worker registration is disabled in `svelte.config.js` (`kit.serviceWorker.register: false`).

## User-facing install UX

- **Guide:** `/install-app` (`InstallAppGuide.svelte`) — iOS Safari + Android Chrome steps, `beforeinstallprompt` CTA when supported
- **Settings:** Inställningar → *Lägg till på hemskärmen*
- **Home:** dismissible banner on `/hem` for mobile browsers not in `display-mode: standalone` (90-day dismiss TTL; tracks `pwa_banner_dismiss` / `pwa_banner_install_click` in `product_event`)
- **Marketing FAQ:** `/faq` — install question (SV + EN)

## Firebase App Hosting

Static assets under `static/` (manifest, favicon) are deployed with the app. No extra hosting config required.

## Web Push (v1)

Browser notifications for weekly expiry reminders — opt-in under **Inställningar → Webbläsarnotiser**, alongside email reminders.

### Env vars

| Variable | Where | Purpose |
|----------|-------|---------|
| `PUBLIC_VAPID_PUBLIC_KEY` | Client + server | VAPID public key |
| `VAPID_PRIVATE_KEY` | Server only | Signs push payloads |
| `VAPID_CONTACT` | Server (optional) | VAPID subject; defaults to `PUBLIC_ORIGIN` |

Generate keys: `npx web-push generate-vapid-keys`

Push requires **HTTPS** in production (or `npm run dev:https` locally). Service worker is off in plain `npm run dev`.

### Trigger

Same as email expiry digest:

- **Cron:** `POST /api/cron/expiry-reminders` with `Authorization: Bearer $CRON_SECRET` (e.g. GitHub Actions Monday 08:00 UTC)
- **Login fallback:** best-effort check on sign-in (same 7-day interval per user)

Uses the email reminder window (3 or 7 days) when email reminders are enabled; push-only users default to 7 days until they also enable email (shared `expiry_reminder_days` column).

Optional **Shop today** push: opt-in under **Inställningar → Handla idag** (requires browser notifications). Daily cron `POST /api/cron/shopping-push` (GitHub Actions 06:00 UTC) when the user has unchecked shopping-list items.

### Limitations vs native push (Capacitor / App Store)

| | Web Push (PWA) | Native push |
|--|----------------|-------------|
| **iOS** | Only when installed to home screen (iOS 16.4+); not in Safari tab | Full background delivery via APNs |
| **Android** | Chrome/Edge installed or tab (varies) | FCM, richer actions |
| **Desktop** | Supported in Chromium browsers | N/A unless desktop app |
| **Delivery** | Requires active subscription + SW; stale endpoints pruned on 410 | Token-based, OS-managed |
| **Dev** | SW disabled in dev; use `build` + `preview` or `dev:https` | Requires native build |

See [ROADMAP.md](./ROADMAP.md) Fas 1 — native push comes after Capacitor spike.
