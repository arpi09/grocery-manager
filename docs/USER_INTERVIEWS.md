# Användarintervjuer — churn & aktivering

Operativt kit för **90-dagars punkt 9**: 10 intervjuer med svenska hushåll. Syftet är att förstå varför folk slutar använda Home Pantry och vad som blockerar aktivering — inte att sälja in nya features.

**Komplettera med:** in-app-feedback under Inställningar → *Ge feedback*, samt PMF-mätetal på [`/admin`](/admin) (aktivering, scan, retention).

---

## Mål

| Fråga | Varför |
|-------|--------|
| Vad fick dem att **sluta** eller använda appen sällan? | Churn / låg retention |
| Vad **blockerade första sessionen**? | Aktivering (kvitto vs streckkod, friktion) |
| Skulle de **betala** för Pro — och för vad? | Prishypotes (`docs/PRICING.md`) |

Efter 10 intervjuer: fyll i **Syntes** längst ner och prioritera topp 3 produktfixar.

---

## Rekrytering (10 SV-hushåll)

**Målgrupp:** vuxna i hushåll som handlar mat regelbundet, gärna redan intresserade av matsvinn/planering — inte bara tech-early-adopters.

| Kanal | Hur |
|-------|-----|
| **Vänner & familj** | 3–4 hushåll, 30 min video eller fika |
| **Reddit** | t.ex. r/sweden, r/ZeroWaste — kort post: "testar svensk skafferapp, söker 30 min feedback (ej reklam)" |
| **Facebook-grupper** | matsvinn, föräldrar, meal prep, lokala kö-grupper |
| **Befintliga användare** | Fråga i app via feedback + erbjud 30 min om de lämnar e-post (GDPR: spara bara med samtycke) |

**Urval:** blanda nybörjare (testat 1 gång) och de som använt 1–2 veckor. Undvik bara "superfans" — du vill höra churn.

**Incitament (valfritt):** gratis Pro i 3 månader efter intervjun, eller presentkort ~100 kr.

---

## Förberedelse (15 min innan samtalet)

1. Skapa konto åt deltagaren om de inte har ett — eller be dem logga in på sin telefon.
2. Ha [`/admin`](/admin) PMF-dashboard öppet (om de godkänner anonymiserad jämförelse med beteende).
3. Skriv deltagar-ID i tabellen: `P1` … `P10` (inga riktiga namn i detta dokument).
4. Spela in **inte** utan uttryckligt samtycke; anteckna istället.

---

## Intervjuguide (~30 min)

### Intro (3 min)

> "Hej! Jag bygger Home Pantry — en svensk app för skafferi, utgångsdatum och inköpslista. Det här är inte en säljpitch; jag vill förstå vad som funkar och inte i vardagen. Det finns inga fel svar. Kan jag anteckna? Kan vi gå igenom appen på din telefon om du vill?"

- Bekräfta **anonymitet** i anteckningarna (P1–P10).
- Fråga om de vill **dela skärm** eller bara prata.

### Walkthrough (10 min)

Be dem **tänka högt** medan de:

1. Öppnar appen / loggar in.
2. Visar hur de **senast** lade in varor (kvitto, streckkod eller manuellt).
3. Hittar **utgående varor** och **inköpslista**.

**Observéra (skriv ner):**

- Var fastnar de?
- Nämner de "för mycket jobb", "glömmer appen", "använder ICA/Bring istället"?

### Churn & vanor (12 min)

1. *"När öppnade du appen senast — och varför just då?"*
2. *"Vad fick dig att **inte** öppna den oftare?"* (huvudfråga)
3. *"Vad skulle få dig att öppna den **varje vecka** efter handeln?"*
4. *"Använder du något annat idag för skafferi/lista/plan?"* (Bring, ICA, Matdags, papper?)
5. *"Känns det värt att scanna/spara utgång — eller känns det som extra jobb?"*
6. *"Har du fått eller vill du ha **påminnelser** om utgång?"*
7. *"Förstod du **integritet/AI** kring kvitto?"* (om de testat kvitto)
8. *"Vad är det **enda** som skulle få dig att rekommendera appen till en vän?"*

**Probing vid vaga svar:**

- "Kan du ge ett exempel från förra veckan?"
- "Vad gjorde du istället när du inte öppnade appen?"

### Betalvilja (3 min)

1. *"Om Pro kostade ~39 kr/mån — vad måste finnas för att du betalar?"*
2. *"Free räcker för dig — varför?"*

### Avslut (2 min)

> "Tack! Jag sammanställer mönster från 10 samtal. Får jag höra av mig om vi fixar X?"

- Fråga om de vill vara **betatestare** (e-post med samtycke).

---

## Anteckningsmall (per deltagare)

Kopiera en rad per intervju. **Anonymisera** — ingen e-post/namn i denna fil.

| ID | Datum | Profil (kort) | Senast aktiv | Churn/hinder (citat) | Alternativ verktyg | Wow-moment | Betalvilja | Uppföljning |
|----|-------|---------------|--------------|----------------------|--------------------|------------|------------|-------------|
| P1 | | t.ex. 2 vuxna + barn | | | | | Ja/Nej/Vill X | |
| P2 | | | | | | | | |
| P3 | | | | | | | | |
| P4 | | | | | | | | |
| P5 | | | | | | | | |
| P6 | | | | | | | | |
| P7 | | | | | | | | |
| P8 | | | | | | | | |
| P9 | | | | | | | | |
| P10 | | | | | | | | |

**Profil-kolumner (exempel):** storlek hushåll, handlar ICA/Willys/Coop, barn, husdjur, matsvinn-intresse.

**Koppla till produkt:** jämför "senast aktiv" med användarstatus i `/admin` om deltagaren samtycker.

---

## Syntes (efter 10 intervjuer)

Fyll i när alla 10 är klara.

### Mönster (3–5 bullets)

- 
- 
- 

### Topp 3 produktfixar (prioriterad)

1. 
2. 
3. 

### Citat att spara (valfritt, anonymt)

- 

### Beslut

- [ ] Uppdatera onboarding-copy
- [ ] Uppdatera `/faq` eller `/privacy`
- [ ] Skapa GitHub-issues för fix 1–3
- [ ] Jämför med PMF på `/admin` — stämmer churn-bilden?

---

## Relaterat i produkten

| Resurs | Syfte |
|--------|--------|
| [`/admin`](/admin) → PMF-mätetal | Aktivering, scan-rate, D7/D30 |
| Inställningar → **Ge feedback** | Löpande churn-röster från användare |
| `docs/90_DAY_ROADMAP.md` punkt 9 | Status i 90-dagarsplanen |

*10 intervjuer genomförs av ägaren; detta dokument och app-feedback samlar in sig.*
