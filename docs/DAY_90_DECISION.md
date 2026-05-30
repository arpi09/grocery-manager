# Beslut dag 90 — webb+SV eller Capacitor?

*Version: maj 2026. Punkt 15 i [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md). Källa: [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) avsnitt 13 (PMF-mätetal), avsnitt 11 Should #12, punkt 15.15.*

**Status:** Beslutsramverk dokumenterat. Själva beslutet fattas av ägaren vid dag 90 — fyll i checklistan längst ner.

---

## 1. Varför detta beslut?

Efter 90 dagar ska du **inte** gissa nästa steg. Home Pantry är idag en **webbapp** (SvelteKit + PWA). Huvudkonkurrenten **Matdags** har native iOS/Android och App Store-distribution. Capacitor-wrapper kostar tid (build, notiser, store-review, underhåll) — det ska bara startas om **retention och vanor** visar att produkten redan har PMF på webben men saknar distribution/vardagsfriktion som native löser.

Alternativet **dubbla ner på webb+SV** betyder: fler Must-punkter (scan-kvalitet, kvitto, onboarding), SEO/communities, paywall — **inte** App Store än.

**Primär beslutsgate:** **D30-retention** (plus stödjande PMF-mätetal). Se [`/admin`](/admin) → PMF-mätetal.

---

## 2. De två vägarna

| Väg | Betyder | När det passar |
|-----|---------|----------------|
| **A. Webb + SV** | Förbättra produkt, marknad och retention i nuvarande stack (PWA, e-post, web push). Ingen Capacitor/App Store i nästa kvartal. | D30 och aktivering **under** trösklar — fixa PMF först |
| **B. Capacitor-wrapper** | Börja App Store/Google Play-resa (Should #12). Samma SvelteKit-kod, native shell, push-notiser, bättre kamera-vana. | D30 **på eller över** tidig tröskel **och** kvalitativt stöd (intervjuer, PWA-friction) |

Capacitor är **inte** full native omskrivning — det är distributions- och notis-lager ovanpå webben. Om kärnproblemet är “jag förstår inte värdet” eller “kvittot funkar dåligt” hjälper inte App Store.

---

## 3. PMF-trösklar (från konkurrensanalys + kod)

Målen speglas i `src/lib/domain/pmf.ts` (`PMF_TARGETS`) och visas på `/admin`.

| Mätetal | Definition | Mål | Källa |
|---------|------------|-----|-------|
| **Aktivering** | ≥10 varor eller 1 kvitto inom 24 h efter registrering | **>40 %** | CA §13 |
| **Tid till första scan** | Median minuter registrering → första scan/kvitto | **<3 min** | CA §13 |
| **Veckoscan-rate** | Andel WAU som scannat något den veckan | **>30 %** | CA §13 |
| **D7-retention** | Andel som fortfarande aktiv 7 dagar efter registrering | **>20 %** (indikativt) | CA §13 |
| **D30-retention** | Andel aktiv 30 dagar efter registrering | **>15 % tidigt**, **>25 % moget** | CA §13 — **primär gate** |
| **Hushåll 2+ aktiva** | Andel aktiva hushåll med ≥2 aktiva medlemmar (WAU) | **>50 %** | CA §13 |
| **Smart fill / vecka** | Andel WAU som använt smart fill | **>20 %** | CA §13 |
| **NPS / Sean Ellis** | “Hur besviken skulle du vara om Home Pantry försvann?” — andel “Mycket besviken” | **>40 %** | CA §13 (enkät, ej i dashboard än) |

**Tolkning D30:**

- **<10 %** — ingen App Store-investering; fokus A (onboarding, kvitto, churn från [USER_INTERVIEWS.md](./USER_INTERVIEWS.md)).
- **10–14 %** — grå zon; A om aktivering/scan också svaga, annars begränsad B-pilot (TestFlight, 20 användare).
- **≥15 % (tidig tröskel)** — B är **tillåten** om kvalitativ data pekar på web/PWA-friction (notiser, hemskärm, kamera).
- **≥25 % (moget)** — stark kandidat för B om Matdags/ASO är strategisk prioritet.

Använd **d30EligibleUsers ≥ 30** innan du litar på procenten — annars för lite data.

---

## 4. Beslutsmatris (D30 + stödmätetal)

Fyll i faktiska värden från `/admin` vecka 12–13.

### Scenario 1 → Väg A (Webb + SV)

Minst **två** av:

- [ ] D30 **< 15 %** (med tillräcklig kohort)
- [ ] Aktivering **< 40 %**
- [ ] Veckoscan-rate **< 30 %**
- [ ] Median tid till första scan **> 3 min**
- [ ] Intervjusyntes: topp-churn = “fattade inte värdet”, “kvitto/scan krånglade”, **inte** “saknar app i App Store”

**Nästa 90 dagar (A):** Must kvar (scan SV, kvitto-PDF, prissättning live), communities enligt [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md), veckovis PMF-rutin (#14).

### Scenario 2 → Väg B (Capacitor-wrapper)

Minst **tre** av:

- [ ] D30 **≥ 15 %** (eller ≥ 25 % om kohort > 100 registrerade)
- [ ] Aktivering **≥ 40 %**
- [ ] Veckoscan-rate **≥ 30 %**
- [ ] Hushåll 2+ **≥ 50 %** (moat byggs)
- [ ] Intervjuer / feedback: återkommande “vill ha riktig app / push / notis innan utgång”
- [ ] PWA-installation låg trots mobiltrafik (mät via analytics eller enkät)

**Nästa 90 dagar (B):** Capacitor-projekt, iOS först (Matdags SV), web push + native push-plan, ASO-basics, behåll webb som primär deploy.

### Scenario 3 → Hybrid (rekommenderat ofta)

D30 **15–20 %**, bra aktivering men svag scan-vana:

- [ ] **A i 60 dagar** (scan-kvalitet, kvitto, smart fill)
- [ ] **B-förberedelse parallellt:** spike Capacitor (1 vecka), ingen store-submit förrän D30 **≥ 20 %** två veckor i rad

---

## 5. Kvalitativa inputs (obligatoriskt)

Siffror räcker inte. Innan beslut:

1. **Läs syntes** i [USER_INTERVIEWS.md](./USER_INTERVIEWS.md) — topp 3 churnorsaker.
2. **Granska feedback** på `/admin` → Användarfeedback.
3. **Jämför med Matdags** (CA §4.1): saknar vi bara App Store, eller funktion/kvalitet?
4. **AI-enhetsekonomi** ([PRICING.md](./PRICING.md)): klarar marginalen fler användare från ASO?

---

## 6. Kostnad / risk (kort)

| | Väg A | Väg B |
|---|-------|-------|
| **Tid solo** | Låg extra (fortsätt webb) | 2–4 veckor setup + löpande store |
| **Risk** | Matdags tar ASO | Scope creep, review, notiser |
| **Upside** | Snabbare iteration | Distribution, push, “riktig app”-trust |

Se CA §8 (Webb-only-risk) och §11 Should #12.

---

## 7. Checklista för ägare — fyll i vid dag 90

**Datum beslut:** _______________  
**Data per:** _______________ (export/screenshot från `/admin`)

### A. Hårda mätetal

| Mätetal | Faktiskt värde | Mål | På mål? |
|---------|----------------|-----|---------|
| Aktivering (24 h) | _____ % | >40 % | ☐ Ja ☐ Nej |
| Median tid till första scan | _____ min | <3 min | ☐ Ja ☐ Nej |
| Veckoscan-rate | _____ % | >30 % | ☐ Ja ☐ Nej |
| D7-retention | _____ % | >20 % | ☐ Ja ☐ Nej |
| **D30-retention** | _____ % | >15 % / >25 % | ☐ Ja ☐ Nej |
| d30EligibleUsers (kohort) | _____ | ≥30 rekomm. | ☐ Ja ☐ Nej |
| Hushåll 2+ aktiva | _____ % | >50 % | ☐ Ja ☐ Nej |
| Smart fill / vecka | _____ % | >20 % | ☐ Ja ☐ Nej |

### B. Kvalitativt

- [ ] 10 intervjuer genomförda och syntes ifylld
- [ ] Topp-3 churnorsaker dokumenterade: 1) _____ 2) _____ 3) _____
- [ ] Andel feedback som nämner “app store / native / push”: ☐ Hög ☐ Låg
- [ ] Kvitto-PDF-testpack: ☐ ≥15/20 riktiga PDF godkända

### C. Beslut

**Vald väg:** ☐ **A — Webb + SV** ☐ **B — Capacitor** ☐ **Hybrid (specificera):** _____

**Motivering (3 meningar, D30-centrerad):**

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

**Top 3 actions nästa 90 dagar:**

1. ___________________________________________________________________________
2. ___________________________________________________________________________
3. ___________________________________________________________________________

**Datum för omprövning (om hybrid/A):** _______________

---

## 8. Referenser

- PMF-dashboard: [`/admin`](/admin) (inloggad som admin)
- Mål i kod: `src/lib/domain/pmf.ts`
- PWA idag: [PWA.md](./PWA.md)
- Prissättning: [PRICING.md](./PRICING.md)
- Konkurrens & roadmap Must/Should: [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) §11–13
