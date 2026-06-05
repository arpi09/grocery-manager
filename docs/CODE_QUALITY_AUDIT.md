# Kodkvalitetsaudit — Home Pantry / Skaffu

**Bas:** `origin/master` (read-only audit 2026-06-05). **Nuvarande branch** `feat/track-f-toast-unify` har pågående photo-round-ändringar — auditen avser master-strukturen.

---

## Proud to show — **7/10**

Ärlig bedömning: **ovan medel för ett bootstrappat SaaS** — tydlig layered architecture, testing diamond, säkerhetsaudit, CI-gates och i18n-infrastruktur. En senior Google-granskare skulle dock stanna vid **lagerläckage** (`application` → `$lib/server`), **900-raders Svelte-filer**, **fragmenterade toast/API-mönster** och **saknade tester på OAuth/password-reset**. Inte dåligt — men inte “showcase-refactor complete”.

---

## Executive summary (svenska)

Projektet har medveten **domän → application → infrastructure → routes**-struktur under `src/lib/`, med Zod-validering, Drizzle-schema, Lucia-auth, household-scoping och en dokumenterad **testing diamond** (unit → integration → E2E). Säkerhetsarbete är nyligen genomfört ([`docs/SECURITY_AUDIT.md`](SECURITY_AUDIT.md)) med fixade HIGH-fynd (login rate limit, health-endpoint, cron-secret).

**Styrkor:** Typ-säkerhet (nästan noll `any` i prod), ~150 unit- + 20 integrationstestfiler, `api-guards.ts` som central auth-helper, `locale-keys.test.ts` för i18n-paritet, admin lazy-load via `{#await import(...)}`, tydlig CI (`lint · check · test · integration · build`).

**Svagheter:** `hooks.server.ts` som **service locator** (20+ services per request), `settings/+page.svelte` (908 rader) och `settings/+page.server.ts` (407 rader) som god-moduler, **5+ application-services** som importerar `$lib/server/*`, **4 parallella toast-system**, inkonsekvent API-felhantering (hårdkodad engelska vs `translate()`), och **OAuth/password-reset utan dedikerade integrationstester**.

---

## P0 / P1 / P2

| Prio | Område | Problem | Filer / paths | Rekommenderad åtgärd |
|------|--------|---------|---------------|----------------------|
| **P0** | Arkitektur | Application-lager importerar server (bryter client/server-gräns och testbarhet) | `src/lib/application/inventory.service.ts` (`shelf-life-inference`), `billing.service.ts`, `email-verification.service.ts`, `password-reset.service.ts`, `expiry-reminder.service.ts`, `shopping-push.service.ts`, `pmf-digest.service.ts` | Flytta ren domän till `domain/`, infra-adapters till `infrastructure/`, injicera via `di.ts` |
| **P0** | God-moduler | Settings samlar household, billing, push, pets, feedback, waitlist | `src/routes/settings/+page.svelte`, `src/routes/settings/+page.server.ts` | Dela i sub-routes eller panel-specifika `+page.server.ts` / composables |
| **P0** | API-konsistens | Barcode-API använder inte `api-guards` + i18n | `src/routes/api/barcode/[code]/+server.ts` | `requireUser` + `translate()`; ev. `requireHousehold` |
| **P0** | Auth-tester | OAuth-flöde utan service/integration-test | `src/lib/application/oauth.service.ts`, `src/routes/auth/google/**` | Integrationstest med mockad Google token (finns `google-id-token.test.ts` men inte hela flödet) |
| **P1** | Toast/DX | 4 toast-komponenter + 3 utils | `AppLayout.svelte`, `action-toast.ts`, `scan-toast.ts`, `client-toast.svelte.ts`, `Toast.svelte`, `ActionToast.svelte`, … | P1 i [`docs/NEXT_STEPS.md`](NEXT_STEPS.md) — redan på `feat/track-f-toast-unify` |
| **P1** | Type/DX | `svelte/valid-compile: off` + ~37 svelte-check-varningar | `eslint.config.js`, se [`docs/CLEANUP_LOG.md`](CLEANUP_LOG.md) | Adressera `$state`/a11y-varningar stegvis; slå på compile igen |
| **P1** | Performance | ZXing eager import, RecipeAssistant alltid i layout | `src/lib/components/molecules/BarcodeScanner.svelte`, `src/lib/components/templates/AppLayout.svelte` | `import('@zxing/browser')` on demand; lazy-load RecipeAssistant |
| **P1** | i18n | Hårdkodad svenska i services + engelska i API | `household-auth.ts`, `inventory.service.ts` (`InventoryReadOnlyError`), diverse `+server.ts` med `'Invalid JSON'` | Flytta till `errors.*`-nycklar; använd `translate(locals.locale, …)` konsekvent |
| **P1** | Billing | Ingen `billing.service.test.ts` (bara domain + stripe integration) | `src/lib/application/billing.service.ts`, `src/routes/api/stripe/stripe.integration.test.ts` | Unit-tester för webhook/checkout edge cases |
| **P1** | DI-konsistens | Repos instansieras direkt i routes | `settings/+page.server.ts`, `api/push/*`, `reset-password/[token]/+server.ts` | Wire via `di.ts` eller route-local factories |
| **P2** | Git/DX | Duplicerade Windows-sökvägar i index | `docs/CLEANUP_LOG.md` (e2e/auth.spec.ts m.fl.) | `core.autocrlf` + normalisering |
| **P2** | Säkerhet (open) | In-memory rate limits, publik health, CSP unsafe-inline | `docs/SECURITY_AUDIT.md` SEC-05–08 | Redis/shared store vid skala; nonce-CSP långsiktigt |
| **P2** | Domän-tester | `photo-round.ts` utan unit-test | `src/lib/domain/photo-round.ts` | Testa konstanter, zone parsing, max limits |
| **P2** | Load perf | Settings `load` med många sekventiella awaits | `settings/+page.server.ts` rad 37–70 | `Promise.all` där beroenden tillåter |
| **P2** | Bundle | Marketing content 752 rader inline | `src/lib/marketing/content.ts`, `(marketing)/+page.svelte` | Code-split marketing-only chunks |

---

## 1. Arkitektur

```
src/
├── lib/
│   ├── domain/          # Ren affärslogik (~90 filer, bra testtäckning)
│   ├── application/     # Services + repo-gränssnitt
│   ├── infrastructure/  # Drizzle repos, auth, db/schema.ts
│   ├── server/          # OpenAI, email, guards, parsing
│   ├── validation/      # Zod schemas (17 filer)
│   ├── components/      # atoms → organisms → templates
│   └── i18n/
├── routes/              # SvelteKit pages + api/
└── hooks.server.ts      # Auth, locale, DI injection, security headers
```

**Positivt:** Tydlig separation intent; repositories bakom interfaces; `di.ts` som composition root.

**Smells:**

- **Service locator:** `hooks.server.ts` injicerar 20+ services i `event.locals` varje request.
- **Layer leak:** minst 7 application-services importerar `$lib/server/*`.
- **Stora moduler:** `household.repository.ts` (489), `inventory.repository.ts` (439), `inventory.service.ts` (~700), `email.ts` (704).
- **Fat routes:** `settings/+page.server.ts` har en enda `actions`-blob med allt från pantry till billing.

---

## 2. Type safety

| Signal | Status |
|--------|--------|
| `: any` / `as any` i prod | **Nästan noll** — endast test `expect.any()` och kommentarer |
| `@ts-ignore` / `@ts-expect-error` | **Inga** |
| `eslint-disable` | 1 st — `{@html}` i JSON-LD (`MarketingSeoHead.svelte`), motiverat |
| svelte-check | **0 errors, ~37 warnings** (dokumenterat i CLEANUP_LOG) |
| Drizzle/schema | Konsekvent `schema.ts` + `migrations.test.ts`; enum-kolumner i PG |

---

## 3. Tester — luckor på kritiska paths

| Path | Täckning | Gap |
|------|----------|-----|
| **Auth (credentials)** | `auth.service.test.ts`, `auth.integration.test.ts`, E2E | Bra |
| **OAuth** | `google-id-token.test.ts` | **Saknar** `oauth.service.test.ts` / integration |
| **Password reset** | Rate limit i service | **Saknar** integrationstest |
| **Billing/Stripe** | `billing.test.ts` (domain), `stripe.integration.test.ts` | **Saknar** unit för `BillingService` |
| **Inventory** | Flera integration + unit | Bra |
| **Scan/photo** | `photo-round-parse.*`, `photo-scan.test.ts`, E2E `photo-round.spec.ts` | Domain `photo-round.ts` utan unit |
| **Push** | `push.integration.test.ts` (5 describes) | Bra |

**Totalt:** ~150 `*.test.ts` + 20 `*.integration.test.ts` — starkt för projektstorlek.

---

## 4. Dead code

- [`docs/CLEANUP_LOG.md`](CLEANUP_LOG.md) visar aktiv städning (ICA-integration borttagen).
- **Toast.svelte** används av `ActionToast`, `ClientToast`, `GamificationToast`, `InventoryScanToast`, `ShoppingListPanel` — **behåll** (audit grep vid read-only var felaktig).
- **Legacy redirects** (`/scan/foto`, `/inventory/foto`) finns med E2E — medvetet, inte dead.
- **`email-verification-enforcement.skip.test.ts`** — separat env-test, behåll (eller slå ihop med huvudfil).

---

## 5. Konsistens

| Mönster | Bedömning |
|---------|-----------|
| **i18n** | Stark infrastruktur + `locale-keys.test.ts`; API/routes blandar engelska strängar |
| **API auth** | De flesta AI/inventory-routes använder `api-guards`; stripe/checkout har egen logik; barcode avviker |
| **Felhantering** | `handleError` i hooks använder i18n; många `+server.ts` returnerar `'Invalid JSON'` |
| **Naming** | Konsekvent sv/en routes (`/inkop`, `/hem`); domain på engelska |

---

## 6. Performance

- **N+1:** Repos använder Drizzle batch-queries; inga uppenbara N+1-loopar i inventory repo.
- **Settings load:** 8+ sekventiella DB-anrop — enkel `Promise.all`-vinst.
- **Bundle:** `@zxing/browser` eager i `BarcodeScanner.svelte`; `RecipeAssistant` alltid i `AppLayout`.
- **Lazy load:** Admin-paneler gör `{#await import(...)}` — bra mönster att sprida.

---

## 7. Säkerhet

Se [`docs/SECURITY_AUDIT.md`](SECURITY_AUDIT.md). **0 Critical, 3 High fixade.** Kvar:

- In-memory rate limits (SEC-05)
- Publik `/api/health/*` (SEC-07)
- CSP `unsafe-inline` (SEC-08)
- **IDOR:** Repo/API filtrerar på `locals.householdId` — OK enligt audit. `photo-scan` POST kräver bara `requireUser` (parse-only, ingen mutation) — acceptabelt.

---

## 8. DX

- **Scripts:** `dev:watch`, `test:integration`, `check:locales` — moget.
- **Docs:** 49 filer i `docs/`, tydlig `ONBOARDING_DEVELOPER.md`, `TEST_STRATEGY.md`, `CI_CD.md`.
- **CI:** `.github/workflows/ci.yml` — lint + check + unit + integration + build på varje push till master.
- **Husky/lint-staged:** ESLint på commit.

---

## 9. SvelteKit best practices

| Praxis | Status |
|--------|--------|
| `+page.server.ts` load/actions | Används konsekvent; settings är för tung |
| Client/server boundary | `$lib/server` i routes OK; **läckage i application/** |
| Form actions + `fail()` | Bra mönster med Zod + `household-errors` mapper |
| Layout data | `+layout.server.ts` laddar households/theme — rimligt |
| CSRF | `trustedOrigins` för legacy hosted.app i `svelte.config.js` |

---

## Top 5 — snabbast “wow” för senior reviewer

1. **Dela `settings/`** — extrahera household-, billing- och notification-paneler till egna routes eller co-located modules (<300 rader/fil).
2. **Rensa lagerläckage** — flytta `inferShelfLife` till `domain/shelf-life.ts`, Stripe-klient till `infrastructure/billing/`, email till port-interface.
3. **Enhetlig API-yta** — alla `+server.ts` via `requireUser`/`requireHousehold`/`requireAdmin` + `translate()` (mekanisk PR, ~15 filer).
4. **Toast-unify** — en kanonisk `ActionToast` + URL-param (redan P1 i roadmap; du är på rätt branch).
5. **OAuth + password-reset integrationstester** — högrisk-paths utan PGlite-täckning idag.

---

## Quick-win PR (`chore/code-quality-quick-wins`)

Säkra, icke-beteendeförändrande ändringar:

| Change | Fil | ~rader |
|--------|-----|--------|
| Barcode API → `requireUser` + i18n errors | `api/barcode/[code]/+server.ts` | ~15 |
| Inventory data API → `translate()` för `'Invalid section'` etc. | `api/inventory/data/+server.ts` | ~10 |
| Dynamic import ZXing | `BarcodeScanner.svelte` | ~20 |
| `domain/photo-round.test.ts` (konstanter, max limits) | ny fil | ~40 |
| Ta bort oanvänd `Toast.svelte` | — | **Ej genomfört** — har aktiva imports |

---

## Rekommenderade 3 engineering-sprints

### Sprint 1 — “Architecture hygiene” (2 veckor)

- Application → server-läckage (P0)
- Dela settings server/page (P0)
- API guards + i18n errors (P0/P1)
- OAuth integrationstest

### Sprint 2 — “UX infra & components” (2 veckor)

- Toast-unify (pågår)
- Lazy-load RecipeAssistant + ZXing
- `Promise.all` i settings load
- Bryt ut `PhotoRoundFlow.svelte` (591 rader) i subkomponenter

### Sprint 3 — “Hardening & polish” (2 veckor)

- BillingService unit-tester + webhook edge cases
- svelte-check-varningar (mål: 0 warnings)
- Git path-normalisering
- Bundle-analys (`rollup-plugin-visualizer`) + marketing code-split

---

## Vad som återstår kodmässigt (efter ovan)

- Stripe produktion (gates i [`docs/PRICING.md`](PRICING.md) — medvetet pausat)
- Global rate limiting (Redis/Memorystore)
- CSP hardening med nonces
- Större inventory-tabell (P2 produkt)
- Eventuell Capacitor/App Store (explicit “inte nu”)
