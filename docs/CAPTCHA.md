# CAPTCHA (Cloudflare Turnstile)

Home Pantry uses [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) on **user registration** only. Turnstile is free for normal site usage, privacy-friendly, and usually invisible or low-friction for real users.

## Create keys (free)

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **Turnstile** → **Add site**.
3. Choose **Managed** widget type and add **every hostname** that serves `/register` (domain whitelist — missing hostnames break prod). Use the **exact hostname** from the browser address bar (no `https://`, no path). Production today uses **only these two** hostnames:

   | Hostname | When users hit it |
   |----------|-------------------|
   | `localhost` | Local dev |
   | `home-pantry--home-pantry-4bee5.europe-west4.hosted.app` | Firebase App Hosting (current production URL) |

   **Cloudflare Console steps:** Turnstile → your widget → **Settings** → **Hostname Management** → **Add Hostnames** → paste each row above → **Save**. Changes apply within ~1 minute (hard-refresh `/register` after).

   Common mistake: adding only `hosted.app` (partial) instead of the **full** hostname above — Turnstile matches the exact host only.

   **Future (optional):** after `homepantry.com` is connected in Firebase, add `homepantry.com` and `www.homepantry.com` to the same widget — see [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md). That domain is **not** live today.
4. Copy the **Site key** and **Secret key** (pair must belong to the same widget).

If a hostname is missing, Turnstile returns error **110200** (invalid domain): the widget label appears, a red *Captcha kunde inte laddas för den här webbadressen* message shows, and submit is disabled. Browser console: `[turnstile] Widget error: 110200`. Inspect `data-turnstile-error-code="110200"` on the error line.

If the widget loads but submit fails with *Captcha verifierades inte*, the **secret key** does not match the site key widget — re-copy both keys from the same Turnstile widget and update `TURNSTILE_SECRET_KEY` + `PUBLIC_TURNSTILE_SITE_KEY`, then redeploy.

## Local development

Add to `.env` (never commit `.env`):

```bash
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

Without keys, registration is **blocked** (fail closed) with a clear *Captcha is not configured* message and submit disabled. For local dev without Turnstile, add:

```bash
TURNSTILE_SKIP=true
```

`TURNSTILE_SKIP` is ignored in production even if set.

## Cloudflare test mode (CI / manual)

Cloudflare provides [dummy sitekeys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) that work on any domain:

| Purpose | Site key | Secret key |
|---------|----------|------------|
| Always pass | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Always fail | `2x00000000000000000000AB` | `2x0000000000000000000000000000000BB` |
| Forces interactive challenge | `3x00000000000000000000FF` | `3x0000000000000000000000000000000FF` |

Constants: `TURNSTILE_TEST_SITE_KEY` / `TURNSTILE_TEST_SECRET_KEY` in `src/lib/server/captcha.ts`.

**CI / E2E:** Playwright and GitHub Actions set `TURNSTILE_SKIP=true` and `TURNSTILE_BYPASS=true` so registration tests do not need the widget. Unit tests include one live `siteverify` call against the always-pass test secret.

## Production (Firebase App Hosting)

1. Set the public site key in `apphosting.yaml` (`PUBLIC_TURNSTILE_SITE_KEY`, BUILD + RUNTIME) or Firebase Console → **App Hosting → Environment**. SvelteKit needs it at **build** and **runtime**.
2. Store the secret:

```bash
npx firebase apphosting:secrets:set TURNSTILE_SECRET_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess TURNSTILE_SECRET_KEY --backend home-pantry --project home-pantry-4bee5
```

`apphosting.yaml` references `TURNSTILE_SECRET_KEY` as a runtime secret. After hostname or key changes, **redeploy** (Release workflow or `npm run deploy:firebase`).

## User-facing copy (i18n)

| Key | SV | EN |
|-----|----|----|
| `auth.register.captchaLabel` | Bekräfta att du inte är en robot | Confirm you are not a robot |
| `auth.register.captchaLoadError` | Captcha kunde inte laddas… | Captcha could not load… |
| `auth.register.captchaDomainError` | Captcha kunde inte laddas för den här webbadressen… | Captcha could not load for this website address… |
| `captcha.failed` | Captcha verifierades inte… | Captcha was not verified… |
| `captcha.notConfigured` | Captcha är inte konfigurerad… | Captcha is not configured… |

## Testing

| Check | How |
|-------|-----|
| Unit tests | `npm test -- src/lib/server/captcha.test.ts` |
| Local register | Set keys or `TURNSTILE_SKIP=true`, then open `/register` |
| CI / E2E | `TURNSTILE_SKIP` + `TURNSTILE_BYPASS` in Playwright and `.github/workflows/release.yml` |

## Troubleshooting prod registration

1. Confirm widget hostnames include the exact URL users open (`home-pantry--home-pantry-4bee5.europe-west4.hosted.app` or `localhost` for dev).
2. Confirm `PUBLIC_TURNSTILE_SITE_KEY` in deployed build matches the widget site key (BUILD + RUNTIME in `apphosting.yaml` or Firebase Console).
3. Confirm `TURNSTILE_SECRET_KEY` secret exists and matches the same widget (`firebase apphosting:secrets:describe TURNSTILE_SECRET_KEY`).
4. Redeploy after env/secret changes.
5. If the widget area is empty with no error banner, check Cloud Run logs for `[turnstile] PUBLIC_TURNSTILE_SITE_KEY missing`.
6. If the label shows but the challenge is blank, add the hostname in Cloudflare Turnstile (error 110200) or check the browser console for script/CSP errors.

## Verify after deploy

1. Open `/register` in an incognito window on `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app/register`.
2. Confirm **Bekräfta att du inte är en robot** / **Confirm you are not a robot** and the Turnstile widget render below the password fields.
3. If misconfigured, a red banner (*Captcha är inte konfigurerad*) appears and submit is disabled.
4. DevTools → Network: `https://challenges.cloudflare.com/turnstile/v0/api.js` loads with status 200.
5. DevTools → Elements: `[data-testid="register-turnstile"]` exists when the site key is set.
6. Cloud Run logs (Firebase Console → App Hosting → Logs): no `[turnstile] PUBLIC_TURNSTILE_SITE_KEY missing` on `/register` loads.
