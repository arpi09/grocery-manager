# E2E agent (Playwright)

**Worktree:** `$SKAFFU_ROOT-tests` (sibling clone, e.g. `home-pantry-tests`)  
**Branch:** `feat/e2e-playwright`

## Playwright is free

You do **not** need a paid Playwright account. `@playwright/test` is open source.  
Browsers install locally with `npx playwright install chromium` (no subscription).

Optional paid services (not required): Playwright Cloud, BrowserStack, etc.

## Scope

- `e2e/**`
- `playwright.config.ts`
- `package.json` scripts `test:e2e*`
- `.github/workflows/ci.yml` (e2e job only when ready)
- `AGENTS-E2E.md`, e2e section in `README.md`

Do **not** change product features in `src/routes` except test hooks if absolutely needed.

## Setup (once per machine)

```powershell
cd <path-to>/home-pantry-tests
copy ..\\home-pantry\\.env .env   # or: npm run setup:agent
npm ci
npx playwright install chromium
```

## Run tests

```powershell
npm run test:e2e
npm run test:e2e:ui    # optional debugger UI (free)
```

Playwright starts `npm run dev` automatically unless a server already runs on port 5173.

## Credentials

Tests sign in as the **seeded admin** from `.env`:

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (same as app)
- Optional overrides: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`

## Git

Rebase on `origin/master` often. Small commits. No push until: `Approved to push feat/e2e-playwright`.
