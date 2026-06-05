# Security audit — Skaffu (home-pantry)

*Genomförd 4 jun 2026 på branch `chore/security-perf-audit` (bas: `origin/master`).*

## Sammanfattning

| Severity | Antal | Åtgärd i PR |
|----------|-------|-------------|
| Critical | 0 | — |
| High | 3 | 3 fixade |
| Medium | 7 | Dokumenterade nedan |
| Low | 4 | Dokumenterade nedan |

Auth, household-IDOR (Drizzle `householdId` i queries), Stripe-webhook-signatur, admin `requireAdmin`, CSRF via SvelteKit + `ORIGIN`/`LEGACY_APP_ORIGIN`, och Turnstile på registrering är i stort sett väl upplagda. Engineering Excellence (2026-06-05) adresserar API verification gate, health Bearer-auth, cron POST-only, register IP rate limit, HSTS och IDOR-regressionstester.

### Fas 3 — medvetet uppskjutet (infra-beslut)

| Item | Status | Beslut |
|------|--------|--------|
| Distribuerad rate limiting (Redis/Memorystore) | Accepted risk | Aktivera vid multi-instance Cloud Run eller Cloudflare Rate Limiting |
| Edge WAF / bot management | Future | Cloud Armor eller Cloudflare framför App Hosting |
| CSP nonces | Accepted risk | Kräver SvelteKit nonce-pipeline; `unsafe-inline` kvar tills dess |
| Login Turnstile | Deferred | Endast vid observerad brute-force |

---

## Findings

| ID | Severity | Område | Finding | Status |
|----|----------|--------|---------|--------|
| SEC-01 | **High** | Auth | Ingen rate limit på `/login` — brute force mot lösenord | **Fixed** — IP + e-post, 15 min fönster |
| SEC-02 | **High** | API | `/api/health/db` publik och läste `password_hash`-kolumn (onödig exponering) | **Fixed** — `SELECT 1` only |
| SEC-03 | **High** | Cron | `CRON_SECRET` accepterades via query `?secret=` (läcker i access-loggar) | **Fixed** — endast `Authorization: Bearer` |
| SEC-04 | Medium | Headers | Inga CSP / X-Frame-Options / Referrer-Policy i appen; Firebase App Hosting sätter inte detta i `apphosting.yaml` | **Fixed** — `applySecurityHeaders` i `hooks.server.ts` |
| SEC-05 | Medium | Rate limit | In-memory rate limits (login, lösenordsåterställning, AI, register IP) — per Cloud Run-instans, inte globalt | **Accepted** — Redis/Memorystore eller Cloudflare Rate Limiting vid multi-instance (fas 3) |
| SEC-06 | Medium | Login | Ingen Turnstile på login (endast register + forgot-password) | **Deferred** — överväg vid abuse |
| SEC-07 | Medium | Health | `/api/health/*` DB reachability | **Fixed** — Bearer `HEALTH_SECRET`/`CRON_SECRET`; ej längre publik utan token |
| SEC-08 | Medium | CSP | `script-src 'unsafe-inline'` krävs av SvelteKit inline bootstrap | **Accepted/future** — nonce-pipeline (fas 3) |
| SEC-09 | Medium | Product events | `POST /api/product-events` tillåter vissa event utan inloggning (med cookie-consent) | Accepted — begränsad allowlist |
| SEC-10 | Medium | Cron | `GET` på cron-routes delegerar till `POST` | **Fixed** — POST-only |
| SEC-11 | Low | OAuth redirect | Cookie `google_oauth_redirect` valideras som relativ path | OK |
| SEC-12 | Low | XSS | Användarinnehåll som text; JSON-LD `{@html}` med `JSON.stringify` | OK |
| SEC-13 | Low | SQL | Drizzle parameteriserade queries | OK |
| SEC-14 | Low | IDOR | API/repo filtrerar på `locals.householdId` | **OK** — regression i `household-idor.integration.test.ts` |

### Granskade ytor (inga kritiska fynd)

- **Stripe:** webhook-signatur, checkout/portal kräver owner-roll.
- **Push:** subscribe/unsubscribe kräver session.
- **Admin:** `requireAdmin` på API + server redirect.
- **Secrets:** Secret Manager via `apphosting.yaml`; inga hemligheter i git.
- **Open redirect:** `safeRedirect` + OAuth cookie — endast `/…`, inte `//`.

---

## Referenser

- Process (privat): `private/SECURITY_REPORT.md`
- Deploy: `docs/FIREBASE_DEPLOY.md`, `apphosting.yaml`
- CAPTCHA: `docs/CAPTCHA.md`
