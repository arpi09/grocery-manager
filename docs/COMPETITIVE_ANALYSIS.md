# Konkurrensanalys — Home Pantry

*Version: maj 2026 (senast reviderad 31 maj 2026). Baserad på kodbas (`docs/BRAND.md`, `docs/MARKETING_SITE.md`, `src/lib/marketing/content.ts`) och öppna källor om marknaden.*

> **Produktroadmap efter 90 dagar:** [ROADMAP.md](./ROADMAP.md) · **Nästa 30 dagar (ägare):** [NEXT_STEPS.md](./NEXT_STEPS.md)

---

## Nuvarande läge (uppdaterad 31 maj 2026)

**Home Pantry är inte färdig och har inte product-market fit än.** Den första 90-dagarsplanen ([`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md)) är i praktiken genomförd: onboarding, PWA, PMF-mätetal, e-postutgångspåminnelser, rate limits, marknadswebb, prishypotes och m.m. är levererade i kod. Det som saknas är **bevisad retention**, **betalande användare** och **vardagsvana** — inte fler Must-features i isolation.

### Shipped sedan analysen skrevs

| Område | Status nu | Konkurrensposition |
|--------|-----------|-------------------|
| **PMF-instrumentering** | `/admin` med aktivering, D7/D30, veckoscan, WoW-delta | Få indie-konkurrenter visar detta internt; ger oss datadriven iteration |
| **Onboarding scan-first** | 2-stegs guide, kvitto eller 5 streckkoder, aktiveringsfirande | Minskar höns-ägg-problemet; Matdags har liknande men native onboarding |
| **PWA + installguide** | Manifest, `/install-app`, banner på `/hem` | Delvis stänger webb-only-gap; **inte** samma som App Store + push |
| **E-post utgångspåminnelser** | Veckodigest, opt-in, cron | Matdags har **native push**; vi har en kanal, inte full parity |
| **AI rate limits + Free-gränser** | `AiRateLimitService`, UI i inställningar | Skyddar enhetsekonomi; **Stripe/checkout saknas** — ingen intäkt |
| **Smart inköpslista** | AI-fill, export till clipboard (Bring-format) | Differentiator vs Bring/ICA; Matdags har lista utan samma plan+lager-koppling |
| **Recept från lager v2** | Strikt lagerprompt, portioner, saknade → inköpslista | Närmare Matbotten på plan — men **retention** avgör om det märks |
| **Scan-kvalitet SV** | Favoriter, senaste varor, snabb redigering | Minskar OFF-frustration; fortfarande svagare än dedikerade barcode-DB |
| **Kvitto-PDF** | Bild + PDF, OpenAI-parse, E2E med mock | **Synthetic CI-fixtures**; riktig ICA/Kivra-korpus hos ägare ej i repo |
| **Marknadswebb** | Hero A/B, jämförelsetabell, `/priser`, UTM | Tydligare mot ICA/Bring/Matdags; **launch i communities** = ägaruppgift |
| **E2E** | 23 tester (8 spec-filer, se [E2E.md](./E2E.md)) | Höjer deploy-säkerhet; kvittoparse i prod ej fullt täckt i E2E |

### Fortfarande ej shipped (kritiska gap)

| Gap | Konsekvens vs konkurrenter |
|-----|---------------------------|
| **Native iOS/Android + push** | Matdags och FreshKeeper vinner vardagsvana och utgångspåminnelser i bakgrunden |
| **Stripe / Pro-betalning** | Alla konton Free; AI-kostnad växer utan intäkt |
| **D30-retention på mål** | PMF-dashboard finns — **målen är inte nådda** (data fylls av ägare) |
| **Riktig kvitto-PDF-korpus i CI** | Risk för regress i ICA/Kivra-format i produktion |
| **Web push** | E-post räcker inte för alla; PWA-notiser ej implementerade |

### Reviderade hot och möjligheter

**Hot (oförändrat eller skärpt):**

- **Matdags 🔴** — Fortfarande närmaste 1:1-konkurrent. Vår stack har nu PDF + plan+lager + hushåll, men **distribution (App Store) och push** går fortfarande till dem om retention inte håller.
- **ICA/Bring 🔴/🟠** — Marknadswebben adresserar “varför inte bara ICA?”; **vanan** hos majoriteten kvarstår.
- **FreshKeeper 🟡→🟠** — Stiger om de lanserar Android + kvitto med native notiser.

**Möjligheter (stärkta av levererat arbete):**

- **Kvitto-PDF + Kivra-guide** — Fortfarande sällsynt globalt; kan bli tydlig huvudstory om parsing-kvalitet bevisas med riktiga PDF:er.
- **Butiksneutral lager-sanningskälla** — Smart fill + recept från faktiskt lager skiljer från Bring och ren måltidsplanering.
- **Datadriven iteration** — PMF-dashboard + intervjukit + feedback i appen gör att solo-byggaren kan prioritera retention före feature-paritet.
- **Freemium redo i kod** — Gränser och rate limits på plats; **intäkt** kräver bara Stripe + betalande kohort (se [PRICING.md](./PRICING.md)).

**Ärlig slutsats:** Feature-bredden närmar sig Matdags på papper, men **retention och betalning** är fortfarande huvudgapet — inte streckkod eller kvitto i sig. Se avsnitt 13 (PMF-kriterier) och [ROADMAP.md](./ROADMAP.md) fas 1.

---

## 1. Sammanfattning

Home Pantry positionerar sig som **skanna-först-skafferihantering** för svenska hushåll: streckkod, kvitto (bild/PDF) och foto → lager i kyl/frys/skafferi → utgångsdatum → smart inköpslista och måltidsplan. Produkten är en **webbapp** (SvelteKit på Firebase App Hosting) med marknadsplats på `/` och inloggad app från `/hem`, inte en native App Store-app.

Den starkaste differentieringen mot listappar (Bring!, ICA) och ren måltidsplanering (Matbotten, Mealime) är **lagret som sanningskälla** — inköpslistan ska spegla vad som faktiskt finns hemma. Den starkaste hotbilden i Sverige kommer från **Matdags** (nästan samma löfte, native appar, gamification) och **gratis retailer-appar** (ICA/Coop) som redan äger listan och lojaliteten.

För en solo/indie-byggare är vägen till framgång inte att konkurrera med ICA på erbjudanden, utan att vinna **ett smalt segment**: hushåll som redan försökt minska dubbelköp och matsvinn och som vill ha **butiksneutral** skanneri + hushållssync utan att byta matkedja.

---

## 2. Home Pantry idag

### 2.1 Positionering (kommunikation)

| Element | Innehåll |
|--------|----------|
| Tagline | *Skanna först. Håll koll på skafferiet. Handla smart.* |
| Primär marknad | Sverige (SV), engelska via i18n i appen |
| Ton | Varm, direkt, köksnära — se `docs/BRAND.md` |
| Löfte | Snabb registrering, överblick per plats, mindre gissning vid handel |
| Pris i FAQ | Gratis att komma igång; betalda planer “meddelas i förväg” |

Marknadswebben (`homepantry.com` / `/funktioner`) betonar: streckkod, kvitto & foto, kyl/frys/skafferi, smart inköpslista, hushåll, måltidsplan & recept.

### 2.2 Funktioner som faktiskt finns i repot (shipped)

| Område | Status | Kommentar |
|--------|--------|-----------|
| **Streckkodsskanning** | Shipped | Kamera i webbläsare; produktlookup via **Open Food Facts** (global DB, varierande SV-täckning) |
| **Manuell inmatning** | Shipped | Per vara, plats, mängd, utgångsdatum |
| **Kvitto** | Shipped | Bild + **PDF** (textextraktion) → OpenAI-strukturerad parsing |
| **Foto av produkt** | Shipped | AI läser etikett (`/api/product-from-image`) |
| **Lager kyl/frys/skafferi** | Shipped | Färgkodade platser, filter, sök, dashboard `/hem` |
| **Utgång / snart ut** | Shipped | Dashboard-sektion, inventory-insights (AI) |
| **Inköpslista** | Shipped | Manuell + **SmartShoppingFill** (AI från lager, utgång, måltidsplan, receptidéer) |
| **Måltidsplan** | Shipped | Kalender `/planer`, planerade måltider, receptidéer (AI) |
| **Hushåll** | Shipped | Inbjudan, roller (t.ex. read-only), delat lager/lista |
| **Statistik** | Shipped | `/statistik` — analytics-dashboard |
| **Husdjur** | Shipped (valfritt) | Separat modul om aktiverad |
| **Marknadswebb** | Shipped v1 | Landing, funktioner, hur det funkar, FAQ |
| **Deploy** | Shipped | Firebase App Hosting, en pipeline |
| **Native iOS/Android** | Ej shipped | Endast webb/PWA-liknande upplevelse |
| **Push-notiser** | Ej shipped | **E-post** utgångsdigest shipped; ingen OS/web push i bakgrunden |
| **Butikspriser / erbjudanden** | Ej shipped | Medvetet bort från ICA-integration |
| **Offline** | Begränsat | Kräver nät för AI och sync |

### 2.3 Planerat / marknadsfört men tunt eller framtida

- **Engelsk marknadswebb** — struktur i `content.ts`, copy mest stub.
- **Betalning** — gränser och rate limits i kod; **ingen Stripe/checkout**; FAQ lovar förhandsinfo.
- **Automatisk påminnelse** — e-postdigest shipped; web push och OS-notis saknas.
- **“Gratis för alltid”** — affärsmodell ej låst i produkt.

### 2.4 Teknisk differentiering (ärligt)

**Styrkor:** Kvitto-PDF + guide för Kivra/e-post (svensk vardag); ett flöde från scan → lager → AI-inköpslista → plan; hushåll utan retailer-lock-in; modern UI enligt brand guide.

**Svagheter:** Webb-only minskar vardagsvana vs App Store; Open Food Facts är svag på svenska egna märken; AI-kostnad per kvitto/fyllning; kallstart kräver att användaren bygger lager (höns-ägg-problemet).

---

## 3. Konkurrenslandskap per kategori

### A. Skafferi / heminventering (global + Norden)

| Aktör | Fokus |
|-------|--------|
| **NoWaste** | Kyl/frys/skafferi, utgång, streckkod (Pro), miljontals produkter i Pro |
| **Pantry Check** | Inventering + lista, familjesync, iOS-tung, 200 gratis poster |
| **KitchenPal / Pantrist** | Inventering + recept + lista, internationellt |
| **Matdags** | **Sverige**, AI-foto/kvitto/streckkod, gamification, native |
| **FreshKeeper** | **Sverige**, FEFO, lansering iOS, 39 kr/mån premium |

### B. Inköpslista / hushåll

| Aktör | Fokus |
|-------|--------|
| **Bring!** | Delad lista, recept, reklam/erbjudanden, Premium ~9 USD/år |
| **OurGroceries** | Extremt enkel sync, billig premium |
| **AnyList** | Lista + receptimport + måltidskalender, Complete ~10–15 USD/år |
| **Listonic** | Lista med annonser |
| **ICA / Coop** | Lista + stammis/medlem + butikskarta + betala |

### C. Matsvinn / utgång (annan vinkel)

| Aktör | Fokus |
|-------|--------|
| **Too Good To Go** | Köp överskottsmat billigt (butik/restaurang) |
| **Olio / Karma** | Dela/rädda mat lokalt |
| **NoWaste / Matdags / FreshKeeper** | *Förebygga* svinn hemma via lager |

Home Pantry konkurrerar i tredje gruppen, inte med TGTG.

### D. Recept + måltidsplan + handel

| Aktör | Fokus |
|-------|--------|
| **Matprat / Köket** | Recept + inspiration (ICA), svag lagerkoppling |
| **Matbotten** | AI-veckomeny → export till Bring!/Mathem |
| **MatPlan** | Egen receptbok + veckomeny + butiksordnad lista |
| **Mealime** | Snabb vardagsmat, auto-lista, Pro ~3 USD/mån |
| **Plan to Eat** | BYO-recept, kalender, ~49 USD/år, ingen gratis nivå |

### E. Kvitto / streckkod / retailer

| Aktör | Fokus |
|-------|--------|
| **ICA** | Streckkod → **inköpslista** (inte lager), Kivra-kvitto separat |
| **Coop** | Lista, Scan & Pay, hållbarhetsscan |
| **Matpriskollen** | Prisjämförelse + scan → lista |
| **Matdags** | Kvitto → **lager** (direkt konkurrent) |

---

## 4. Tolv huvudkonkurrenter (profiler)

Bedömning **hotnivå** mot Home Pantry: 🔴 hög · 🟠 medel · 🟡 låg (relativt ditt fokus på SV skafferi-scan).

### 4.1 Matdags — 🔴

| | |
|--|--|
| **Målgrupp** | Miljö- och plånboksmedvetna hushåll i Sverige |
| **Kärnjobb** | “Vad har jag hemma?” + minska svinn + recept från kylen |
| **Styrkor** | Native iOS/Android, foto av kyl, kvitto, streckkod, påminnelser, gamification, svensk copy, data i SE enligt sajt |
| **Svagheter** | Ung produkt; premium 29 kr/mån; AI-fel; mindre “planeringspro” än Plan to Eat |
| **Pris** | Gratis; Premium **29 kr/mån** |
| **Marknad** | Sverige |
| **Hot** | Nästan 1:1 med Home Pantry-löftet, starkare distribution (App Store) |

### 4.2 ICA-appen (inkl. inköpslista) — 🔴

| | |
|--|--|
| **Målgrupp** | ICA-stammisar (~50 % dagligvaruhandel) |
| **Kärnjobb** | Erbjudanden, lista, betala, recept |
| **Styrkor** | Gratis, stammispriser, butikskarta, scanninghandtag, varumärke |
| **Svagheter** | Ingen riktig lagerhållning; lista ≠ skafferi; låst till ICA |
| **Pris** | Gratis (stammis) |
| **Marknad** | Sverige |
| **Hot** | “Bra nog” lista för majoriteten; svår att flytta lojalitet |

### 4.3 Bring! — 🟠

| | |
|--|--|
| **Målgrupp** | Familjer/hushåll som delar handel |
| **Kärnjobb** | Gemensam inköpslista + erbjudanden |
| **Styrkor** | Marknadsledare lista i DACH/Norden, sync, svenska språk |
| **Svagheter** | Ingen expiry-lager; listan vet inte vad som finns hemma |
| **Pris** | Gratis; Premium ~**9 USD/år** |
| **Marknad** | Global, stark i Norden |
| **Hot** | Default-lista; Matbotten exporterar hit |

### 4.4 NoWaste — 🟠

| | |
|--|--|
| **Målgrupp** | Waste-conscious globalt |
| **Kärnjobb** | Inventera, utgång, handla mindre fel |
| **Styrkor** | Moget, kyl/frys/skafferi, Pro-barcode DB |
| **Svagheter** | UX/buggrapporter; svag SV-lokalisering; ingen kvitto-PDF-story |
| **Pris** | Freemium; Pro ~**7 USD/år** eller lifetime ~30 USD |
| **Marknad** | Global |
| **Hot** | App Store-sök “food inventory”; inte SV-fokuserad |

### 4.5 Matpriskollen — 🟠

| | |
|--|--|
| **Målgrupp** | Prisjägare i Sverige |
| **Kärnjobb** | Hitta billigast / erbjudanden / jämför korg |
| **Styrkor** | 300k+ användare, scan→pris, butiksöversikt, gratis |
| **Svagheter** | Ingen djup lagerhållning; annonsfinansierad |
| **Pris** | Gratis |
| **Marknad** | Sverige |
| **Hot** | Tar “scan”-vanan; annan payoff (pris inte lager) |

### 4.6 Matbotten — 🟠

| | |
|--|--|
| **Målgrupp** | “Vad ska vi äta?”-trötta hushåll |
| **Körnjobb** | Veckomeny + inköpslista |
| **Styrkor** | Snabb AI-meny, SV, export Bring!/Mathem |
| **Svagheter** | Svag inventering; pantry som sekundär |
| **Pris** | Gratis 3 dagar/vecka; **19–49 kr/mån** |
| **Marknad** | Sverige |
| **Hot** | Tar planerings-intent; kan komplettera er |

### 4.7 Pantry Check — 🟡

| | |
|--|--|
| **Målgrupp** | iOS-hushåll (USA-tung) |
| **Kärnjobb** | Inventering + smart lista + expiry |
| **Styrkor** | Barcode, familj, usage-baserad lista |
| **Svagheter** | Ingen Android officiellt; begränsad 200 items gratis |
| **Pris** | Gratis 200 poster; abonnemang för lagring |
| **Marknad** | Global, USA |
| **Hot** | Låg i Sverige om inte App Store-rank |

### 4.8 Coop-appen — 🟡

| | |
|--|--|
| **Målgrupp** | Coop-medlemmar |
| **Kärnjobb** | Erbjudanden, lista, Scan & Pay |
| **Styrkor** | Gratis, poäng, onlinehandel |
| **Svagheter** | Som ICA — ingen neutral skafferi-modell |
| **Pris** | Gratis (medlemskap) |
| **Marknad** | Sverige |
| **Hot** | Endast om användaren redan är Coop-trogen |

### 4.9 AnyList — 🟡

| | |
|--|--|
| **Målgrupp** | USA-hushåll, receptimporterare |
| **Kärnjobb** | Delad lista + recept + enkel plan |
| **Styrkor** | Billig Complete, webb, moget |
| **Svagheter** | Ingen skafferi-scan; svag SV |
| **Pris** | Gratis lista; **~10–15 USD/år** household |
| **Marknad** | Global |
| **Hot** | Låg i SE om inte expats |

### 4.10 Mealime — 🟡

| | |
|--|--|
| **Målgrupp** | Snabb vardagsmat |
| **Kärnjobb** | Veckomeny + lista |
| **Styrkor** | 4.5M+ användare, enkel UX |
| **Svagheter** | Ingen lager; begränsad portion/anpassning |
| **Pris** | Gratis middag; Pro ~**3 USD/mån** |
| **Marknad** | Global |
| **Hot** | Indirekt — annat jobb-to-be-done |

### 4.11 FreshKeeper — 🟡 (stigande)

| | |
|--|--|
| **Målgrupp** | SV matsvinn |
| **Kärnjobb** | FEFO + påminnelser |
| **Styrkor** | Tydlig SV prissättning, obegränsat gratis lager enligt sajt |
| **Svagheter** | Kommer snart; mindre AI/kvitto-story än Matdags/HP |
| **Pris** | Gratis; Premium **39 kr/mån** |
| **Marknad** | Sverige |
| **Hot** | Kan bli 🔴 när de lanserar Android + kvitto |

### 4.12 Plan to Eat — 🟡

| | |
|--|--|
| **Målgrupp** | Recept-samlare |
| **Kärnjobb** | Planera från egna recept → lista |
| **Styrkor** | Djup planering, BYO-recept |
| **Svagheter** | Ingen scan-lager; ingen gratis nivå |
| **Pris** | **49 USD/år** efter 14 dagars prov |
| **Marknad** | Global |
| **Hot** | Överlapp bara på “lista från plan” |

---

## 5. Positioneringskarta

```mermaid
quadrantChart
    title Scan-/lagerfokus vs butiks-/listfokus
    x-axis Låg lager-depth --> Hög lager-depth
    y-axis Butiksneutral --> Butiks-/kedje-låst
    quadrant-1 Nisch: neutral + lager
    quadrant-2 Retailer super-appar
    quadrant-3 Enkla listor
    quadrant-4 Lista + erbjudanden
    Home Pantry: [0.82, 0.78]
    Matdags: [0.80, 0.75]
    NoWaste: [0.75, 0.70]
    Pantry Check: [0.78, 0.65]
    Bring: [0.15, 0.55]
    ICA Coop: [0.20, 0.95]
    Matpriskollen: [0.25, 0.60]
    Matbotten Mealime: [0.35, 0.50]
    AnyList: [0.30, 0.40]
```

**Tolkning:** Home Pantry och Matdags fightas i övre högra “neutral + lager”. Bring/ICA vinner på vana och distribution i nedre halvan. Matbotten/Mealime sitter i mitten — plan utan full lager-sanningskälla.

---

## 6. Gap-analys — vad svenska användare vill ha som konkurrenter gör dåligt

| Önskat utfall | Gap hos konkurrenter | Home Pantry-möjlighet |
|---------------|---------------------|------------------------|
| “Slipp köpa mjölk igen” | Bring/ICA listar inte lager | Lager + smart fill |
| Kvitto från ICA/Kivra utan manuell matris | Matdags ja; Bring nej; ICA lagrar i Kivra men importerar inte till lager | PDF/bild + Kivra-guide — **differentiator om det funkar bra** |
| Butiksneutral (ICA + Willys + Lidl) | Retailer-appar låsta | Tydlig messaging |
| Familj sync utan stammiskonto | ICA kräver stammis; Bring bra men utan expiry | Hushåll med roller |
| Påminnelse innan utgång | HP har e-post; Matdags har native push | **Web push eller native** kvar som kritisk lucka |
| Svenska produktnamn vid scan | OFF svag; Matdags investerar i AI | Egen produktcache / manuell override |
| Prispress i inflationstider | Matpriskollen stark; lager-appar svaga | Senare: “köp bara det som saknas” räcker för många |
| Integritet / inte sälja data | Plan to Eat säljer inte data; Matpriskollen annonser | Privacy-first, EU-hosting-story |
| Låg friktion första kvällen | Inventering känns jobbig överallt | Scan-först onboarding (redan i produkt) |

---

## 7. Moat-kandidater (realistiska för indie)

1. **Hushållssync med lager + lista + plan** i ett flöde (Bring har inte lager; Matbotten har svagt lager).
2. **Kvitto-PDF + svensk Kivra-vägledning** — få globala appar gör PDF + nordisk kvittokultur.
3. **Scan-first UX** — FAB, dashboard, tre steg på marknadswebben.
4. **Butiksneutral “mitt skafferi”** — inte konkurrera med stammisrabatter.
5. **Kombinerad AI** — insights + shopping fill + recept från *faktiskt* lager (om kvaliteten håller och kostnad kontrolleras).
6. **Varumärke & trust** — svensk ton, homepantry.com, transparent data/FAQ.

**Ej moat (ännu):** produktdatabas, priser, native distribution, betalningsvolym.

---

## 8. Risker

| Risk | Konsekvens | Mitigering |
|------|------------|------------|
| Retailer gratis | Användaren “har redan ICA” | Nisch: lager + neutral + hushåll |
| Matdags växer snabbt | SV App Store sökdominans | Snabbare polish + push + word-of-mouth |
| AI-kostnad | Marginal äter subscription | Rate limits, cache, billigare modeller för enkla jobb |
| Vaneändring / datainmatning | Churn efter vecka 1 | Kvitto-batch, onboarding, “10 varor räcker” |
| OFF / fel scan | Misstro | Snabb manuell korrigering, svenska defaults |
| Webb-only | Ingen notis, sämre kamera | PWA + “Lägg till på hemskärm”; senare wrapper |
| Solo kapacitet | Långsam feature-takt | Must/Should/Later hårt |
| GDPR/kvitto | Juridisk osäkerhet | Policy, datalagring, radera konto (finns) |

---

## 9. Ideal Customer Profile (ICP)

**Primär ICP (vinn först):**  
Par eller familj i **storstad/suburb Sverige**, 28–45 år, handlar 2–3 gånger/vecka på **olika kedjor**, irriterade på **dubbelköp och utgången yoghurt**, tech-vana nog för webbapp, inte lojala enbart till en kedja.

**Sekundär:**  
Roommates som delar kyl; **waste-conscious** (hört om 6000 kr/år-slängt); redan provat Bring! men saknar “vad finns hemma?”.

**Senare (inte först):**  
Meal planners som vill importera 200 recept (Plan to Eat-segmentet); prisjägare (Matpriskollen); stammis-only ICA-familjer.

**Anti-ICP:**  
Enperson som bara vill ha en papperlös lista; användare som kräver perfekt svensk barcode-databas dag ett.

---

## 10. Go-to-market

### Kanaler (realistiska för indie)

| Kanal | Varför |
|-------|--------|
| **SEO + homepantry.com** | “minska matsvinn app”, “skafferi app”, “inköpslista hushåll” |
| **Reddit/Facebook SV-grupper** | Matplanering, hållbarhet, ekonomi |
| **TikTok/Instagram kort** | Före/efter: skanna kvitto → se lager |
| **Product Hunt / Hacker News** | Engelska tech-crowd (sekundärt) |
| **Partnerskap light** | Hushållningssällskap, matsvinn-bloggare — ingen ICA-co-marketing |

### Messaging

- **Huvud:** “Skanna först — handla bara det som saknas.”
- **Mot Bring:** “Listan vet vad som finns i kylen.”
- **Mot ICA:** “Ett skafferi för hela hushållet, inte bara ICA-handel.”
- **Mot Matdags:** Differentiera på **PDF-kvitto**, **måltidsplan kopplad till lager**, **butiksneutral**, **ingen gamification-krav** (om det passar målgruppen).

### Domänstrategi

- **Rekommendation v1:** En domän (`homepantry.com` → samma deploy): `/` marknad, `/login` app — enligt `docs/MARKETING_SITE.md`.
- **`PUBLIC_APP_URL`:** Endast om marketing och app splittras senare.
- **CTA:** “Kom igång gratis” → registrering → **tvinga inte** full inventering dag 1; led till ett kvitto-scan.

---

## 11. Produktroadmap för framgång

Prioriterat mot konkurrentgap och solo-kapacitet.

**OBS (31 maj 2026):** Must-fasen är i stort sett levererad. Se [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md), avsnitt *Nuvarande läge* ovan och aktiv master-roadmap [`ROADMAP.md`](./ROADMAP.md).

### Must (0–3 månader) — historik, i stort sett klart

1. **Onboarding som mäter aktivering** — första scan inom 5 min, mål 10 varor.
2. **PWA + “Lägg till på hemskärm”** + tydlig iOS/Android-installationsguide (webb).
3. **Utgångspåminnelser** — e-post eller web push (minst ett kanal).
4. **Scan-kvalitet SV** — snabb redigering, favoritprodukter, “senaste varor”.
5. **Smart fill stabil & billig** — rate limit, tydlig felcopy utan API-nyckel.
6. **Marknadswebb: jämförelse/sektion “Varför inte bara ICA?”** — ärlig FAQ.
7. **Analytics för PMF** — se avsnitt 13.

### Should (3–6 månader)

8. **Export/delning inköpslista** (Bring-kompatibel copy-paste eller CSV).
9. **Förbättrad kvitto-PDF** för ICA/Kivra-format (testsvit med riktiga mallar).
10. **Enkel prissättning** — freemium-gräns (AI-scan, antal varor, hushållsstorlek).
11. **Recept från lager v2** — färre hallucinationer, portioner.
12. **App Store wrapper** (Capacitor/TWA) om retention kräver det.

### Later (6–12 månader) — se ROADMAP.md fas 2

13. Native notiser, offline-läsning.
14. Prisjämförelse / erbjudande (endast om tydlig partner — annars skip).
15. Mathem/Willys API (osannolikt för indie).
16. B2B ( BRF, catering ) — endast efter B2C PMF.

---

## 12. Monetisering

| Modell | Passform | Kommentar |
|--------|----------|-----------|
| **Freemium** | ⭐ Bäst | Gratis: manuell + begränsad AI; Pro: obegränsad scan/AI, fler hushållsmedlemmar |
| **Prenumeration** | ⭐ | Matdags 29 kr, FreshKeeper 39 kr, NoWaste ~60 kr/år → **29–49 kr/mån** eller **199–399 kr/år** rimligt |
| **Engångslifetime** | Alternativ | NoWaste-modell; bra för tidig cash, sämre LTV |
| **Affiliate Mathem** | Senare | Kräver volym; Matbotten gör det |
| **B2B** | Senare | Skolor, kommuner — lång sales cycle |
| **Annonser** | ⚠️ | Matpriskollen-väg; krockar med privacy-story |

**Rekommendation:** Gratis kärna (lager, manuell lista, hushåll 2 personer) + **Pro** för AI-kvitto/fyllning, PDF, insights, statistik, >N varor. Kommunicera innan paywall — som FAQ redan lovar.

---

## 13. Mätetal för product-market fit

| Metric | Varför | Mål (indikativt) |
|--------|--------|------------------|
| **Aktivering** | % som registrerar ≥10 varor eller 1 kvitto inom 24 h | >40 % |
| **Tid till första scan** | Friktion | <3 min median |
| **Veckoscan-rate** | Vana | >30 % WAU scannar något |
| **D7 / D30 retention** | PMF | D30 >15 % tidigt, >25 % moget |
| **Hushåll med 2+ aktiva** | Moat | >50 % av aktiva konton |
| **Smart fill / lista användning** | Differentiator | >20 % av handlande användare/vecka |
| **Utgångsvaror konsumerade** | Värde | självrapporterat eller “markerad förbrukad” |
| **NPS / enkät** | Kvalitativ | “Skulle du sakna appen?” >40 % “Mycket besviken” |

Instrumentera i befintlig statistik-sida + server events (scan_completed, receipt_parsed, fill_suggestions_added).

---

## 14. Vad du behöver (resurser)

| Område | Behov | Indie-realitet |
|--------|-------|----------------|
| **Produkt/eng** | Du + ev. frilans design/QA | Behåll scope smalt |
| **Legal** | Integritetspolicy, kvitto/AI-disclaimer, GDPR register | Mall + jurist 1–2 h när betalning |
| **Infra** | Firebase, DB, OpenAI-budget, monitoring | Sätt månadstak AI |
| **Support** | hello@homepantry.com | FAQ + autosvar |
| **Partnerskap** | Ej ICA; ev. matsvinn-influencers | Barter, inte betalt |
| **Distribution** | ASO senare; nu SEO + word of mouth | |
| **Kapital** | Valfritt — prenumeration täcker drift tidigt | |

Du behöver **inte:** eget lagerhus, butiksavtal, kundtjänst 24/7, eller native team dag ett.

---

## 15. Ursprunglig 90-dagarslista (historik)

Punkterna 1–15 (plus tillägg 16–20) är dokumenterade i [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md) som **klara eller ägaruppgifter**.

**Nästa steg:** [`NEXT_STEPS.md`](./NEXT_STEPS.md) och [`ROADMAP.md`](./ROADMAP.md) fas 1–2 — retention, Stripe-gate, kvitto-korpus, launch, dag-90-beslut.

<details>
<summary>Originalpunktlista (1–15)</summary>

1. **Sätt PMF-mätetal** i kod/analytics (aktivering, scan, retention).
2. **Förenkla första sessionen** — kvitto ELLER 5 streckkoder, inte “fyll hela skafferiet”.
3. **Publicera integritet + AI-policy** på `/faq` eller `/privacy`.
4. **PWA + installguide** för iPhone/Android.
5. **Implementera utgångspåminnelse** (e-post minimum).
6. **Prissättningshypotes** — dokumentera Pro-gränser; stripe senare.
7. **homepantry.com live** på en domän (Firebase custom domain).
8. **Landningssida A/B-copy** mot Bring/ICA/Matdags med ärliga jämförelser.
9. **10 användarintervjuer** (SV hushåll) — vad gjorde dem churna?
10. **Kvitto-PDF testpack** — 20 riktiga ICA/Kivra/Willys-PDF.
11. **Rate limits på AI** — skydda kostnad och missbruk.
12. **“Dela lista” export** — minst clipboard-format för Bring.
13. **Launch i 2–3 communities** (matsvinn, föräldrar, meal prep).
14. **Veckovis retention-granskning** — en metric dashboard du faktiskt läser.
15. **Beslut dag 90:** dubbla ner på webb+SV **eller** starta Capacitor-wrapper — baserat på D30, inte magkänsla.

</details>

---

## 16. Slutsats — kan Home Pantry bli en framgång?

**Ja, i en nisch — men inte ännu bevisat.** Efter 90 dagars leverans har produkten feature-paritet mot Matdags på flera axlar (kvitto, plan, hushåll, smart lista), men saknar PMF-signaler (retention, betalande, vardagsvana). Framgång kräver nu:

- **Retention först** — veckoscan, D30, intervjusyntes; e-post är start, push/native om data motiverar.
- **Tydlig Matdags-differentiering** — PDF/Kivra, plan+lager, butiksneutral (copy finns; distribution saknas).
- **Stripe när gates uppfylls** — annars växer AI-kostnad utan intäkt ([PRICING.md](./PRICING.md)).
- **Dag-90-beslut** — webb+SV vs Capacitor ([DAY_90_DECISION.md](./DAY_90_DECISION.md)).

Som solo/indie är unfair advantage **fokus, integritet och datadriven prioritering** — inte App Store-budget eller stammisrabatter.

---

*Källor: projektdokumentation maj 2026 (reviderad 31 maj 2026); publika pris-/funktionssidor för Matdags, Bring, NoWaste, Pantry Check, ICA, Coop, Matpriskollen, Matbotten, Mealime, Plan to Eat, AnyList, OurGroceries, Too Good To Go; App Store/Google Play-sammanfattningar.*
