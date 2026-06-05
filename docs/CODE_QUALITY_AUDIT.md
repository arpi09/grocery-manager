# Kodkvalitetsaudit — Home Pantry / Skaffu

**Bas:** Engineering Excellence-plan (2026-06-05). **Branch:** `feat/track-f-toast-unify` / master-struktur.

---

## Proud to show — **8/10**

Ärlig bedömning: **starkt för ett bootstrappat SaaS** — tydlig layered/hexagonal architecture med ports/adapters, testing diamond, säkerhetsaudit, CI-gates (inkl. `npm audit`) och i18n-infrastruktur. Settings **UI** är splittad (~157 rader route, commit `ed41c4b`); **server** är nu orchestrator + co-located action-moduler. Kvar: svelte-check-varningar (~37), stora organisms (PhotoRoundFlow m.fl.), distribuerad rate limit.

---

## Executive summary (svenska)

Projektet har medveten **domän → application → infrastructure → routes**-struktur under `src/lib/`, med Zod-validering, Drizzle-schema, Lucia-auth, household-scoping och en dokumenterad **testing diamond** (unit → integration → E2E). Säkerhetsarbete är genomfört ([`docs/SECURITY_AUDIT.md`](SECURITY_AUDIT.md)) med fixade HIGH-fynd och Engineering Excellence-hardening (API verification gate, health auth, HSTS, register rate limit, IDOR-tester).

**Styrkor:** Typ-säkerhet (nästan noll `any` i prod), ~620 unit- + 72 integrationstester, `application/ports/` + adapters (eliminerar application→`$lib/server`-läckage), `api-guards.ts`, OAuth/password-reset/IDOR integrationstester, `settings/+page.server.ts` <100 rader orchestrator med `Promise.all` load.

**Svagheter:** `hooks.server.ts` som **service locator**, stora organisms (`PhotoRoundFlow` ~591 rader, `HouseholdSettingsPanel` ~595), **4 parallella toast-system** (P1 på toast-branch), ~37 svelte-check-varningar, in-memory rate limits (accepterat till Redis/WAF-beslut).

---

## P0 / P1 / P2 (uppdaterad status)

| Prio | Område | Status efter Engineering Excellence |
|------|--------|-------------------------------------|
| **P0** | Application→server-läckage | **Fixat** — ports: Email, Push, Stripe, RateLimit, ShelfLifeInference, AppOrigin |
| **P0** | Settings server god-modul | **Fixat** — `household/notifications/billing/pets.actions.ts` + orchestrator |
| **P0** | API guards + i18n | **Större del fixad** — stripe, push, admin, shopping, pmf-survey, cookie-consent, product-events |
| **P0** | Auth-tester OAuth/reset | **Fixat** — `oauth.integration.test.ts`, `password-reset.integration.test.ts` |
| **P1** | Toast/DX | Pågår på `feat/track-f-toast-unify` |
| **P1** | svelte-check warnings | Öppet — mål 0 warnings |
| **P1** | BillingService unit tests | **Fixat** — `billing.service.test.ts` |
| **P2** | inventory.repository monolith | **Delvis** — crud + analytics + shared extraherade; queries kvar i facade |
| **P2** | Distribuerad rate limit / CSP nonces | Dokumenterat som accepted/future i SECURITY_AUDIT |

---

## 1. Arkitektur

```
src/lib/
├── domain/
├── application/
│   ├── ports/          # Hexagonal interfaces (ny)
│   └── *.service.ts
├── infrastructure/
│   ├── adapters/       # Server→port implementations (ny)
│   └── repositories/   # inventory-crud/analytics split (ny)
├── server/             # Composition root (di.ts), guards, email
└── routes/
    └── settings/       # Co-located action modules (ny)
```

**Positivt:** DIP via ports/adapters; repositories bakom interfaces; `di.ts` som composition root; routes via DI (push, reset-password).

**Kvar:** Service locator i hooks; `inventory.repository.ts` queries-delen fortfarande ~560 rader.

---

## 2. Tester — luckor stängda

| Path | Täckning |
|------|----------|
| OAuth | `oauth.integration.test.ts` |
| Password reset | `password-reset.integration.test.ts` |
| IDOR | `household-idor.integration.test.ts` |
| Billing | `billing.service.test.ts` + `stripe.integration.test.ts` |

**Totalt:** ~620 unit + ~72 integration + E2E.

---

## 3. Säkerhet

Se [`docs/SECURITY_AUDIT.md`](SECURITY_AUDIT.md). API verification gate för overifierade, health Bearer-auth, cron POST-only, register IP rate limit, HSTS.

---

## 4. CI

`.github/workflows/ci.yml`: lint · check:locales · check · test · integration · build · **npm audit** (runtime critical/high).

---

## Top 5 kvar för 9/10

1. Toast-unify (pågår)
2. svelte-check → 0 warnings + ESLint `svelte/valid-compile`
3. Split `PhotoRoundFlow` / `ShoppingListPanel`
4. Redis/Memorystore rate limits (infra-beslut)
5. CSP nonces (SvelteKit-pipeline)
