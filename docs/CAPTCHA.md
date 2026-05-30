# CAPTCHA (Cloudflare Turnstile)

Home Pantry uses [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) on **user registration** only. Turnstile is free for normal site usage, privacy-friendly, and usually invisible or low-friction for real users.

## Create keys (free)

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Go to **Turnstile** → **Add site**.
3. Choose **Managed** widget type and add your domains (e.g. `localhost` for dev and your production hostname).
4. Copy the **Site key** and **Secret key**.

## Local development

Add to `.env` (never commit `.env`):

```bash
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

Without keys, registration is **blocked** (fail closed). For local dev without Turnstile, add:

```bash
TURNSTILE_SKIP=true
```

`TURNSTILE_SKIP` is ignored in production even if set.

## Production (Firebase App Hosting)

1. Set the public site key in Firebase Console → **App Hosting → Environment** (or uncomment and set in `apphosting.yaml`). SvelteKit needs `PUBLIC_TURNSTILE_SITE_KEY` at **build** and **runtime**.
2. Store the secret:

```bash
npx firebase apphosting:secrets:set TURNSTILE_SECRET_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess TURNSTILE_SECRET_KEY --backend home-pantry --project home-pantry-4bee5
```

`apphosting.yaml` already references `TURNSTILE_SECRET_KEY` as a runtime secret.

## User-facing copy

- Widget label: *Bekräfta att du inte är en robot*
- Failed verification: *Captcha verifierades inte. Försök igen.*

## Testing

| Check | How |
|-------|-----|
| Unit tests | `npm test -- src/lib/server/captcha.test.ts` |
| Local register | Set keys or `TURNSTILE_SKIP=true`, then open `/register` |
| CI / E2E | Playwright and GitHub Actions set `TURNSTILE_SKIP=true` so login flows are unaffected |
