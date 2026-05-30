# E2E tests (Playwright)

End-to-end coverage for critical user journeys. Roadmap item **#16** in [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md).

## Run locally (CI pattern)

```powershell
npm ci
npx playwright install chromium

$env:USE_PGLITE = 'true'
$env:ADMIN_EMAIL = 'e2e-admin@example.com'
$env:ADMIN_PASSWORD = 'e2e-ci-password'
$env:PUBLIC_ORIGIN = 'http://localhost:5173'
$env:TURNSTILE_BYPASS = 'true'
$env:TURNSTILE_SKIP = 'true'

npm run test:e2e
```

Playwright starts the dev server automatically (`playwright.config.ts` → `npm run dev`). The config also pins `ADMIN_EMAIL` / `ADMIN_PASSWORD` and Turnstile bypass on the dev server so tests match CI even when your `.env` differs. Reuse an existing server on the Playwright port when not in CI.

**Required:** `ADMIN_PASSWORD` (or `E2E_ADMIN_PASSWORD`) must match what the app seeds on startup. Without it, admin login tests fail immediately.

## Captcha / registration

Registration uses Cloudflare Turnstile in production. E2E and CI **must** bypass verification:

| Variable | Where | Purpose |
|----------|-------|---------|
| `TURNSTILE_BYPASS=true` | CI secrets / local E2E | Skips server-side Turnstile verify (non-production only) |
| `TURNSTILE_SKIP=true` | Legacy alias | Same behavior as `TURNSTILE_BYPASS` |

Both are injected into the Playwright `webServer` env by default. The register widget is hidden when bypass is active, so tests submit without `cf-turnstile-response`.

See [`CAPTCHA.md`](./CAPTCHA.md) for production Turnstile setup.

## Spec files

| File | Focus |
|------|--------|
| `e2e/critical-flows.spec.ts` | Register, login → `/hem`, onboarding, `/inkop` smart fill, `/scan` hub, marketing HTTP 200 |
| `e2e/auth.spec.ts` | Marketing landing, admin login |
| `e2e/smoke.spec.ts` | Basic HTTP smoke |
| `e2e/navigation.spec.ts` | Nav + mobile sheet |
| `e2e/admin.spec.ts` | Admin dashboard |

**Total:** 14 tests (8 original + 6 critical flows).

## Helpers (`e2e/helpers/auth.ts`)

| Helper | Use |
|--------|-----|
| `prepareE2eBrowserState` | Locale + dismiss onboarding (seeded admin flows) |
| `prepareFreshUserBrowserState` | Locale only — new-user / register flows |
| `registerNewUser` | Register with unique email; expects `/hem` (email filled last for Svelte bind) |
| `loginWithCredentials` | Login → `/hem` |
| `loginAsAdmin` | Seeded admin from `.env` |
| `expectOnboardingGuideVisible` | Assert welcome modal for new users |
| `dismissOnboardingModalIfOpen` | Close onboarding or post-onboarding survey if shown |

## CI

GitHub Actions job **e2e** in [`.github/workflows/release.yml`](../.github/workflows/release.yml) runs after **quality**, with the same env as above (`TURNSTILE_BYPASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USE_PGLITE`).

Optional UI debugger: `npm run test:e2e:ui`.

## Adding tests

- Prefer `data-testid` on auth submit buttons (`login-submit`, `register-submit`).
- Use Swedish copy via `locale: 'sv-SE'` in config; helpers pin `sv` in cookies/localStorage.
- Do not rely on production Turnstile keys in E2E.
