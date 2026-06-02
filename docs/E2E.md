# E2E tests (Playwright)

> **Teststrategi:** Se [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) för testing diamond-modellen (unit / integration / E2E, ägarskap och risk).

End-to-end coverage for critical user journeys. **~20 tests** across 11 spec files (plus optional local real-PDF tests). Settings/pantry persistence lives in integration tests — see [`TEST_STRATEGY.md`](./TEST_STRATEGY.md). Roadmap item **#16** in [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md).

## Run locally (CI pattern)

Copy the E2E block from [`.env.example`](../.env.example) or set:

```powershell
npm ci
npx playwright install chromium

$env:USE_PGLITE = 'true'
$env:ADMIN_EMAIL = 'e2e-admin@example.com'
$env:ADMIN_PASSWORD = 'e2e-ci-password'
$env:PUBLIC_ORIGIN = 'http://localhost:5173'
$env:TURNSTILE_BYPASS = 'true'
$env:TURNSTILE_SKIP = 'true'
$env:E2E_MOCK_AI = 'true'

npm run test:e2e
```

Playwright starts the dev server automatically (`playwright.config.ts` → `npm run dev`). The config pins admin credentials, Turnstile bypass, and `E2E_MOCK_AI=true` on the dev server so tests match CI even when your `.env` differs. Reuse an existing server on the Playwright port when not in CI.

**Required:** `ADMIN_PASSWORD` (or `E2E_ADMIN_PASSWORD`) must match what the app seeds on startup. Without it, admin login tests fail immediately.

## Captcha / registration

Registration uses Cloudflare Turnstile in production. E2E and CI **must** bypass verification:

| Variable | Where | Purpose |
|----------|-------|---------|
| `TURNSTILE_BYPASS=true` | CI secrets / local E2E | Skips server-side Turnstile verify (non-production only) |
| `TURNSTILE_SKIP=true` | Legacy alias | Same behavior as `TURNSTILE_BYPASS` |

Both are injected into the Playwright `webServer` env by default.

See [`CAPTCHA.md`](./CAPTCHA.md) for production Turnstile setup.

## Critical flows (what each spec proves)

| # | Flow | Spec | Mocked? |
|---|------|------|---------|
| 1 | Register → `/hem` | `critical-flows.spec.ts` | Turnstile bypass (real DB) |
| 2 | Login → `/hem` | `critical-flows.spec.ts` | — |
| 2b | Admin login → dashboard | `auth.spec.ts`, `z-admin.spec.ts` | — |
| 3 | Receipt PDF → lines → bulk add | `receipt.spec.ts` | `POST /api/receipt/parse` |
| 4 | Receipt image → lines | `receipt.spec.ts` | Same parse mock |
| 5 | Barcode manual add on `/scan` | `scan-inventory.spec.ts` | `GET /api/barcode/*` |
| 6 | Smart fill inköpslista | `shopping.spec.ts` | `E2E_MOCK_AI` + `e2e/fixtures/shopping-suggestions.json` |
| 7 | Shopping list add + check off | `shopping.spec.ts` | — |
| 8 | Onboarding for new user | `critical-flows.spec.ts` | — |
| 9 | Marketing `/`, `/login`, `/register` HTTP smoke | `smoke.spec.ts` | — |
| 10 | Inventory location loads | `scan-inventory.spec.ts` | — |

## Spec files

| File | Focus |
|------|--------|
| `e2e/critical-flows.spec.ts` | Register, login redirect, onboarding |
| `e2e/auth.spec.ts` | Marketing landing, admin login |
| `e2e/receipt.spec.ts` | Receipt upload → review → bulk add |
| `e2e/receipt-real-fixtures.spec.ts` | Local real PDF uploads (skipped in CI without fixtures) |
| `e2e/scan-inventory.spec.ts` | Scan hub, barcode add, `/inventory/fridge` |
| `e2e/shopping.spec.ts` | Smart fill, list add/check |
| `e2e/smoke.spec.ts` | Basic HTTP smoke (`/`, `/login`, `/register`, authenticated `/`) |
| `e2e/navigation.spec.ts` | Nav + mobile sheet |
| `e2e/z-admin.spec.ts` | Admin dashboard (körs sist i CI) |
| `e2e/settings.spec.ts` | Settings page loads (toggles tested in integration) |
| `e2e/household-switch.spec.ts` | Pantry switcher visible on `/hem` (actions in integration) |

## Fixtures (`e2e/fixtures/`)

| File | Used by |
|------|---------|
| `receipt-parse.json` | `mockReceiptParse()` — stubbed parse lines |
| `shopping-suggestions.json` | Server `E2E_MOCK_AI` smart fill |
| `barcode.json` | `mockBarcodeLookup()` |

PDF uploads use `tests/fixtures/receipts/synthetic-ica-01.pdf` only as a valid file; parse responses are stubbed so CI never needs `OPENAI_API_KEY`.

### Local real receipt PDFs

Optional regression with **gitignored** fixtures (`ica-*.pdf`, `kivra-*.pdf`, `willys-*.pdf` under `tests/fixtures/receipts/`):

| Spec | Behavior |
|------|----------|
| `e2e/receipt-real-fixtures.spec.ts` | One test per real PDF on disk; `mockReceiptParse()` keeps CI safe (no OpenAI) |

If no real PDFs are present (typical CI), the whole describe block is **skipped**. Install PDFs locally per [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md) — never commit them.

## Helpers

| Module | Use |
|--------|-----|
| `e2e/helpers/auth.ts` | Register, login, onboarding dismiss |
| `e2e/helpers/receipt.ts` | `uploadReceiptPdf()` — dev hook `window.__hpE2eReceiptUpload` (full parse UI path) |
| `e2e/helpers/mock-api.ts` | `page.route()` overrides (e.g. parse error responses) |

Receipt UI selectors: `data-testid` on `receipt-review`, `receipt-line-list`, `receipt-line-*`, `receipt-bulk-submit`, `receipt-parse-error`.

## Mocked vs real in E2E

| Flow | Real | Mocked / fixture |
|------|------|------------------|
| Register / login | App + PGlite DB, Turnstile bypass | — |
| Receipt parse UI + `bulkCreate` | File upload, server action | `E2E_MOCK_AI=true` → `e2e/fixtures/receipt-parse.json`; Playwright route for error cases |
| OpenAI / PDF text extraction | Not exercised in E2E | Unit tests (`receipt-parse.test.ts`, `receipt-pdf-fixtures.test.ts`) |
| Smart fill (`fillFromPantry`) | DB writes | `E2E_MOCK_AI=true` reads `shopping-suggestions.json` |
| Barcode lookup | Form submit + inventory | `GET /api/barcode/{code}` |

## CI

GitHub Actions job **e2e** in [`.github/workflows/release.yml`](../.github/workflows/release.yml) runs after **quality**, with `TURNSTILE_BYPASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USE_PGLITE`. Playwright config sets `E2E_MOCK_AI=true` on the web server — no `OPENAI_API_KEY` required.

Optional UI debugger: `npm run test:e2e:ui`.

## Adding tests

- Prefer `data-testid` on auth submit buttons (`login-submit`, `register-submit`) and receipt bulk-add UI.
- Use Swedish copy via `locale: 'sv-SE'` in config; helpers pin `sv` in cookies/localStorage.
- Do not rely on production Turnstile or OpenAI keys in E2E.
