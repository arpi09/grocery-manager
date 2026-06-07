# Konkurrensanalys — Skaffu

*Version: jun 2026 (senast reviderad 7 jun 2026). Baserad på kodbas (`docs/BRAND.md`, `docs/MARKETING_SITE.md`, `src/lib/marketing/content.ts`) och öppna källor om marknaden.*

*Changelog jun 2026:* Utökad med internationella profiler (§3F, §4B), funktionsmatris (§4C), expat-gap (§6B), internationella lärdomar (§7B) och uppdaterad positioneringskarta.

> **Produktroadmap:** [ROADMAP.md](./ROADMAP.md) · **Nästa 30 dagar (ägare):** [NEXT_STEPS.md](./NEXT_STEPS.md) · **Domän:** [skaffu.com](https://skaffu.com) — [DOMAIN_STRATEGY.md](./DOMAIN_STRATEGY.md)

---

## Nuvarande läge (uppdaterad 7 jun 2026)

**Skaffu är inte färdig och har inte product-market fit än.** Fas 0 ([`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md)) är i stort sett genomförd; **Fas 1 pågår** (retention, launch, PMF-mätning). Det som saknas är **bevisad retention**, **betalande användare** och **vardagsvana** — inte fler Must-features i isolation.

**Prod:** [skaffu.com](https://skaffu.com) (apex + www→apex). Internt repo kan fortfarande heta `home-pantry`.

**Ägare (parallellt, blockerar inte kod):** användarintervjuer, veckovis PMF-granskning (dashboard + e-postcron), metrics i `/admin`. Inga målsiffror publicerade här — fylls av ägare när kohort tillåter.

### Shipped sedan förra revisionen (maj → jun 2026)

| Område | Status nu | Konkurrensposition |
|--------|-----------|-------------------|
| **skaffu.com + Skaffu-varumärke** | Live, rebrand, SSR-optimering | Tydlig SV-nisch-URL; Matdags har `matdags.se` + App Store |
| **PMF-instrumentering** | `/admin`, WoW, **veckovis ägar-e-post** | Datadriven iteration; få indie-konkurrenter exponerar detta |
| **Onboarding / aktivering** | Scan-first + förbättringar jun 2026 | Minskar höns-ägg; Matdags har native onboarding |
| **Kvitto** | PDF/bild + **per-rad plats** (AI + heuristik) | Differentiator vs Bring/ICA; Matdags har kvitto→lager |
| **Plan → inköpslista** | Ett-klicks-flöde | Plan+lager-koppling svårare för Bring/Matbotten |
| **PWA + web push** | Installbanner; **push för utgång** | Stänger del av gap mot Matdags native push — inte full parity |
| **E-post utgång** | Veckodigest, Resend verifierad, `EMAIL_SENDING_ENABLED` | Kanal finns; adoption mäts |
| **AI-kostnad** | Rate limits + **månadstak / guardrails** | Skyddar solo-ekonomi; Stripe fortfarande **väntar** |
| **Marknad** | Hero A/B + analytics, cookie consent B, jämförelsetabell | Beslut på hero när data räcker |
| **Smart inköpslista + export** | AI-fill, Bring-format clipboard | Differentiator vs ren lista |

### Fortfarande ej shipped eller ej bevisat (kritiska gap)

| Gap | Konsekvens vs konkurrenter |
|-----|---------------------------|
| **Native iOS/Android + OS-push** | Matdags, FreshKeeper, Pantrist vinner vardagsvana i bakgrunden |
| **Stripe / Pro-betalning** | Medvetet **väntar** tills PMF-gates ([PRICING.md](./PRICING.md)) |
| **D30-retention på mål** | Dashboard finns — **PMF ej bevisad** |
| **Riktig kvitto-PDF-korpus i CI** | Risk för ICA/Kivra-regress; ägare fyller [RECEIPT_TEST_PACK.md](./RECEIPT_TEST_PACK.md) parallellt |
| **Push "handla idag"** | Valfri nästa kod efter utgång-baseline |
| **SEO moget** | Planerat; konkurrenter äger sök på *skafferi* / *matsvinn* |

### Reviderade hot och möjligheter

**Hot (oförändrat eller skärpt):**

- **Matdags 🔴** — Närmaste 1:1 (scan, kvitto, lager, SV). Vi har nu **skaffu.com**, plan+lager, PDF-story och web push utgång — men **App Store + native push** går fortfarande till dem om retention inte håller.
- **Skafferikoll 🟠** — Aktiv SV konkurrent (`skafferikoll.se`); *skafferi+koll*-position; vi differentierar med scan-first, kvitto-PDF, plan+lager, butiksneutral.
- **Pantrist 🟡→🟠** — Internationell inventering+recept; svagare SV-kvitto-story men App Store-vana.
- **ICA / Bring 🔴/🟠** — Jämförelse på landning; **vanan** hos majoriteten kvarstår.
- **FreshKeeper 🟡→🟠** — Stiger om Android + kvitto + native notiser moetar.

**Möjligheter (stärkta av jun 2026):**

- **Kvitto-PDF + Kivra** — Sällsynt kombination med per-rad plats; huvudstory om parsing bevisas med riktiga PDF:er.
- **Butiksneutral lager-sanningskälla** — Smart fill + recept från faktiskt lager + plan→lista.
- **skaffu.com-varumärke** — Kort, SV-uttal, distinkt från *pantry* och *Matdags*.
- **Datadriven iteration** — PMF-dashboard, ägar-e-post, intervjukit, feedback i app.
- **Freemium redo** — Gränser och guardrails; intäkt väntar på Stripe + kohort ([PRICING.md](./PRICING.md)).

**Internationella hot / möjligheter (nytt jun 2026):**

- **NoWaste, Pantrist** — Närmast 1:1 globalt (lager + utgång + native); svag SV-kvitto/Kivra-story och begränsad nordisk lokalisering. Hot för expats och App Store-vana, inte för SV-kvitto-ICP.
- **Out of Milk / Pantry Check** — Inventering + lista; US/iOS-tung; begränsad nordisk lokalisering. "Good enough" på engelska för enkla pantry-behov.
- **Mealime / Plan to Eat** — Plan → lista utan lager som sanningskälla; benchmark för UX och veckovana ([ROADMAP.md](./ROADMAP.md)), inte direkt 1:1-hot.
- **AnyList / OurGroceries** — Expats och EN-hushåll i SE; delad lista utan lager. Skaffu har i18n i appen men ingen engelsk marknadswebb än.

**Ärlig slutsats:** Feature-bredden närmar sig Matdags på flera axlar, men **retention och betalning** är fortfarande huvudgapet. PMF mäts — **inte uppnådd** i docs. Se avsnitt 13 och [ROADMAP.md](./ROADMAP.md).

---

## 1. Sammanfattning

Skaffu positionerar sig som **skanna-först-skafferihantering** för svenska hushåll: streckkod, kvitto (bild/PDF) och foto → lager i kyl/frys/skafferi → utgångsdatum → smart inköpslista och måltidsplan. Produkten är en **webbapp** (SvelteKit på Firebase App Hosting) med marknadsplats på `/` och inloggad app från `/hem`, på **skaffu.com** — inte en native App Store-app (ännu).

Den starkaste differentieringen mot listappar (Bring!, ICA, AnyList) och ren måltidsplanering (Matbotten, Mealime, Plan to Eat) är **lagret som sanningskälla** — inköpslistan ska spegla vad som faktiskt finns hemma. Den starkaste hotbilden i Sverige kommer från **Matdags** (nästan samma löfte, native appar, gamification), **Skafferikoll** (SV skafferi+koll) och **gratis retailer-appar** (ICA/Coop). **Globalt** hotar **NoWaste** och **Pantrist** (lager+utgång+native) samt **listappar på engelska** för expats — men de saknar i regel nordisk kvitto/PDF-story (se §3F, §4B).

För en solo/indie-byggare är vägen att vinna **ett smalt segment**: hushåll som vill ha **butiksneutral** skanneri + hushållssync + kvitto/PDF utan att byta matkedja.

---

## 2. Skaffu idag

### 2.1 Positionering (kommunikation)

| Element | Innehåll |
|--------|----------|
| Varumärke / URL | **Skaffu** — [skaffu.com](https://skaffu.com) |
| Tagline | *Skanna först. Håll koll på skafferiet. Handla smart.* (se `docs/BRAND.md`) |
| Primär marknad | Sverige (SV), engelska via i18n i appen |
| Ton | Varm, direkt, köksnära |
| Löfte | Snabb registrering, överblick per plats, mindre gissning vid handel |
| Pris i FAQ | Gratis att komma igång; betalda planer meddelas i förväg |

Marknadswebben betonar: streckkod, kvitto & foto, kyl/frys/skafferi, smart inköpslista, hushåll, måltidsplan & recept — med jämförelse mot ICA, Bring, Matdags.

### 2.2 Funktioner som faktiskt finns i repot (shipped)

| Område | Status | Kommentar |
|--------|--------|-----------|
| **Streckkodsskanning** | Shipped | Kamera; Open Food Facts (varierande SV-täckning) |
| **Kvitto** | Shipped | Bild + PDF; per-rad plats (AI + heuristik) |
| **Foto av produkt** | Shipped | AI etikett |
| **Lager kyl/frys/skafferi** | Shipped | Dashboard `/hem` |
| **Utgång / snart ut** | Shipped | Dashboard + insights |
| **Inköpslista** | Shipped | Smart fill; **plan → lista ett klick** |
| **Måltidsplan** | Shipped | `/planer`, AI-recept |
| **Hushåll** | Shipped | Inbjudan, roller |
| **PWA** | Shipped | Manifest, installguide, banner |
| **Web push** | Delvis | **Utgång**; valfri *handla idag* senare |
| **E-post utgång** | Shipped | Veckodigest, Resend |
| **PMF / admin** | Shipped | Dashboard; ägar-e-postcron |
| **Marknadswebb** | Shipped | Hero A/B + analytics, cookie consent |
| **Deploy** | Shipped | Firebase App Hosting, **skaffu.com** |
| **Native iOS/Android** | Ej shipped | **Väntar** (Capacitor) |
| **Stripe / Pro** | Ej shipped | **Väntar** (gates) |
| **Butikspriser** | Ej shipped | Medvetet bort |

### 2.3 Planerat / tunt

- **Engelsk marknadswebb** — mest stub.
- **Betalning** — gränser klara; Checkout **väntar**.
- **SEO SV** — nästa kodprioritet.
- **Riktig kvitto-PDF-korpus** — ägare parallellt.

### 2.4 Teknisk differentiering (ärligt)

**Styrkor:** Kvitto-PDF + Kivra-väg; plan+lager+lista i ett flöde; butiksneutral; skaffu.com; PMF-instrumentering; web push utgång.

**Svagheter:** Webb-only vs App Store; OFF svag på SV-egna märken; AI-kostnad; kallstart (lager byggs över tid); PMF ej bevisad.

---

## 3. Konkurrenslandskap per kategori

### A. Skafferi / heminventering (global + Norden)

| Aktör | Fokus | Hot mot Skaffu |
|-------|--------|----------------|
| **Matdags** | SV, foto/kvitto/streckkod, gamification, **native** | 🔴 1:1 |
| **Skafferikoll** | SV, skafferi+koll | 🟠 Ljudlikhet *koll*; annan UX |
| **FreshKeeper** | SV matsvinn, FEFO, premium ~39 kr/mån | 🟡→🟠 |
| **Pantrist** | Inventering + recept + lista, internationellt | 🟡 App Store-vana |
| **NoWaste** | Global, kyl/frys/skafferi, Pro-barcode | 🟠 Ej SV-fokus |
| **Pantry Check** | iOS-tung inventering | 🟡 Låg i SE |

### B. Inköpslista / hushåll

| Aktör | Fokus | Hot |
|-------|--------|-----|
| **Bring!** | Delad lista, erbjudanden | 🟠 Default-lista; export dit |
| **ICA / Coop** | Lista + stammis + butik | 🔴/🟡 Lojalitet |
| **OurGroceries / AnyList** | Enkel sync | 🟡 Expats |

### C. Matsvinn / utgång

| Aktör | Fokus |
|-------|--------|
| **Too Good To Go / Olio** | Köp/rädda mat utanför hemmet — **annat jobb** |
| **NoWaste / Matdags / FreshKeeper / Skaffu** | Förebygga svinn via lager hemma |

### D. Recept + måltidsplan

| Aktör | Fokus |
|-------|--------|
| **Matbotten** | AI-veckomeny → Bring!/Mathem — svagt lager |
| **MatPlan / Mealime / Plan to Eat** | Plan → lista utan scan-lager |

### E. Kvitto / retailer

| Aktör | Fokus |
|-------|--------|
| **ICA** | Streckkod → lista (inte lager); Kivra separat |
| **Matdags** | Kvitto → **lager** — direkt konkurrent |
| **Matpriskollen** | Scan → pris, inte lager |

### F. Internationella (ej SV-fokus)

| Aktör | Hemma-marknad | Plattform | Prisindikation (jun 2026) | Kärnjobb | Hot mot Skaffu |
|-------|---------------|-----------|---------------------------|----------|----------------|
| **NoWaste** | Global (DK-baserad) | iOS, Android, webb | Gratis; Pro ~$7/år eller ~$30 lifetime ([PRICING.md](./PRICING.md)) | Kyl/frys/skafferi, utgång, streckkod | 🟠 Närmast 1:1 globalt |
| **Pantrist** | Tyskland/EU | iOS, Android | Gratis + Premium (från ~$1,50/mån) | Pantry + min-lager + recept + lista | 🟠 App Store-vana |
| **Pantry Check** | USA | iOS (ingen Android) | Gratis till 200 varor; Premium från ~$8/år | Inventering, utgång, smart lista | 🟡 Låg i SE |
| **Out of Milk** | USA | iOS, Android, webb | Gratis (annonser); premium ~$13/år | Lista + enkel pantry | 🟡 Lista-default |
| **Mealime** | Nordamerika | iOS, Android, webb | Gratis; Pro ~$3/mån | Veckoplan → lista | 🟡 UX-benchmark |
| **Plan to Eat** | USA | iOS, Android, webb | $5,95/mån eller $49/år (14 dagars prov) | Eget receptbibliotek → plan → lista | 🟡 Plan utan lager |
| **AnyList** | USA | iOS, Android, web, Mac | Gratis; Complete ~$10–15/år | Delad lista + recept + måltidskalender | 🟡 Expats i SE |
| **OurGroceries** | USA | iOS, Android, web, Alexa | Gratis (annonser); ~$6/år eller $20 lifetime | Enkel delad lista | 🟡 Billigast lista |
| **BigOven / Yummly** | USA | iOS, Android | Gratis + premium | Recept från ingredienser | 🟢 Adjacent |
| **OLIO** | UK/global | iOS, Android | Gratis | Dela överskottsmat lokalt — **annat jobb** (bekräftar §3C) | 🟢 Ej pantry |

---

## 4. Huvudkonkurrenter (profiler)

Hotnivå mot Skaffu: 🔴 hög · 🟠 medel · 🟡 låg.

### 4.1 Matdags — 🔴

| | |
|--|--|
| **Målgrupp** | Miljö- och plånboksmedvetna SV hushåll |
| **Kärnjobb** | "Vad har jag hemma?" + minska svinn |
| **Styrkor** | Native iOS/Android, kvitto, streckkod, push, gamification, `matdags.se` |
| **Svagheter** | Premium 29 kr/mån; mindre plan+lager-djup än vår kedja |
| **Pris** | Gratis; Premium **29 kr/mån** |
| **Vs Skaffu** | Vi: **PDF/Kivra-story**, plan→lista, butiksneutral, **skaffu.com**, ingen gamification-krav — de: **distribution + native** |

### 4.2 Skafferikoll — 🟠

| | |
|--|--|
| **Målgrupp** | SV hushåll som vill "ha koll" på skafferiet |
| **Kärnjobb** | Överblick skafferi (enligt publik positionering) |
| **Styrkor** | Tydlig SV-domän (`skafferikoll.se`), kategori-namn |
| **Svagheter** | Nära generisk *koll*; oklart kvitto-PDF/plan+lager-paritet |
| **Vs Skaffu** | Vi: scan-first, kvitto batch, AI-lista från lager, **Skaffu**-varumärke — undvik förvirring i copy |

### 4.3 ICA-appen — 🔴

| | |
|--|--|
| **Kärnjobb** | Erbjudanden, lista, betala |
| **Vs Skaffu** | "Ett skafferi för hela hushållet, inte bara ICA-handel" |

### 4.4 Bring! — 🟠

| | |
|--|--|
| **Vs Skaffu** | "Listan vet vad som finns i kylen"; clipboard-export finns |

### 4.5 FreshKeeper — 🟠

| | |
|--|--|
| **Målgrupp** | SV hushåll som vill minska matsvinn med FEFO-logik |
| **Kärnjobb** | "Använd det äldsta först" — kyl/frys/skafferi med utgång |
| **Styrkor** | Tydlig SV-positionering (`freshkeeper.se`), FEFO, obegränsat gratis lager, native iOS (Android utannonserat) |
| **Svagheter** | Ingen kvitto-PDF/Kivra-story; begränsad gratis inköpslista (10 varor); plan+lager-kedja svag |
| **Pris** | Gratis kärna; Premium **39 kr/mån** (smart lista från lager, buffert) |
| **Plattform** | Native iOS (jun 2026); Android "kommer snart" |
| **Vs Skaffu** | **Lager:** båda ja — de FEFO-native, vi plan→lista + kvitto. **Kvitto/PDF:** vi starkare (PDF + per-rad plats). **Butiksneutral:** båda. **Hushåll:** vi shipped; deras fokus oklart. **Native:** de iOS idag; vi web/PWA + web push utgång ([DAY_90_DECISION.md](./DAY_90_DECISION.md)). |
| **Hotnivå** | 🟠 — Stiger om Android + kvitto + native notiser möter |

### 4.6 Matbotten — 🟡

| | |
|--|--|
| **Målgrupp** | SV familjer som vill slippa "vad ska vi äta?" |
| **Kärnjobb** | AI-veckomeny → inköpslista (Bring!/Mathem) |
| **Styrkor** | Stark SV UX, nutrition från Livsmedelsverket, export till Bring!, lär preferenser |
| **Svagheter** | Pantry-medveten lista men **inget lager som sanningskälla**; ingen kvitto-scan; kedje-export |
| **Pris** | Gratis (3 dagar/vecka); Köksmästare **19 kr/mån**; Gourmet **49 kr/mån** |
| **Plattform** | Webb + App Store |
| **Vs Skaffu** | **Lager:** vi ja, de nej (pantry-hint). **Kvitto/PDF:** vi ja. **Butiksneutral:** vi ja; de exporterar till Bring!/Mathem. **Hushåll:** båda. **Native:** de App Store; vi web/PWA. |
| **Hotnivå** | 🟡 — Plan-UX-benchmark; annat jobb än scan-first lager |

### 4.7 Coop-appen — 🟡

| | |
|--|--|
| **Målgrupp** | Coop-medlemmar, erbjudanden och Scan & Pay |
| **Kärnjobb** | Erbjudanden, lista, recept, online-handel — inte heminventering |
| **Styrkor** | Gratis, medlemsbonus, Scan & Pay, SV butiksvana |
| **Svagheter** | Ingen lager-sanningskälla; kedjelåst |
| **Pris** | Gratis |
| **Plattform** | Native iOS/Android |
| **Vs Skaffu** | **Lager:** vi ja, de nej. **Kvitto/PDF:** vi batch-lager; de betalning/lista. **Butiksneutral:** vi ja. **Hushåll:** vi roller; de delad lista begränsad. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — Vanan hos Coop-lojala; jämförbar med ICA §4.3 |

### 4.8 Matpriskollen — 🟡

| | |
|--|--|
| **Målgrupp** | Prismedvetna SV konsumenter |
| **Kärnjobb** | Extrapriser, Priskollen (streckkod → pris jämfört), inköpslista |
| **Styrkor** | Gratis, 3 000+ butiker, SV täckning, delad lista |
| **Svagheter** | **Inget lager**; annat jobb (pris, inte "vad finns hemma?") |
| **Pris** | Gratis |
| **Plattform** | Native iOS/Android |
| **Vs Skaffu** | **Lager:** vi ja, de nej. **Kvitto/PDF:** vi → lager; de scan → pris. **Butiksneutral:** båda (multi-kedja). **Hushåll:** delad lista båda. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — Kompletterar snarare än ersätter; vi medvetet utan butikspriser (§2.2) |

### 4B. Internationella huvudkonkurrenter (profiler)

Hotnivå mot Skaffu: 🔴 hög · 🟠 medel · 🟡 låg. **Vs Skaffu** följer fem axlar: (1) lager som sanningskälla, (2) kvitto/PDF nordisk/Kivra, (3) butiksneutralitet, (4) hushållssync, (5) native vs web/PWA.

#### 4B.1 NoWaste — 🟠

| | |
|--|--|
| **Målgrupp** | Waste-conscious hushåll globalt |
| **Kärnjobb** | Inventera kyl/frys/skafferi, utgång, minska dubbelköp |
| **Styrkor** | Native iOS/Android + webb, utgångssortering, Pro-barcode (335M produkter), meal plan + lista, lifetime-pris |
| **Svagheter** | Ingen nordisk kvitto-PDF/Kivra; svag SV-lokalisering; gamification saknas men retention via native |
| **Pris** | Gratis (begränsat); Pro **~$7/år** eller **~$30 lifetime** (~60 kr/år, [PRICING.md](./PRICING.md)) |
| **Plattform** | iOS, Android, webb |
| **Vs Skaffu** | **Lager:** båda ja. **Kvitto/PDF:** vi PDF+per-rad; de foto/expiry-scan, ej Kivra. **Butiksneutral:** båda. **Hushåll:** sync ja båda. **Native:** de full native; vi web/PWA, Capacitor väntar. |
| **Hotnivå** | 🟠 — Global 1:1 på lager+utgång; svag i SV-kvitto-nisch |

#### 4B.2 Pantrist — 🟠

| | |
|--|--|
| **Målgrupp** | EU-hushåll som vill ha pantry + shopping i ett |
| **Kärnjobb** | Min-lager, utgång, auto-restock → lista, recept |
| **Styrkor** | Native, OFF-barcode, flera förvaringsplatser, receptimport, Alexa/Wear OS, kvittoscan (Premium) |
| **Svagheter** | Tysk/EU-fokus; svag nordisk kvitto-story; annonser i gratis |
| **Pris** | Gratis + Premium (stegvis, från ~$1,50/mån beroende på hushållsstorlek) |
| **Plattform** | iOS, Android |
| **Vs Skaffu** | **Lager:** båda ja (de min-stock, vi smart fill). **Kvitto/PDF:** vi PDF+Kivra-väg; de kvittoscan Premium. **Butiksneutral:** båda. **Hushåll:** delad lista båda. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟠 — App Store-vana; nära funktionellt men svag SV-wedge |

#### 4B.3 Pantry Check — 🟡

| | |
|--|--|
| **Målgrupp** | iOS-användare (USA) med seriös heminventering |
| **Kärnjobb** | Barcode-inventering, utgång, smart lista från lager |
| **Styrkor** | Stark barcode + crowd DB, utgångsnotiser (lock screen), familjedelning, 200 gratis varor |
| **Svagheter** | **iOS only** (ingen Android); US-prisfokus; ingen kvitto-PDF |
| **Pris** | Gratis till 200 varor; Premium ~$8–12/år (2 000 varor); Pro ~$15–30/år |
| **Plattform** | iOS, iPad |
| **Vs Skaffu** | **Lager:** båda ja. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** båda. **Native:** de iOS-native; vi web/PWA (Android-vänlig). |
| **Hotnivå** | 🟡 — Låg penetration i SE; iOS-only begränsar |

#### 4B.4 Out of Milk — 🟡

| | |
|--|--|
| **Målgrupp** | US-hushåll som vill ha lista + enkel pantry |
| **Kärnjobb** | Inköpslista, pantry (kryddor/grundvaror), to-do |
| **Styrkor** | Gratis sync+dela, webb+mobil, barcode, running total i butik |
| **Svagheter** | **Svag lager-depth** (pantry ≠ kyl/frys/skafferi); ingen utgång; annonser |
| **Pris** | Gratis; premium tar bort annonser (~$13/år) |
| **Plattform** | iOS, Android, webb |
| **Vs Skaffu** | **Lager:** vi full kyl/frys/skafferi; de pantry-light. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** båda. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — "Good enough" lista+pantry för expats; inte SV-kvitto-hot |

#### 4B.5 Mealime — 🟡

| | |
|--|--|
| **Målgrupp** | Upptagna hushåll som vill ha snabb veckoplan |
| **Kärnjobb** | Personaliserad veckomeny → sorterad inköpslista (~30 min recept) |
| **Styrkor** | Utmärkt onboarding, 4,5M+ användare, dietfilter, matspillsmedveten planering |
| **Svagheter** | **Inget lager som sanningskälla**; receptdriven, inte scan-driven |
| **Pris** | Gratis; Pro **~$3/mån** |
| **Plattform** | iOS, Android, webb |
| **Vs Skaffu** | **Lager:** vi ja; de nej. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** begränsat vs vårt hushåll+lager. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — UX-benchmark för plan→lista ([ROADMAP.md](./ROADMAP.md) kandidat A); inte direkt hot |

#### 4B.6 Plan to Eat — 🟡

| | |
|--|--|
| **Målgrupp** | Organiserade familjer (USA) med eget receptbibliotek |
| **Kärnjobb** | Importera recept → kalenderplan → auto inköpslista |
| **Styrkor** | Full kontroll, familjefokus, ingen dataläckage-modell, webb+app |
| **Svagheter** | Ingen lager/scan; betald från dag 15; manuellt arbete |
| **Pris** | **$5,95/mån** eller **$49/år** (14 dagars gratis prov) |
| **Plattform** | iOS, Android, webb |
| **Vs Skaffu** | **Lager:** vi ja; de nej. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** båda delar plan/lista. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — Annat segment (receptsamlare); plan-ritual utan lager |

#### 4B.7 AnyList — 🟡

| | |
|--|--|
| **Målgrupp** | Familjer/roommates (ofta expats) som delar handel |
| **Kärnjobb** | Delad inköpslista + recept + måltidskalender → lista |
| **Styrkor** | Billig Complete (~$10–15/år), web/Mac, receptimport, widgets, Siri |
| **Svagheter** | **Inget lager**; plan från recept, inte från kylen |
| **Pris** | Gratis kärna; Complete **$9,99/år** (individ) eller **$14,99/år** (hushåll) |
| **Plattform** | iOS, Android, web, Mac |
| **Vs Skaffu** | **Lager:** vi ja; de nej. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** båda stark sync. **Native:** de ja; vi web/PWA men i18n i app. |
| **Hotnivå** | 🟡 — Vinner expat-lista idag; vi kan konkurrera med lager+EN |

#### 4B.8 OurGroceries — 🟡

| | |
|--|--|
| **Målgrupp** | Prismedvetna hushåll som bara vill ha synkad lista |
| **Kärnjobb** | Delad inköpslista (+ enkla recept → lista) |
| **Styrkor** | Helt gratis funktionellt, Alexa, billig lifetime ($20), barcode |
| **Svagheter** | Inget lager, ingen utgång, ingen kvitto |
| **Pris** | Gratis (annonser); **~$6/år** eller **$20 lifetime** (utan annonser) |
| **Plattform** | iOS, Android, web, Alexa, Apple Watch |
| **Vs Skaffu** | **Lager:** vi ja; de nej. **Kvitto/PDF:** vi ja; de nej. **Butiksneutral:** båda. **Hushåll:** båda. **Native:** de ja; vi web/PWA. |
| **Hotnivå** | 🟡 — Default-lista för många; annat jobb |

**Kort — adjacent (ej kärnhot):**

- **BigOven / Yummly** — Recept och "vad kan jag laga?" från ingredienser; svagt eller inget lager som sanningskälla. 🟢
- **OLIO** — Dela överskottsmat i grannskapet; bekräftar §3C att matsvinn-appar kan ha helt annat jobb än heminventering. 🟢

### 4C. Jämförelsematris (funktioner)

Kompakt översikt jun 2026. Skaffu-kolumn enligt §2.2 (shipped) — inga påhittade features.

| Funktion | Skaffu | Matdags | NoWaste | Pantrist | Pantry Check | Out of Milk | Mealime | AnyList |
|----------|--------|---------|---------|----------|--------------|-------------|---------|---------|
| Streckkod | ✅ OFF | ✅ | ✅ Pro | ✅ OFF | ✅ crowd DB | ✅ | ❌ | ⚠️ begränsat |
| Kvitto PDF | ✅ AI+heuristik | ✅ foto/kvitto | ⚠️ foto | ⚠️ Premium scan | ❌ | ❌ | ❌ | ❌ |
| Foto-AI lager | ✅ | ✅ kyl/skafferi | ✅ | ❌ | ⚠️ produktfoto | ❌ | ❌ | ❌ |
| Kyl/frys/skafferi | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ pantry-light | ❌ | ❌ |
| Utgång / snart ut | ✅ + web push | ✅ native push | ✅ native | ✅ | ✅ native | ❌ | ❌ | ❌ |
| Smart lista från lager | ✅ AI fill | ⚠️ | ⚠️ | ✅ auto-restock | ✅ | ⚠️ low-stock | ❌ | ❌ |
| Plan → lista | ✅ ett klick | ⚠️ recept | ✅ meal plan | ✅ recept | ⚠️ | ❌ | ✅ kärnjobb | ✅ Complete |
| Hushållssync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Web push | ✅ utgång | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Native iOS/Android | ❌ väntar | ✅ | ✅ | ✅ | iOS only | ✅ | ✅ | ✅ |
| SV språk / marknad | ✅ primär | ✅ | ❌ | ⚠️ DE/EN | ❌ | ❌ | ❌ | ❌ |
| Pris (indikativt) | Gratis; Pro väntar | 29 kr/mån | ~60 kr/år | Premium från ~15 kr/mån | ~80 kr/år | Gratis | ~30 kr/mån | ~100 kr/år |

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
    Skaffu: [0.84, 0.78]
    Matdags: [0.80, 0.75]
    Skafferikoll: [0.70, 0.72]
    NoWaste: [0.75, 0.70]
    Pantrist: [0.76, 0.68]
    OutOfMilk: [0.38, 0.62]
    Mealime: [0.28, 0.55]
    AnyList: [0.18, 0.58]
    Bring: [0.15, 0.55]
    ICA Coop: [0.20, 0.95]
    Matbotten: [0.35, 0.50]
```

**Tolkning:** Skaffu och Matdags möts i övre högra kvadranten (hög lager-depth, butiksneutral). **Internationella pantry-appar** (NoWaste, Pantrist) klustrar nära men med **låg SV-lokalisering** — de vinner på native distribution, inte på Kivra/PDF. **Listappar** (Bring, AnyList, OurGroceries, Out of Milk) sitter vänster: låg lager-depth. **Mealime** och **Matbotten** är plan→lista utan lager som sanningskälla. Retailer-appar (ICA/Coop) oförändrat högt på kedje-låsning.

---

## 6. Gap-analys — SV användare

| Önskat utfall | Gap hos konkurrenter | Skaffu-möjlighet |
|---------------|---------------------|------------------|
| Slipp dubbelköp | Bring/ICA utan lager | Lager + smart fill + plan→lista |
| Kvitto ICA/Kivra | Matdags ja; ICA lagrar ej i lager | PDF + per-rad plats + guide |
| Butiksneutral | Retailer-låst | skaffu.com messaging |
| Familj utan stammis | ICA stammis | Hushåll + roller |
| Påminnelse utgång | Matdags native push | E-post + **web push utgång**; native **väntar** |
| SV produktnamn scan | OFF svag | Favoriter, override; ev. cache senare |

### 6B. Gap-analys — internationell användare / expat

| Segment | Behov | Vem vinner idag | Skaffu-vinkel |
|---------|-------|-----------------|---------------|
| **Expats i SE** | EN UI, delad lista, snabb onboarding | AnyList, Bring!, OurGroceries | i18n finns i appen; butiksneutral + OFF; **ingen engelsk marknadswebb** än (§2.3) |
| **Waste-conscious global** | Expiry + native push, App Store-vana | NoWaste, Matdags, FreshKeeper | Web push utgång ✅; native + OS-push **väntar** ([DAY_90_DECISION.md](./DAY_90_DECISION.md)) |
| **Meal planners** | Veckomeny, minimal friktion | Mealime, Matbotten, Plan to Eat | Plan från **faktiskt** lager + utgångsstyrd vecka (ROADMAP kandidat A) — differentiering de saknar |

**ICP-koppling:** Primär förblir SV hushåll (§9). Sekundär utökas med **expat/EN** som kan acceptera web/PWA om lager+kvitto levererar — men PMF är **inte bevisad** för något segment jun 2026.

---

## 7. Moat-kandidater (realistiska för indie)

1. **Hushållssync med lager + lista + plan** i ett flöde.
2. **Kvitto-PDF + Kivra + per-rad plats** — få globala gör PDF + nordisk kvittokultur.
3. **Scan-first UX** på skaffu.com.
4. **Butiksneutral "mitt skafferi"**.
5. **Kombinerad AI** från *faktiskt* lager (kostnad guardrailad).
6. **Varumärke Skaffu** — kort URL, SV-uttal, integritet/FAQ.

**Ej moat (ännu):** produktdatabas, priser, App Store, betalningsvolym.

### 7B. Internationella lärdomar (indie)

1. **Lifetime/årsprenumeration** (NoWaste ~$30 lifetime, OurGroceries $20 lifetime) vs **månads** (Matdags 29 kr, FreshKeeper 39 kr) — låg ARPU men hög retention för engagerade; vår hypotes är månad/år ([PRICING.md](./PRICING.md)), lifetime endast som kampanj.
2. **Barcode Pro** som monetisering (NoWaste 335M produkter, Pantrist Premium) — vi har **freemium + AI-gränser** istället för ren scanner-paywall; billigare onboarding men högre AI-risk.
3. **Native distribution som retention-moat** — globala pantry-appar lever på App Store-vana och OS-push; bekräftar att Capacitor **väntar** tills D30-motiverar ([DAY_90_DECISION.md](./DAY_90_DECISION.md)).
4. **Receipt scanning** domineras av US/UK kvitton — vår wedge är **nordisk PDF/Kivra + per-rad plats**, inte foto av papperkvitto i butik.
5. **Gamification** (Matdags poäng/streak) vs **ritual/vecka** (Skaffu plan+lager+utgång) — olika retention-hypotes; vi satsar på vardagsritual, inte tävling.
6. **Plan→lista utan lager** (Mealime, Plan to Eat) visar att **veckovana** kan byggas utan inventering — hot om vi inte får scan/kvitto-aktivering; möjlighet om vi kopplar utgång → plan (ROADMAP).
7. **Listappar "good enough"** (AnyList, OurGroceries) för expats — billigt, native, delad lista; vi vinner bara om lager-kedjan känns värd friktionen vs ren lista.

---

## 8. Risker

| Risk | Mitigering |
|------|------------|
| Matdags + App Store | Retention, web push, word-of-mouth, SEO |
| Skafferikoll namnförvirring | Tydlig *Skaffu*-copy, inte *skafferi+koll* |
| AI-kostnad | Rate limits, månadstak |
| Webb-only | PWA, push utgång; Capacitor **väntar** |
| PMF ej bevisad | Veckorutin + intervjuer (parallellt) |
| Globala pantry-appar "good enough" på engelska | SV-kvitto + hushåll + plan+lager som wedge; inte konkurrera på App Store-budget |
| Expats väljer AnyList/Bring som default | i18n + lager-story; engelsk marknadswebb senare om sekundär ICP växer |

---

## 9. Ideal Customer Profile (ICP)

**Primär:** Par/familj SV storstad/suburb, 28–45, handlar flera kedjor, irriterade på dubbelköp/utgång, webb-vana, butiksneutral.

**Sekundär:** Roommates; waste-conscious; provat Bring! men saknar "vad finns hemma?"; **expat/EN i Sverige** som accepterar web/PWA om lager+kvitto fungerar (AnyList/OurGroceries är default-lista idag).

**Anti-ICP:** Enperson som bara vill ha lista; kräver perfekt SV-barcode dag ett.

---

## 10. Go-to-market

### Kanaler

| Kanal | Varför |
|-------|--------|
| **SEO + skaffu.com** | "minska matsvinn app", "skafferi app", "inköpslista hushåll" — **nästa kod** |
| **Reddit/Facebook SV** | Matplanering, hållbarhet |
| **Kort video** | Kvitto → lager |
| **Launch playbook** | 2–3 communities — **ägare parallellt** |

### Messaging (Skaffu)

- **Huvud:** "Skanna först — handla bara det som saknas."
- **Mot Bring:** "Listan vet vad som finns i kylen."
- **Mot ICA:** "Ett skafferi för hela hushållet, inte bara ICA-handel."
- **Mot Matdags:** PDF/Kivra, plan+lager, butiksneutral, ingen gamification-krav.
- **Mot Skafferikoll:** Scan-first + kvitto + smart lista från **faktiskt** lager — inte bara "koll".

### Domän

- **Prod:** `skaffu.com` (en deploy: `/` marknad, `/login` app) — [DOMAIN_STRATEGY.md](./DOMAIN_STRATEGY.md).
- **CTA:** "Kom igång gratis" → kvitto eller 5 streckkoder dag 1.

---

## 11. Produktroadmap för framgång

**OBS (jun 2026):** Must-fasen klar. Aktiv: [`ROADMAP.md`](./ROADMAP.md) Fas 1. Stripe och Capacitor **väntar**.

### Must (0–3 mån) — historik, klart

Se [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md).

### Should (Fas 1, pågår)

- Retention: PMF-rutin, intervjuer (ägare parallellt), web push utgång ✅; valfritt handla idag.
- Marknad: skaffu.com ✅, launch (ägare), hero A/B-beslut, **SEO**.
- Kvitto: riktiga PDF (ägare parallellt).
- Stripe — **väntar**.
- Capacitor — **väntar**.

### Later (Fas 2)

Native notiser, offline, produktcache, B2B — efter PMF.

---

## 12. Monetisering

Oförändrad rekommendation: freemium + Pro **29–49 kr/mån** eller **199–399 kr/år** i linje med Matdags/FreshKeeper. **Checkout väntar** — se [PRICING.md](./PRICING.md).

---

## 13. Mätetal för product-market fit

| Metric | Mål (indikativt) | Status jun 2026 |
|--------|------------------|-----------------|
| Aktivering (24 h) | >40 % | **Mät** — `/admin` |
| Tid till första scan | <3 min median | **Mät** |
| Veckoscan-rate | >30 % | **Mät** |
| D7 / D30 retention | D30 >15 % tidigt | **Ej bevisad — primär gate** |
| Hushåll 2+ aktiva | >50 % | **Mät** |
| Smart fill / vecka | >20 % | **Mät** |
| NPS / Sean Ellis | >40 % "Mycket besviken" | Enkät |

**Instrumentering:** `product_event`, `/admin`, veckosammanfattning + ägar-e-post.

**Ägare:** fyller och följer metrics **parallellt** med produktarbete — inga publicerade måluppfyllelser i denna analys.

---

## 14. Vad du behöver (resurser)

| Område | Behov |
|--------|-------|
| Produkt/eng | Solo + ev. frilans |
| Legal | Policy vid betalning |
| Infra | Firebase, OpenAI-tak ✅ |
| Support | FAQ; hello via skaffu.com-kontakt |
| Distribution | SEO + word of mouth nu; ASO **senare** |

---

## 15. Ursprunglig 90-dagarslista (historik)

Punkter 1–20: [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md) — **klara** (domän = skaffu.com jun 2026).

**Nästa:** [`NEXT_STEPS.md`](./NEXT_STEPS.md), [`ROADMAP.md`](./ROADMAP.md) Fas 1.

---

## 16. Slutsats — kan Skaffu bli en framgång?

**Ja, i en svensk nisch — men inte bevisat ännu.** Jun 2026: skaffu.com live (web/PWA, **ingen native**), plan→lista, kvitto per plats, web push utgång, PMF-instrumentering och AI-guardrails — men **retention och betalning** saknas fortfarande.

**Mot internationella aktörer:** Vi vinner på **SV-kvitto/PDF + Kivra**, **butiksneutral lager-sanningskälla** och **plan→lista från faktiskt lager** — axlar som NoWaste, Pantrist, Mealime och listappar inte kombinerar för nordiska hushåll. Vi förlorar på **App Store-distribution**, **native OS-push** och **"good enough" engelska listor** för expats tills retention bevisar att lager-kedjan är värd friktionen.

Nu krävs:

- **Retention först** — veckorutin, D30, intervjusyntes (ägare parallellt).
- **Tydlig differentiering** — PDF/Kivra, plan+lager, butiksneutral på **skaffu.com**.
- **Stripe när gates uppfylls** — annars vänta ([PRICING.md](./PRICING.md)).
- **Capacitor när data motiverar** ([DAY_90_DECISION.md](./DAY_90_DECISION.md)).

Unfair advantage: **fokus, Skaffu-varumärke, integritet, datadriven prioritering** — inte stammisrabatter eller App Store-budget.

---

*Källor: projektdokumentation jun 2026 ([ROADMAP.md](./ROADMAP.md), [PRICING.md](./PRICING.md), [DAY_90_DECISION.md](./DAY_90_DECISION.md)); App Store / Google Play (jun 2026); officiella webbar: nowasteapp.com, pantrist.com, pantrycheck.com, outofmilk.com, mealime.com, plantoeat.com, anylist.com, ourgroceries.com, freshkeeper.se, matbotten.se, matpriskollen.se, coop.se, olioapp.com; kodbas home-pantry (§2.2 shipped).*
