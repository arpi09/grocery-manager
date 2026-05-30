# PWA — Home Pantry

## Stack

- **`@vite-pwa/sveltekit`** — service worker + web manifest at build time
- **`static/manifest.webmanifest`** — static fallback for hosts/CDN; production manifest is also emitted by the plugin
- **Brand colours:** `theme_color` `#3d6b4f`, `background_color` `#f7f5f0` (see `src/app.css` / BRAND)
- **Icons:** `static/favicon.svg` (192 / 512 in manifest)

## Dev vs production

| Environment | Service worker |
|-------------|----------------|
| `npm run dev` | **Off** (`devOptions.enabled: false` in `vite.config.ts`) — avoids stale cache while developing |
| `npm run build` + `npm run preview` / Firebase | **On** — precaches client assets; `registerType: 'autoUpdate'` |

Registration runs in `src/routes/+layout.svelte` via `virtual:pwa-register` (client only).

SvelteKit’s built-in service worker registration is disabled in `svelte.config.js` (`kit.serviceWorker.register: false`).

## User-facing install UX

- **Guide:** `/install-app` (`InstallAppGuide.svelte`) — iOS Safari + Android Chrome steps, `beforeinstallprompt` CTA when supported
- **Settings:** Inställningar → *Lägg till på hemskärmen*
- **Home:** dismissible banner on `/hem` for mobile browsers not in `display-mode: standalone`
- **Marketing FAQ:** `/faq` — install question (SV + EN)

## Firebase App Hosting

Static assets under `static/` (manifest, favicon) are deployed with the app. No extra hosting config required.
