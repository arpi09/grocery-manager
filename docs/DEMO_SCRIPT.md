# Live demo-script — Skaffu

3- och 10-minuters manus för intervjuer, investerarmöten och portfolio-genomgångar. Målet är en **deterministisk demo** som inte hänger på OpenAI-latens eller prod-flake.

**Relaterat:** [`DEMO_ACCOUNT.md`](./DEMO_ACCOUNT.md) · [`E2E.md`](./E2E.md) · [`PROD_SMOKE.md`](./PROD_SMOKE.md) · [`RECEIPT_TEST_PACK.md`](./RECEIPT_TEST_PACK.md)

---

## Välj demo-läge (läs detta först)

| Läge | URL | Konto | AI | När |
|------|-----|-------|-----|-----|
| **A — Prod (rekommenderat live)** | `https://skaffu.com` | `demo@skaffu.com` | Riktig OpenAI | Intervju med nätverk; kör [`PROD_SMOKE.md`](./PROD_SMOKE.md) kvitto-rad samma dag |
| **B — Prod utan live-AI** | `https://skaffu.com` | `demo@skaffu.com` | Hoppa över generering | OpenAI nere; visa **förseedat** lager/plan/lista (se [Tier B](#tier-b--prod-utan-live-ai)) |
| **C — Lokal flake-free** | `http://localhost:5173` | Admin eller demo | `E2E_MOCK_AI=true` | Repetition, inspelning, eller om prod-AI strular |

**Princip:** Demokontot har redan ~15 varor, veckoplan och inköpslista. AI-steg (kvitto, veckogenerering, recept) är *bonus* — inte en single point of failure.

---

## Seed, fixtures och mock-vägar

### Demokonto (`npm run seed:demo`)

Idempotent seed — kör **alltid** före prod-demo:

```bash
npm run seed:demo
```

| Fält | Värde |
|------|--------|
| E-post | `DEMO_ACCOUNT_EMAIL` (standard: `demo@skaffu.com`) |
| Lösenord | `DEMO_ACCOUNT_PASSWORD` (secret — aldrig i git) |
| Hushåll | **Demo — Villa Söder** (`household-demo-skaffu`) |
| Användare | `user-demo-skaffu`, `is_demo=true` (Demo-banner syns) |

**Innehåll efter seed** (detaljer i [`DEMO_ACCOUNT.md`](./DEMO_ACCOUNT.md)):

- **Lager (~15 st):** kyckling (går ut ~imorgon), crème fraîche, mjölk, pesto, ägg, smör, pasta, ris, tomater, havregryn, olivolja, blåbär, lasagne, falukorv, surdegsbröd
- **Inköpslista:** bananer, toalettpapper, kaffe, morötter; dillfrön avbockade
- **Veckoplan:** fyra måltider idag → om några dagar, kopplade till utgående varor

Prod-reset: `POST /api/cron/reset-demo` (Cloud Scheduler) eller manuell `seed:demo`.

### Dev-hushåll **Hemmet** (admin, ingen demo-data)

Vid serverstart (`init.ts` → `ensureDefaultHousehold`):

| | |
|--|--|
| Hushålls-id | `household-hemmet` |
| Namn | **Hemmet** |
| Medlemmar | `ADMIN_EMAIL` (owner), valfri `DEFAULT_MEMBER_EMAIL` (editor) |
| Lager | **Inget automatiskt seed** — backfill av `household_id` på befintliga rader |

Använd **inte** Hemmet för intervjudemo om du inte själv fyllt lagret. Använd demokontot.

### E2E admin (lokal CI / Playwright)

| | |
|--|--|
| E-post | `E2E_ADMIN_EMAIL` eller `ADMIN_EMAIL` (CI: `e2e-admin@example.com`) |
| Lösenord | `E2E_ADMIN_PASSWORD` / `ADMIN_PASSWORD` (CI: `e2e-ci-password`) |
| Onboarding | `e2e/helpers/auth.ts` → `prepareE2eBrowserState` markerar onboarding klar |

### `E2E_MOCK_AI` — deterministiska AI-svar

När `E2E_MOCK_AI=true` (Playwright `webServer`, CI) använder servern fixtures i `e2e/fixtures/` via `src/lib/server/e2e-mocks.ts`:

| Endpoint / flöde | Fixture | Mockat svar (exempel) |
|------------------|---------|------------------------|
| `POST /api/receipt/parse` | `receipt-parse.json` | Mjölk 3%, Bröd, Coca-Cola |
| `POST /api/inventory/photo-scan` | `photo-round-parse.json` | Mjölk, Ägg (kyl) |
| `POST /api/shopping-suggestions`, smart fill på `/inkop` | `shopping-suggestions.json` | E2E Smartfill Mjölk, E2E Smartfill Banan |
| `POST /api/recipes`, `POST /api/eat-first` | `recipe-suggestions.json` | **E2E Testpasta** (2 steg) |
| `GET /api/barcode/*` (Playwright route) | `barcode.json` | Streckkod i E2E |

**Lokal flake-free server:**

```powershell
$env:USE_PGLITE = 'true'
$env:E2E_MOCK_AI = 'true'
$env:TURNSTILE_SKIP = 'true'
$env:ADMIN_PASSWORD = 'change-me'
npm run dev
```

E2E verifierar samma flöden: `e2e/receipt.spec.ts`, `e2e/weekly-ritual.spec.ts`, `e2e/recipe-assistant.spec.ts`, `e2e/shopping.spec.ts`.

### Kvitto-PDF för demo

Committad testsfil (fungerar med mock **och** som riktig upload):

`tests/fixtures/receipts/synthetic-ica-01.pdf`

---

## Pre-demo checklist (15 min före)

### Alla lägen

- [ ] **Seed:** `npm run seed:demo` (prod: mot Cloud SQL / Firebase secrets satta)
- [ ] **Inloggning:** `/login` → demokonto → landar på `/hem`, Demo-banner syns
- [ ] **Språk:** Svenska (demokonto / webbläsare)
- [ ] **Viewport:** Mobil ~390×844 (visa PWA-känsla) eller desktop om du delar skärm
- [ ] **Stäng distraktioner:** cookie-banner (godkänn en gång), stäng onboarding/page-hints om de syns (`Esc` / Hoppa över)
- [ ] **PDF redo:** `synthetic-ica-01.pdf` i Downloads eller drag-and-drop
- [ ] **Backup:** Screenshots från senaste torrkörning i `docs/demo-screenshots/` (se nedan)

### Läge A (prod + live-AI)

- [ ] [`PROD_SMOKE.md`](./PROD_SMOKE.md): inloggning, `/scan`, receptmodal, kvitto (valfri rad)
- [ ] `OPENAI_API_KEY` verifierad i Firebase App Hosting (inga 502 på `/api/eat-first` eller `/api/recipes`)
- [ ] Torrkör 3-min-scriptet en gång samma dag

### Läge C (lokal mock)

- [ ] `E2E_MOCK_AI=true` i dev-server-miljö
- [ ] `npm run test:e2e -- e2e/weekly-ritual.spec.ts e2e/recipe-assistant.spec.ts` grönt (snabb sanity)

### Onboarding-segment (valfritt)

För att **visa** onboarding live (inte demokonto):

- [ ] Lokal dev med `TURNSTILE_SKIP=true` + `EMAIL_VERIFICATION_SKIP=true`
- [ ] Registrera ny användare → `/hem?freshAccount=1` → guide "Välkommen till Skaffu" (steg 1 av 3)
- Prod: registrering kräver Turnstile — **hoppa över live onboarding på prod** och berätta muntligt, eller visa screenshot

---

## 3-minuters demo (live)

**Berättelse:** *"Aktivering → hushållslager → veckorytm → retention/emotion."*

Tidsbudget: ~60 s per block. Prata kort om *varför* (matsvinn, delat hushåll, PMF) mellan klick.

### Minut 0–1 — Onboarding → scan / kvitto

**Talking point:** *"Första värdet på under en minut: scan eller kvitto — lager som sanningskälla."*

| Steg | Action | Visa |
|------|--------|------|
| 1 | *(Prod demo-konto)* Hoppa onboarding; nämn 3-stegsguide för nya användare | `/hem` — "Går ut snart", delat hushåll |
| 2 | Navigera **Skanna** → `/scan` | Photo-first hub: Fota in varor, streckkod, **Kvitto** |
| 3 | Välj **Kvitto** → `/scan?mode=receipt` | Upload PDF |
| 4 | Ladda upp `synthetic-ica-01.pdf` | Granskning: rader (Mjölk, Bröd, Coca-Cola med mock; liknande med riktig AI) |
| 5 | **Lägg till valda** | Tillbaka till `/hem` — nya rader i lagret |

**Tier B (utan live-AI):** Hoppa upload. Visa istället `/inventory/fridge` → **Grillad kyckling** (går ut snart) och säg: *"Kvitto-flödet lägger in det här automatiskt — här är resultatet efter seed."*

**Alternativ 30 s:** `/scan` → streckkod/manuellt om kvitto känns långsamt.

### Minut 1–2 — Plan vecka → inköpslista

**Talking point:** *"Samma lager driver veckoplan och inköp — inte ett separat recept-Excel."*

| Steg | Action | Visa |
|------|--------|------|
| 1 | Gå till `/planer/vecka` | Utgående varor (kyckling, pesto …), ev. befintlig veckoplan från seed |
| 2a | **Med AI:** **Generera veckoförslag** → vänta | Förslag (mock: **E2E Testpasta**; prod: riktiga middagar) |
| 2b | **Utan AI:** Peka på seedade måltider | Pasta med pesto & kyckling, Wok … |
| 3 | **Godkänn veckan** (om du genererat) | Toast / celebration; saknade varor på listan |
| 4 | Öppna `/inkop` | Bananer, morötter … smart fill-knapp *"Fyll på från skafferiet"* |

**Tier B:** Visa seedad plan + lista utan att klicka Generera. Nämn att AI fyller på saknade varor automatiskt.

### Minut 2–3 — Recept `/laga` **eller** Wrapped

Välj **ett** avslut beroende på publik:

#### Option A — Recept + köksläge (produkt/tech)

**Talking point:** *"AI som consumable feature — steg-för-steg på mobilen, inte vägg av text."*

| Steg | Action | Visa |
|------|--------|------|
| 1 | `/hem` → receptknapp i headern (desktop: nav; mobil: header-ikon) | Receptassistent-modal |
| 2 | **Generera recept** | **E2E Testpasta** (mock) eller prod-förslag |
| 3 | Öppna recept → `/recept/[id]` | Ingredienser, steg |
| 4 | **Börja laga** → `/recept/[id]/laga` | Steg 1 av 2, Nästa steg, fullskärms köksläge |

#### Option B — Wrapped (tillväxt/PMF)

**Talking point:** *"Retention och delning — Spotify Wrapped för skafferiet."*

| Steg | Action | Visa |
|------|--------|------|
| 1 | `/statistik/wrapped` | Intro-slide ("Er första månad" på färskt konto; mer data på moget konto) |
| 2 | **Nästa** genom slides | Sparade kronor, milstolpar |
| 3 | Sista slide | **Ladda ner** delningskort (PNG) |

Demokontot har lite konsumtionshistorik → Wrapped blir kort men fungerar. För fylligare slides: använd eget admin-konto med historik **eller** visa backup-screenshot.

### 3-min — stängning (15 s)

*"Skaffu: lager som sanningskälla, svensk hushållsnisch, live på skaffu.com — byggt solo med E2E-gate och hexagonal arkitektur."*

---

## 10-minuters extended demo

Samma story som 3-min, plus djup. Använd **demokonto** genomgående.

| Block | Tid | Innehåll |
|-------|-----|----------|
| **Intro** | 0:30 | Problem (matsvinn, delad syn), skaffu.com, PMF före monetisering |
| **Hem & hushåll** | 1:30 | `/hem` — hero "Veckan fixad" (mån–ons), utgående band, hushållsväxlare (Hemmet vs demo om synligt), engagement strip |
| **Aktivering** | 2:00 | Full kvitto-upload **eller** `/scan?mode=photo` (foto-runda) **eller** streckkod; visa `/inventory/fridge` och `/inventory/cupboard` |
| **Veckorytm** | 2:00 | `/planer/vecka` — generera + godkänn; `/planer` kalender; länk till inköp |
| **Inköp** | 1:00 | `/inkop` — smart fill, bocka av dillfrön (visar att listan lever) |
| **Recept** | 1:30 | Header-assistent → detalj → `/laga` med prev/next |
| **Statistik & Wrapped** | 1:00 | `/statistik` — sparade kronor, streak; `/statistik/wrapped` — dela PNG |
| **Differentiator** | 0:30 | `/statistik` → Skaffurapport-länk **eller** `/rapport/2025-06` (publik beta-kopia) |
| **Arkitektur (HoD)** | 0:30 | Nämn: SvelteKit, ports/adapters, `E2E_MOCK_AI` vs prod OpenAI, deploy E2E-gate — peka på GitHub/README |
| **Q&A buffer** | 0:30 | — |

**Optional om tid:**

- `/settings` — push, utgångspåminnelser (prod-smoke punkt)
- Grannskafferiet / dela utgående (`/dela/[token]`) — kräver skapa länk från admin
- `/admin` — PMF-siffror (endast om du är inloggad som admin)

---

## Tier B — prod utan live-AI

Om `POST /api/eat-first`, `/api/recipes` eller `/api/receipt/parse` returnerar 502/503:

1. Säg: *"AI-lagret är tillfälligt throttlat — här är vad användaren ser när det fungerar"* och byt till screenshots **eller**
2. Kör **endast seed-data:**
   - `/inventory/fridge` — kyckling, pesto
   - `/planer/vecka` — befintlig plan (ingen Generera-knapp)
   - `/inkop` — seedad lista
   - `/statistik/wrapped` — intro + share-slide (fungerar utan AI)
3. Efter mötet: fixa enligt sprint W0 / [`PROD_SMOKE.md`](./PROD_SMOKE.md)

---

## Backup-screenshots (om AI failar)

### När

- OpenAI timeout/502 under live-demo
- Nätverk på event-location
- Du vill visa onboarding utan ny registrering på prod

### Vad att fånga (torrkörning i läge A eller C)

Spara som PNG i **`docs/demo-screenshots/`** (skapa mappen vid behov; kan committas som statiska backups eller ligga lokalt).

| Fil (förslag) | Route / tillstånd |
|---------------|------------------|
| `01-onboarding.png` | `/hem` — onboarding "Steg 1 av 3" (lokal ny användare) |
| `02-scan-hub.png` | `/scan` — photo-first hub |
| `03-receipt-review.png` | Kvitto granskning med 3 rader |
| `04-hem-expiring.png` | `/hem` — "Går ut snart" |
| `05-weekly-suggestions.png` | `/planer/vecka` — efter Generera |
| `06-shopping-list.png` | `/inkop` — lista med bananer/morötter |
| `07-recipe-cook.png` | `/recept/.../laga` — steg 1 |
| `08-wrapped-share.png` | `/statistik/wrapped` — sista slide + Ladda ner |

### Hur

1. Torrkör 3-min-scriptet; vid varje milestone: `Win+Shift+S` / DevTools screenshot / Playwright `page.screenshot()`
2. Namnge konsekvent enligt tabellen
3. Ha mappen öppen i separat fönster — alt-tab vid fel

**Manus vid fallback:** *"Här är prod igår kväll — samma flöde, jag visar live på lager och plan."* → fortsätt på seed-data live + screenshot för AI-steg.

---

## Torrkörning & verifiering

Kör scriptet **3×** utan fel innan intervju (plan definition of done).

| Verifiering | Kommando |
|-------------|----------|
| Seed | `npm run seed:demo` |
| E2E kritiska demo-flöden | `npm run test:e2e -- e2e/receipt.spec.ts e2e/weekly-ritual.spec.ts e2e/recipe-assistant.spec.ts e2e/shopping.spec.ts` |
| Prod smoke | Coordinator: [`PROD_SMOKE.md`](./PROD_SMOKE.md) efter senaste deploy |

---

## Intervju-talking points (kopplat till demo)

1. **PMF före monetisering** — visa `/admin` eller [`ROADMAP.md`](./ROADMAP.md) gate-tabell
2. **Solo-leverans, enterprise-disiplin** — E2E-gate, ~700 tester, hexagonal lager
3. **AI med guardrails** — `E2E_MOCK_AI` i CI, månadstak, tydliga felmeddelanden
4. **Webb/PWA** — mobil viewport i demo; native medvetet senare
5. **Svensk nisch** — kvitto PDF/Kivra, hushåll, matsvinn, Wrapped på svenska

---

## Snabbreferens — routes

| Route | Demo-användning |
|-------|-----------------|
| `/hem` | Start, utgående, vecka-hero |
| `/scan`, `/scan?mode=receipt` | Aktivering |
| `/inventory/fridge` | Kyckling / utgående |
| `/planer/vecka` | Veckorytm |
| `/inkop` | Inköpslista, smart fill |
| `/recept/[id]/laga` | Köksläge |
| `/statistik/wrapped` | Retention, delning |
| `/login` | Demokonto |
