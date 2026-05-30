# 90-dagars roadmap — Home Pantry

Checklista från [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) avsnitt 15, med status och koppling till Must-roadmap (avsnitt 11).

| # | Uppgift | Status | Must-roadmap | Anteckning |
|---|---------|--------|--------------|------------|
| 1 | Sätt PMF-mätetal i kod/analytics (aktivering, scan, retention) | **Klar** | #7 Analytics för PMF | `product_event`-tabell, events vid scan/kvitto/smart fill, admin PMF-dashboard på `/admin` |
| 2 | Förenkla första sessionen — kvitto ELLER 5 streckkoder, inte "fyll hela skafferiet" | **Klar** | #1 Onboarding som mäter aktivering | 2-stegs guide, localStorage-progress, firande vid mål |
| 3 | Publicera integritet + AI-policy på `/faq` eller `/privacy` | **Klar** | — | `/privacy` (SV/EN), länkar i footer, FAQ, inställningar |
| 4 | PWA + installguide för iPhone/Android | **Klar** | #2 PWA + hemskärm | `@vite-pwa/sveltekit`, manifest, `/install-app`, banner på `/hem`, FAQ |
| 5 | Implementera utgångspåminnelse (e-post minimum) | **Klar** | #3 Utgångspåminnelser | Veckovis digest, opt-in i inställningar, cron-API |
| 6 | Prissättningshypotes — dokumentera Pro-gränser; stripe senare | **Klar** | — | `docs/PRICING.md`, `plan.ts`, `/priser`, inställningar Plan |
| 7 | homepantry.com live på en domän (Firebase custom domain) | **Klar (dokumenterat + kod redo)** | — | Domän kopplas i Firebase Console av ägare — se [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) |
| 8 | Landningssida A/B-copy mot Bring/ICA/Matdags med ärliga jämförelser | **Klar** | #6 "Varför inte bara ICA?" | Hero A/B (`?hero=b`, cookie, `PUBLIC_LANDING_VARIANT`), jämförelsetabell på `/`, se `docs/MARKETING_SITE.md` |
| 9 | 10 användarintervjuer (SV hushåll) — vad gjorde dem churna? | **Klar (kit + insamling)** | — | `docs/USER_INTERVIEWS.md`, feedback i inställningar + `/admin`; 10 intervjuer körs av ägaren |
| 10 | Kvitto-PDF testpack — 20 riktiga ICA/Kivra/Willys-PDF | **Klar (infrastruktur; ägare fyller på riktiga PDF)** | — | Se [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md), `tests/fixtures/receipts/`, syntetiska CI-fixtures |
| 11 | Rate limits på AI — skydda kostnad och missbruk | **Klar** | #5 Smart fill stabil & billig | `ai_usage`-tabell, `FREE_LIMITS` på kvitto/smart fill/insights/foto |
| 12 | "Dela lista" export — minst clipboard-format för Bring | **Klar** | Should #8 Export/delning | `formatShoppingListExport` + "Kopiera lista" i `ShoppingListPanel`, i18n sv/en |
| 13 | Launch i 2–3 communities (matsvinn, föräldrar, meal prep) | **Klar (kit)** | — | `docs/LAUNCH_PLAYBOOK.md`, UTM på marketing-CTA → login/register |
| 14 | Veckovis retention-granskning — en metric dashboard du faktiskt läser | Väntar | #7 Analytics för PMF | Dashboard finns — etablera veckorutin |
| 15 | Beslut dag 90: dubbla ner på webb+SV eller starta Capacitor-wrapper | **Klar (dokument)** | Should #12 App Store wrapper | [DAY_90_DECISION.md](./DAY_90_DECISION.md) — ägaren fyller checklista dag 90 |
| 16 | E2E critical flows — registrering, login, scan, inköp | **Klar** | — | `e2e/critical-flows.spec.ts`, `TURNSTILE_BYPASS`, [`E2E.md`](./E2E.md) |
| 17 | Scan-kvalitet SV — senaste varor, snabb redigering, favoriter | **Klar** | Must #4 Scan-kvalitet SV | Snabbval-chips, inline redigering, `favorite-products.ts` localStorage-cache |
| 18 | Freemium enforcement UI — gränser synliga i inställningar/plan | **Klar** | Must #10 Enkel prissättning | `PlanLimitsService` + `PlanLimitBanner`, användningsrader, uppgraderings-CTA `/priser`; AI-räknare via `AiRateLimitService` (#11) |
| 19 | Recept från lager v2 — strikt lager, portioner, mindre hallucination | Väntar | Must #11 Recept från lager v2 | |
| 20 | Registration captcha fix — Turnstile prod + test mode CI | **Klar** | — | `PUBLIC_TURNSTILE_SITE_KEY` i apphosting, widget + verify, i18n-fel, domän-whitelist i CAPTCHA.md |

*Punkt 16–20 är tillägg utöver original-listan (15 punkter) i COMPETITIVE_ANALYSIS §15 — kopplade till Must-roadmap, e2e och prod-fixar.*

## Punkt 1 — levererat

- **Events:** `scan_completed`, `receipt_parsed`, `fill_suggestions_added` i `product_event`
- **Aktivering:** ≥10 varor eller 1 kvitto inom 24 h (inventory + events)
- **Övriga mätetal:** median tid till första scan, veckoscan-rate, D7/D30, hushåll 2+ aktiva, smart fill-rate
- **UI:** `/admin` → sektion "PMF-mätetal"
- **Integritet:** hushållsscope på events, ingen tredjeparts-SDK

## Punkt 6 — levererat

- **Dokumentation:** [PRICING.md](./PRICING.md) — Free vs Pro, AI-enhetsekonomi, Stripe-triggers, kommunikation
- **Kod:** `src/lib/domain/plan.ts` — gränser, prishypotes, gates; **enforcement** via `AiRateLimitService`
- **App:** Inställningar → sektion Plan (Free, Pro-fördelar, länk `/priser`)
- **Marknad:** `/priser` stub, FAQ-svar uppdaterat

## Punkt 2 — levererat

- **OnboardingGuide:** 2 steg — välkommen + val av kvitto eller 5 streckkoder; "Jag gör det senare" skippar utan blockering
- **Progress:** localStorage (`activation-path`, barcode-räknare, kvitto-klart) tills aktivering nås
- **Firande:** kort modal vid 5 streckkoder eller 1 kvitto
- **Startsida:** tom-state med två CTAs och `{count}/{goal}`-progress
- **i18n:** sv + en; ton enligt BRAND.md (scan-first, utan skuld)
- **Tester:** `onboarding.test.ts` för aktiveringslogik

## Punkt 4 — levererat

- **PWA:** `@vite-pwa/sveltekit`, `static/manifest.webmanifest`, theme/background enligt BRAND, ikoner från `favicon.svg`
- **SW:** autoUpdate i prod; av i dev (`docs/PWA.md`)
- **Guide:** `InstallAppGuide.svelte`, rutt `/install-app`, i18n sv + en
- **Discovery:** länk i `/settings`, avvisningsbar banner på `/hem`, FAQ-post på `/faq`
- **Detektering:** `display-mode: standalone`, `beforeinstallprompt` (Android), iOS/Android-steg

## Punkt 2 — spec (historisk)

**Mål:** Förenkla första sessionen så nya användare når aktivering utan att känna att de måste "fylla hela skafferiet".

**Acceptanskriterier:**

1. **Onboarding-flöde** leder tydligt till *antingen* kvittoscan *eller* 5 streckkoder — inte full inventering.
2. **Copy/UI** tar bort "fyll skafferiet"-känslan; hero/CTA/onboarding-guide visar två enkla vägar.
3. **Progressindikator** i första sessionen: "0/5 streckkoder" eller "Ladda upp kvitto".
4. **Aktiveringsmål** (från PMF): ≥10 varor *eller* 1 kvitto inom 24 h — onboarding ska optimeras mot detta, inte total lagersstorlek.
5. **Must-roadmap #1:** första scan inom 5 min, mål 10 varor — aligna copy men sänk friktion (5 streckkoder räcker som väg).
6. **Mätning:** befintliga PMF-events ska visa förbättrad median "tid till första scan" efter lansering.

**Filer att troligen röra:** `OnboardingGuide.svelte`, `HomeDashboard.svelte`, `StarterPackFlow.svelte`, `ScanModeHub.svelte`, i18n (`onboarding.*`), ev. `onboarding.ts`.

**Ej i scope:** PWA, notiser, paywall, Capacitor.

## Punkt 5 — levererat

- **Opt-in:** Inställningar → "Påminnelser om utgående varor" (e-post av som standard)
- **Tröskel:** 3 eller 7 dagar innan utgång (standard 7)
- **Innehåll:** Svensk HTML-e-post (Resend) med varor per hushåll användaren tillhör + CTA till `/hem`
- **Intervall:** Max en digest per 7 dagar och användare (`expiry_reminder_last_sent_at`)
- **Prod-trigger:** Schemalagd `POST /api/cron/expiry-reminders` med `Authorization: Bearer $CRON_SECRET` (t.ex. GitHub Actions cron måndag 08:00 UTC, eller Cloud Scheduler)
- **Dev/fallback:** Vid inloggning körs samma veckovisa kontroll i bakgrunden (om ≥7 dagar sedan senaste)
- **Env:** `RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `ORIGIN`/`PUBLIC_ORIGIN` (länkar i mejl)
- **Tester:** `expiry-reminder.test.ts` för urvalslogik


## Punkt 9 — levererat (kit + insamling)

- **Guide:** [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) — rekrytering, 30-min script, anteckningsmall P1–P10, syntes efter 10 samtal
- **App:** Inställningar → *Ge feedback* (churn-dropdown + fritext) → `product_feedback` i DB
- **Enkät:** Valfri 1-fråga efter introduktion (skippbar), samma lagring
- **Admin:** `/admin` → sektion *Användarfeedback*; PMF-mätetal i samma vy
- **Kvar hos ägare:** genomför 10 intervjuer manuellt och fyll syntes i guiden

## Punkt 11 — levererat

- **Gränser:** `FREE_LIMITS` i `plan.ts` — 15 AI-skannar/mån, 5 kvitto-PDF/mån, 2 smart fill/vecka
- **Lagring:** `ai_usage`-tabell (hushållsscope, vecka/månad per typ)
- **API:** 429 + i18n på `/api/receipt/parse`, `/api/shopping-suggestions`, `/api/inventory-insights`, `/api/product-from-image`; smart fill-form på `/inkop`
- **Pro:** obegränsat (tier `pro` i `plan.ts` — alla konton Free tills Stripe)

## Punkt 13 — levererat (kit)

- **Playbook:** [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) — kanaler (matsvinn, föräldrar, meal prep), postmallar SV/EN, UTM-konvention, PMF-mätetal, tidsplan, launch-logg
- **Kod:** `src/lib/marketing/utm-params.ts` — bevarar `utm_*` från landnings-URL på marketing-CTA (`/login`, `/register`)
- **Kvar hos ägare:** posta i 2–3 communities, föra launch-logg, syntes efter 2–4 veckor

## Punkt 10 — levererat (infrastruktur)

- **Fixtures:** `tests/fixtures/receipts/` — manifest med 20 platser (ICA/Kivra/Willys), 3 syntetiska text-PDF:er för CI
- **Gitignore:** riktiga `*.pdf` ignoreras; `synthetic-*.pdf` committas
- **Tester:** `receipt-pdf-fixtures.test.ts` — `extractPdfText` på alla tillgängliga fixtures; valfri OpenAI-integration (skip utan nyckel)
- **Validering:** `scripts/validate-receipt-fixtures.mjs` + `npm run test:receipt-fixtures`
- **Dokumentation:** [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md) — anonymisering, insamling, körning
- **Kvar hos ägare:** lägg till 20 anonymiserade riktiga PDF:er lokalt enligt manifest

## Punkt 20 — levererat

- **Prod:** `PUBLIC_TURNSTILE_SITE_KEY` i `apphosting.yaml` (BUILD + RUNTIME); `TURNSTILE_SECRET_KEY` som App Hosting-secret
- **Kod:** `TurnstileWidget`, token `cf-turnstile-response`, server `verifyTurnstileToken`, i18n `captcha.*` / `auth.register.captcha*`
- **UX:** tydliga fel (laddning, verifiering, saknad konfig); submit inaktiverad när site key saknas
- **Docs:** [`CAPTCHA.md`](./CAPTCHA.md) — domän-whitelist, Cloudflare test keys, felsökning prod
- **CI:** `TURNSTILE_SKIP` + `TURNSTILE_BYPASS`; unit test mot Cloudflare always-pass test secret
- **Kvar hos ägare:** bekräfta Cloudflare-widget hostnames + redeploy efter secret/key-ändringar

## Punkt 16 — levererat

- **Register:** Playwright register-flow med `TURNSTILE_BYPASS` / `TURNSTILE_SKIP` (server skip i test/CI, ignoreras i prod)
- **Kritiska flöden:** login → `/hem`, onboarding för ny användare, smart fill på `/inkop`, scan-hub på `/scan`, marketing `/` + `/login` HTTP 200
- **Dokumentation:** [`E2E.md`](./E2E.md); CI env i `.github/workflows/release.yml`
- **Tester:** 6 nya i `e2e/critical-flows.spec.ts` (14 E2E totalt, befintliga 8 oförändrade)

## Punkt 7 — levererat (dokumentation + kod)

- **Guide:** [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) — Firebase Console, DNS (A/TXT/CNAME), SSL, www→apex, env, verifiering
- **Env:** `.env.example` och `apphosting.yaml` kommenterade för `https://homepantry.com`
- **Kod:** `marketingCanonicalUrl` / `PUBLIC_ORIGIN` för canonical + `og:url`; inbjudningsmail via befintlig `getAppOrigin()`
- **Kvar hos ägare:** koppla domän i Firebase Console och uppdatera `PUBLIC_ORIGIN` + `ORIGIN` efter SSL är aktivt

## Punkt 19 — levererat

- **Prompt:** `recipe-prompt.ts` — svenska system-/användarprompt, portioner (1–8), strikt lagerlista, färre påhittade varor
- **Sanering:** `sanitizeRecipesAgainstInventory` flyttar icke-lagervaror från `ingredientsToUse` till `missingIngredients`
- **API:** `POST /api/recipes` tar `portions`; `POST /api/recipes/add-missing` lägger saknade på inköpslistan
- **UI:** `RecipeAssistant` — portionsfält, knapp *Lägg saknade på inköpslista* (vid redigeringsbehörighet)
- **Tester:** `recipe-prompt.test.ts`

## Punkt 17 — levererat

- **Snabbval:** Horisontella chips överst i streckkodsflödet — favoritprodukter (localStorage) + senaste skanningar, deduplicerat
- **Snabb redigering:** Namn, mängd och enhet alltid redigerbara direkt efter scan; okända produkter får fokus på namnfält
- **Favorit-cache:** `favorite-products.ts` sparar användarens senaste namn/mängd per streckkod; träff före API-uppslag
- **i18n:** sv + en (`scanFlow.quickPicks`, `editNameHint`, `moreOptions`)
- **Tester:** `favorite-products.test.ts`, `recent-scans.test.ts`, `scan-quick-picks.test.ts`

## Punkt 14 — levererat

- **Veckosammanfattning:** `/admin` → PMF-dashboard med sammanfattningskort överst
- **WoW-delta:** varje mätetal jämförs mot samma beräkning 7 dagar tillbaka (procentenheter / minuter)
- **Målmarkering:** kort under `PMF_TARGETS` markeras visuellt; sammanfattning listar det som kräver uppmärksamhet
- **Rutin:** granska veckosammanfattningen varje vecka — ingen separat e-post (dashboard räcker)

## Punkt 15 — levererat (dokument)

- **Beslutsramverk:** [`DAY_90_DECISION.md`](./DAY_90_DECISION.md) — webb+SV vs Capacitor baserat på D30 och PMF-trösklar (CA §13, `pmf.ts`)
- **Innehåll:** beslutsmatris (scenario A/B/hybrid), kvalitativa inputs (intervjuer, feedback), kostnad/risk
- **Checklista:** ifyllbar mall för ägare vid dag 90 (mätetal, beslut, top 3 actions)
- **Kvar hos ägare:** fyll i checklista med data från `/admin` och fatta väg A eller B
