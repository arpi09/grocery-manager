# Prissättningshypotes — Home Pantry

*Version: maj 2026. Punkt 6 i [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md). Master roadmap: [ROADMAP.md](./ROADMAP.md).*

**Status:** Hypotes dokumenterad. Ingen betalvägg, ingen Stripe SDK. Gränser i kod (`src/lib/domain/plan.ts`); **UI + AI-enforcement** via `PlanLimitsService` / `AiRateLimitService` (ingen Stripe än).

---

## 1. Sammanfattning

Home Pantry bygger på **freemium**: en generös gratis kärna (lager, manuell lista, litet hushåll) och **Pro** för AI-tunga flöden som kostar drift per användning. Prisnivå jämförs med svenska konkurrenter (Matdags ~29 kr/mån, FreshKeeper 39 kr/mån, NoWaste ~60 kr/år) — vår hypotes ligger i mitten: **39 kr/mån** eller **299 kr/år**.

Vi lovar redan i FAQ att betalda planer meddelas i förväg. Denna fil är den interna sanningen bakom det löftet.

---

## 2. Varför freemium (inte annonser eller B2B)

| Modell | Bedömning |
|--------|-----------|
| **Freemium** | Bäst passform: manuell kärna gratis, AI och djup statistik i Pro |
| **Prenumeration** | Standard i kategorin; rimligt 29–49 kr/mån eller 199–399 kr/år |
| **Lifetime** | Möjlig kampanj senare (NoWaste-modell), sämre LTV |
| **Annonser** | Krockar med integritets- och butiksneutral story |
| **B2B / affiliate** | Efter B2C product-market fit |

**Rekommendation (oförändrad från konkurrensanalys):** Gratis kärna = lager, manuell inköpslista, **2 hushållsmedlemmar**. Pro = obegränsad AI, kvitto-PDF, insights, statistik, fler medlemmar, högre lagertak.

---

## 3. Free vs Pro — hypotes

### 3.1 Gratis (Free)

| Gräns | Värde | Motivering |
|-------|-------|------------|
| Aktiva lagerrader | **400** | Generös gratisplan; begränsar fortfarande “arkiv-lager” |
| Hushållsmedlemmar | **4** | Täcker par och mindre familj; uppmuntrar Pro för större hushåll |
| AI-skannar / månad | **75** | Streckkod+foto med AI-tolkning; räcker för daglig vardagsanvändning |
| Kvitto-PDF-tolkningar / månad | **25** | Wow-moment utan att AI-budget sprängs |
| Smart fill (inköpslista) / vecka | **8** | Smak på differentiatorn utan att vardagsanvändare träffar taket direkt |
| Admin-insikter / vecka | **40** | Gäller endast icke-admin-användare i `/admin` |

**Alltid gratis (ingen räknare):**

- Manuell inmatning av varor (inom lagertak)
- Streckkod via Open Food Facts utan AI
- Inköpslista (manuell)
- Måltidsplan (kalender, manuella måltider)
- Utgångsvy i appen (dashboard)
- Grundläggande hushållssync för 2 personer

### 3.2 Pro

| Upplåsning | Värde |
|------------|-------|
| Lagerrader | Obegränsat (praktiskt tak sätts senare vid missbruk, t.ex. 5 000) |
| Hushållsmedlemmar | **6** |
| AI-skannar | Obegränsat (fair use / rate limit per minut) |
| Kvitto-PDF | Obegränsat |
| Smart fill | Obegränsat |
| Lager-insights (AI) | Ja |
| Statistik (`/statistik`) | Full dashboard |
| Framtida: e-postutgångspåminnelser | Ingår i Pro när punkt 5 levererat |
| Framtida: **Grannskafferiet** — större sökradie (t.ex. **2 km** vs 500 m free) | Kod live; soft CTA på `/grannskafferiet` tills Stripe checkout |
| **Grannskafferiet** — push när någon nära delar | **Gratis** med opt-in (v2a) |

**Grannskafferiet-monetisering:** Free ser delningar inom 500 m (lista + karta) och får **gratis nearby-push** med opt-in. Pro ger **2 km** sökradie (`getNearbyRadiusM` i `plan.ts`) och **72 h** share-TTL för sharers. Se [`GRANNSKAFFERIET_V1.md`](./GRANNSKAFFERIET_V1.md).

**Prishypotes (ej live):**

| Plan | SEK |
|------|-----|
| Månad | 39 |
| År | 299 (~36 % rabatt vs 12× månad) |

Jämförelseband från marknaden: 29–49 kr/mån, 199–399 kr/år.

---

## 4. AI-enhetsekonomi (grovt)

Modell i produktion: **gpt-4.1-mini** (se integritetspolicy).

| Åtgärd | Uppskattad kostnad (SEK) | Anteckning |
|--------|--------------------------|------------|
| Kvitto-PDF parse | 0,15 – 0,80 | Beror på sidantal/tokens; ICA/Kivra-PDF varierar |
| Foto → produkt (AI) | 0,05 – 0,25 | En bild + kort strukturerat svar |
| Smart fill | 0,05 – 0,40 | Lager-sammanfattning + förslag |
| Receptidéer / insights | 0,05 – 0,30 | Kortare kontext |

**Exempel — aktiv Free-användare per månad (worst reasonable):**

- 5 PDF × 0,50 kr ≈ 2,50 kr  
- 15 AI-skannar × 0,15 kr ≈ 2,25 kr  
- 8 smart fill × 0,20 kr ≈ 1,60 kr  
- **≈ 6–7 kr/mån** AI-kostnad

**Pro-användare** utan tak kan kosta 30–80 kr/mån vid tung kvittoanvändning — därför måste Pro-pris täcka drift + marginal, och rate limits (#11 i 90-dagarslistan) skyddar mot missbruk.

Konstanter i kod: `AI_UNIT_ECONOMICS` i `src/lib/domain/plan.ts`.

---

## 5. Kommunikation före paywall

| Kanal | Innehåll |
|-------|----------|
| **FAQ** (`/faq`) | Gratis att börja; planer och gränser förklaras innan betalning aktiveras |
| **Priser** (`/priser`) | Kort sammanfattning av Free vs Pro och prishypotes |
| **Inställningar** | Sektion “Plan” — nuvarande nivå Free, vad Pro ger, “kommer snart” |
| **Integritet** | AI-användning redan beskriven; vid betalning tillkommer köpvillkor |

**Principer:**

1. Inga överraskningar — användaren ska veta vad som är gratis innan de når en gräns.
2. Vid gräns (framtida): tydlig modal med “uppgradera” eller “vänta till nästa period”, inte hård krasch.
3. Befintliga användare vid launch: grace period eller höjt tak 30 dagar (beslut vid Stripe).

---

## 6. När Stripe implementeras (triggers)

Implementera **inte** Stripe förrän alla nedan är uppfyllda eller medvetet avvikna med anteckning:

| Trigger | Mål | Var mäts |
|---------|-----|----------|
| **D30-retention** | ≥ 15 % tidigt, ≥ 25 % moget | PMF-dashboard `/admin` |
| **Betalande waitlist** | ≥ 50 användare som uttryckt vilja att betala | Manuell lista / enkel intresseknapp (ej byggd än) |
| **Rate limits på AI** | Punkt 11 klar | Skyddar marginal |
| **Juridik** | Köpvillkor + moms (B2C Sverige) | 1–2 h jurist när checkout live |

Konstanter: `STRIPE_READINESS_GATES` i `plan.ts`.

**Utanför scope tills dess:** Stripe SDK, Customer Portal, webhooks, fakturor, App Store IAP.

---

## 7. Teknisk förberedelse (nu)

| Fil | Syfte |
|-----|--------|
| `src/lib/domain/plan.ts` | `PlanTier`, `FREE_LIMITS`, `PRO_LIMITS`, prishypotes, Stripe-gates |
| `src/routes/settings/+page.svelte` | Visar plan (Free), Pro-fördelar, **användning mot gränser**, uppgraderingsbanner vid tak, länk `/priser` |
| `src/lib/application/plan-limits.service.ts` | Delad snapshot/check för UI och icke-AI-gränser (lager, medlemmar) |
| `src/lib/application/ai-rate-limit.service.ts` | Månads/vecka-räknare för AI (samma `FREE_LIMITS`) |
| `src/routes/(marketing)/priser/+page.svelte` | Publik sammanfattning |

**Nästa fas (Stripe):**

- `plan_tier` på `user` eller `household`
- Räknare per månad/vecka mot `FREE_LIMITS`
- Middleware på AI-endpoints
- Stripe Checkout + webhook → uppdatera tier

---

## 8. Öppna frågor (beslut senare)

1. **Per konto eller per hushåll?** Hypotes: fakturering på **hushåll** (en betalande ägare, alla medlemmar får Pro).
2. **Årsplan som default?** A/B vid launch.
3. **Student/rabattkod?** Efter första 100 betalande.
4. **Lifetime-erbjudande?** Endast early adopters, max 500 st.

---

## 9. Grannskafferiet — köparskydd (utkast v0.6)

*Status: **hypotes / utkast**. Gäller **inte** v0.4 (offline Swish vid mötet) eller v0.5 (mobile shell). Se [GRANNSKAFFERIET_MARKET_V06_ESCROW.md](./GRANNSKAFFERIET_MARKET_V06_ESCROW.md) för teknisk design.*

Om vi senare erbjuder **in-app escrow** (Stripe Connect, betalning före upphämtning) kan plattformen ta en **köparskyddsavgift** från köparen — liknande Vinted Buyer Protection, men anpassat för lokal mat med fysiskt möte.

### 9.1 Principer

| Princip | Beslut |
|---------|--------|
| **Vem betalar** | Köparen (transparent rad i checkout) |
| **Säljare** | Får listat `askingPriceSek` vid release efter "Upp hämtat"; ingen plattformsavgift på säljare i v0.6.0 |
| **Gratis listningar** | Ingen escrow — offline som v0.4 |
| **Pro-prenumeration** | Separat produkt (§3); köparskydd är **inte** inkluderat i Pro |
| **Stripe-kostnad** | Card processing (~1,4 % + 1,80 kr EU cards) äts av plattformen ur köparskyddsavgiften eller som separat rad — beslut vid implementation |

### 9.2 Fee-modeller (jämförelse)

| Modell | Exempel (35 kr vara) | Fördelar | Nackdelar |
|--------|---------------------|----------|-----------|
| **A — Fast avgift** | 5 kr köparskydd | Enkelt, förutsägbart | Hög % på billiga varor |
| **B — Procent + minimum** | 5 %, min 3 kr, max 25 kr | Skalar med pris | Kräver tydlig max-cap copy |
| **C — Steg** | 0–50 kr → 3 kr; 51–150 kr → 5 % | Balanserar små köp | Mer komplex UI |

**Rekommendation (utkast): modell B** — **5 % av `askingPriceSek`, minimum 3 kr, maximum 25 kr**, avrundat uppåt till hel krona.

Exempel:

| `askingPriceSek` | Köparskydd | Köpare betalar totalt |
|------------------|------------|------------------------|
| 15 kr | 3 kr (min) | 18 kr |
| 35 kr | 2 kr (5 % → **3 kr** min) | 38 kr |
| 80 kr | 4 kr | 84 kr |
| 200 kr | 10 kr | 210 kr |
| 600 kr | 25 kr (cap) | 625 kr |

*Notera: 5 % av 35 kr = 1,75 kr → minimum 3 kr gäller.*

### 9.3 Vad köparskydd täcker (produktcopy — utkast)

- Pengar hålls tills **båda** bekräftat upphämtat i appen (samma som v0.3 handover).
- Vid utebliven leverans / avbruten affär **före** handover: återbetalning till köparen.
- Vid allvarlig rapport (`unsafe`, `misleading` under review): escrow fryses; manuell prövning.
- **Efter** lyckad handover: ingen automatisk återbetalning — kvalitet hanteras via betyg + support (som Vinted efter "Allt OK").

FAQ-sats: *"Köparskyddet är en serviceavgift till Skaffu för reserverad betalning och medling vid avbrutna affärer före upphämtning. Skaffu säljer inte maten."*

### 9.4 Enhetsekonomi (grovt)

Antag modell B, 35 kr vara, 3 kr köparskydd:

| Post | SEK |
|------|-----|
| Köparskyddsintäkt | 3,00 |
| Stripe card (~1,4 % + 1,80 på 38 kr total) | ≈ −2,33 |
| **Bruttomarginal per escrow-transaktion** | ≈ **0,67** |

Låg marginal per transaktion — escrow är **trust / retention**, inte primär intäktsmotor. Volym eller högre cap behövs för meningsfull intäkt; alternativt lägre processing via debitering på totalbelopp med `application_fee_amount`.

**Trigger för att låsa fee:** ≥ 200 escrow-transaktioner i admin-lab + dispute rate < 2 %.

### 9.5 Teknisk mappning

| Concept | Plats |
|---------|--------|
| Fee-beräkning | Ny domain `market-escrow-pricing.ts` (v0.6) |
| Stripe `application_fee_amount` | `MarketEscrowService` vid PI create |
| Visning i checkout | "Vara 35 kr + Köparskydd 3 kr = 38 kr" |
| Befintlig Pro-Stripe | [`src/lib/server/stripe.ts`](../src/lib/server/stripe.ts) — endast prenumeration idag |

---

## 10. Relaterade dokument

- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) — §12 Monetisering, §15 punkt 6  
- [ROADMAP.md](./ROADMAP.md) — Fas 1 Stripe / paywall
- [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md) — checklista (fas 0)  
- [BRAND.md](./BRAND.md) — ton vid paywall-copy  
- [GRANNSKAFFERIET_MARKET_V05_SHELL.md](./GRANNSKAFFERIET_MARKET_V05_SHELL.md) — Mobile shell (shipped v0.5)
- [GRANNSKAFFERIET_MARKET_V06_ESCROW.md](./GRANNSKAFFERIET_MARKET_V06_ESCROW.md) — Connect escrow design (v0.6)  
- `src/lib/marketing/content.ts` — FAQ-svar om pris

---

*Senast uppdaterad: jun 2026 (Grannskafferiet köparskydd utkast v0.6; v0.5 shell shipped). Ändra denna fil när gränser eller prishypotes justeras — håll `plan.ts` i synk.*
