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
| Aktiva lagerrader | **150** | Pantry Check ~200 gratis; vi vill inte kännas snålare än listappar men begränsa “arkiv-lager” |
| Hushållsmedlemmar | **2** | Täcker par/sambo; uppmuntrar Pro för familj/studenter |
| AI-skannar / månad | **15** | Streckkod+foto med AI-tolkning; räcker för ~1 skanning varannan dag |
| Kvitto-PDF-tolkningar / månad | **5** | Wow-moment utan att AI-budget sprängs |
| Smart fill (inköpslista) / vecka | **2** | Smak på differentiatorn; vardagsanvändare märker taket |

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

## 9. Relaterade dokument

- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) — §12 Monetisering, §15 punkt 6  
- [ROADMAP.md](./ROADMAP.md) — Fas 1 Stripe / paywall
- [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md) — checklista (fas 0)  
- [BRAND.md](./BRAND.md) — ton vid paywall-copy  
- `src/lib/marketing/content.ts` — FAQ-svar om pris

---

*Senast uppdaterad: maj 2026. Ändra denna fil när gränser eller prishypotes justeras — håll `plan.ts` i synk.*
