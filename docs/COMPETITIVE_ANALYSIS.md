# Konkurrensanalys — Skaffu

*Version: jun 2026 (senast reviderad 1 jun 2026). Baserad på kodbas (`docs/BRAND.md`, `docs/MARKETING_SITE.md`, `src/lib/marketing/content.ts`) och öppna källor om marknaden.*

> **Produktroadmap:** [ROADMAP.md](./ROADMAP.md) · **Nästa 30 dagar (ägare):** [NEXT_STEPS.md](./NEXT_STEPS.md) · **Domän:** [skaffu.com](https://skaffu.com) — [DOMAIN_STRATEGY.md](./DOMAIN_STRATEGY.md)

---

## Nuvarande läge (uppdaterad 1 jun 2026)

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
- **Freemium redo** — Gränser och guardrails; intäkt väntar på Stripe + kohort.

**Ärlig slutsats:** Feature-bredden närmar sig Matdags på flera axlar, men **retention och betalning** är fortfarande huvudgapet. PMF mäts — **inte uppnådd** i docs. Se avsnitt 13 och [ROADMAP.md](./ROADMAP.md).

---

## 1. Sammanfattning

Skaffu positionerar sig som **skanna-först-skafferihantering** för svenska hushåll: streckkod, kvitto (bild/PDF) och foto → lager i kyl/frys/skafferi → utgångsdatum → smart inköpslista och måltidsplan. Produkten är en **webbapp** (SvelteKit på Firebase App Hosting) med marknadsplats på `/` och inloggad app från `/hem`, på **skaffu.com** — inte en native App Store-app (ännu).

Den starkaste differentieringen mot listappar (Bring!, ICA) och ren måltidsplanering (Matbotten, Mealime) är **lagret som sanningskälla** — inköpslistan ska spegla vad som faktiskt finns hemma. Den starkaste hotbilden i Sverige kommer från **Matdags** (nästan samma löfte, native appar, gamification), **Skafferikoll** (SV skafferi+koll) och **gratis retailer-appar** (ICA/Coop).

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

---

## 4. Tolv huvudkonkurrenter (profiler)

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

### 4.5 Matdags (forts.) / NoWaste / Matpriskollen / Matbotten / Pantry Check / Coop / AnyList / Mealime / FreshKeeper / Plan to Eat

*Profiler oförändrade i kärna från maj 2026-revision — se tidigare bedömningar i arkiv. FreshKeeper och Pantrist: bevaka **Android + kvitto + push**.*

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
    Bring: [0.15, 0.55]
    ICA Coop: [0.20, 0.95]
    Matbotten: [0.35, 0.50]
```

**Tolkning:** Skaffu och Matdags möts i övre högra kvadranten. Skafferikoll sitter nära men med svagare scan/PDF-differentiering i vår messaging. Bring/ICA vinner på vana.

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

---

## 7. Moat-kandidater (realistiska för indie)

1. **Hushållssync med lager + lista + plan** i ett flöde.
2. **Kvitto-PDF + Kivra + per-rad plats** — få globala gör PDF + nordisk kvittokultur.
3. **Scan-first UX** på skaffu.com.
4. **Butiksneutral "mitt skafferi"**.
5. **Kombinerad AI** från *faktiskt* lager (kostnad guardrailad).
6. **Varumärke Skaffu** — kort URL, SV-uttal, integritet/FAQ.

**Ej moat (ännu):** produktdatabas, priser, App Store, betalningsvolym.

---

## 8. Risker

| Risk | Mitigering |
|------|------------|
| Matdags + App Store | Retention, web push, word-of-mouth, SEO |
| Skafferikoll namnförvirring | Tydlig *Skaffu*-copy, inte *skafferi+koll* |
| AI-kostnad | Rate limits, månadstak |
| Webb-only | PWA, push utgång; Capacitor **väntar** |
| PMF ej bevisad | Veckorutin + intervjuer (parallellt) |

---

## 9. Ideal Customer Profile (ICP)

**Primär:** Par/familj SV storstad/suburb, 28–45, handlar flera kedjor, irriterade på dubbelköp/utgång, webb-vana, butiksneutral.

**Sekundär:** Roommates; waste-conscious; provat Bring! men saknar "vad finns hemma?".

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

**Ja, i en nisch — men inte bevisat ännu.** Jun 2026: skaffu.com live, plan→lista, kvitto per plats, web push utgång, PMF-instrumentering och AI-guardrails — men **retention och betalning** saknas fortfarande.

Nu krävs:

- **Retention först** — veckorutin, D30, intervjusyntes (ägare parallellt).
- **Tydlig differentiering** — PDF/Kivra, plan+lager, butiksneutral på **skaffu.com**.
- **Stripe när gates uppfylls** — annars vänta ([PRICING.md](./PRICING.md)).
- **Capacitor när data motiverar** ([DAY_90_DECISION.md](./DAY_90_DECISION.md)).

Unfair advantage: **fokus, Skaffu-varumärke, integritet, datadriven prioritering** — inte stammisrabatter eller App Store-budget.

---

*Källor: projektdokumentation jun 2026; publika sidor Matdags, Skafferikoll, Bring, ICA, FreshKeeper, m.fl.; kodbas home-pantry.*
