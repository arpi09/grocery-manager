# Community launch — operativt playbook

Operativt kit för **90-dagars punkt 13**: lansera Home Pantry i **2–3 communities** under en 2–4 veckors period. Syftet är kvalificerad trafik och tidiga power users — inte viral spridning eller betald annonsering.

**Komplettera med:** PMF-mätetal på [`/admin`](/admin), in-app-feedback (Inställningar → *Ge feedback*), och intervjukit i [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md).

---

## Mål

| Mål | Indikator (2–4 veckor efter launch) |
|-----|-------------------------------------|
| **Rätt målgrupp** | Registreringar från SV-hushåll som handlar mat regelbundet |
| **Aktivering** | Andel som når PMF-aktivering (≥10 varor eller 1 kvitto inom 24 h) > baslinje |
| **Retention-signal** | D7/D30 för community-kohort jämfört med övriga |
| **Lärande** | Vilken kanal + vinkel (matsvinn / föräldrar / meal prep) ger bäst aktivering |

**Ej mål:** tusentals besökare, press, betald influencer, eller “feature requests”-storm utan användning.

---

## Strategi — max 2–3 communities

Välj **en primär** och **en–två sekundära** kanaler. Kör dem **staggered** (vecka 1 → vecka 2 → vecka 3) så du kan läsa PMF mellan vågor.

| Segment | Varför Home Pantry passar | Risk |
|---------|---------------------------|------|
| **Matsvinn** | Utgång, mindre dubbelköp, kvitto-PDF — tydligt värde | Kan uppfattas som “ännu en app”; var ärlig om webb/PWA |
| **Föräldrar** | Hushållssync, delad lista, “vad finns hemma?” | Tidsbrist — onboarding måste vara <5 min |
| **Meal prep** | Lager + plan + smart inköpslista | Kan jämföras med Mealime/Matbotten — betona **lager som sanningskälla** |

**Rekommenderad kombination (solo/indie):**

1. **Primär:** Facebook-grupp matsvinn (SV, aktiv diskussion).
2. **Sekundär:** Reddit `r/sweden` eller `r/ZeroWaste` (kort, regel-följsam post).
3. **Valfri tredje:** Föräldra- eller meal prep-grupp om primär gav >5 aktiverade användare.

---

## Kanaler — konkreta förslag

Verifiera alltid **gruppregler** och moderators riktlinjer innan post. Länka till `https://homepantry.com` (eller din live-domän enligt [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md)).

### Matsvinn

| Kanal | Typ | Anteckning |
|-------|-----|------------|
| Facebook: *Matsvinn*, *Rädda maten*, *Klimatsmart mat* (sök SV-grupper) | Grupp | Primär — berätta att du bygger, be om feedback |
| Reddit: `r/ZeroWaste` | Subreddit | EN post OK; nämn svensk produkt |
| Reddit: `r/sweden` | Subreddit | Endast om regler tillåter “egen produkt” — ofta veckotråd / mod mail först |
| Lokala kö-grupper / Buy Nothing SV | Grupp | Soft mention — fokus hjälp, inte reklam |

### Föräldrar

| Kanal | Typ | Anteckning |
|-------|-----|------------|
| Facebook: föräldragrupper (kommun/stad eller “mat till barn”) | Grupp | Vinkel: delat hushåll, slipp dubbelköp |
| Föräldranätverk du redan är med i | DM / tråd | 3–5 personliga inbjudningar > en stor post |
| Befintliga beta-användare | E-post / DM | “Känner du ett hushåll som…” |

### Meal prep

| Kanal | Typ | Anteckning |
|-------|-----|------------|
| Facebook: *meal prep Sverige*, *matlådor* | Grupp | Vinkel: plan + lista från verkligt lager |
| Reddit: `r/mealprep` | Subreddit | Internationell; kort demo-länk |
| Instagram (hashtag) | Kommentar/DM | Lägre konvertering — endast om du redan postar där |

---

## UTM — spårning per kanal

Använd **konsekventa** UTM-parametrar på alla länkar i community-poster. Det gör det möjligt att filtrera i analytics (Firebase / Plausible / GA om du lägger till det) och att manuellt jämföra med registreringar i admin.

### Namnkonvention

| Parameter | Värde (exempel) | Regel |
|-----------|-----------------|-------|
| `utm_source` | `facebook`, `reddit`, `instagram`, `dm` | Plattform |
| `utm_medium` | `community` | Alltid `community` för detta playbook |
| `utm_campaign` | `matsvinn_w12`, `foraldrar_w13`, `mealprep_w14` | Segment + vecka (ISO vecka valfritt) |
| `utm_content` | `post_a`, `comment_help`, `thread_zero_waste` | Valfritt — A/B av copy |

### Bas-URL

```
https://homepantry.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w12
```

**Djuplänkar (valfritt):**

| Sida | När |
|------|-----|
| `/` | Standard — hero + jämförelse |
| `/sa-fungerar-det` | Om folk frågar “hur funkar det?” |
| `/funktioner` | Meal prep / feature-nyfikna |
| `/install-app` | Efter registrering — PWA på telefon |

Exempel med alla UTM + install:

```
https://homepantry.com/install-app?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w12&utm_content=post_install_tip
```

### Vad som händer i produkten

Om besökaren landar med UTM i query string **bevaras** standard-UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) på marketing-CTA-länkar till `/login` och `/register` (se `src/lib/marketing/utm-params.ts`).

Vid **registrering** sparas `utm_source`, `utm_medium`, `utm_campaign` och `utm_content` (inte `utm_term`) på användarraden:

1. Besökaren når `/register` med UTM i URL (direkt eller via marketing-CTA).
2. Servern sätter en httpOnly-cookie (`hp_signup_utm`, 30 dagar) så UTM finns kvar om användaren byter sida innan signup.
3. Vid lyckad registrering skrivs värdena till kolumnerna `signup_utm_*` i tabellen `user`; cookien raderas.

### Läsa UTM i admin

1. Logga in som admin och öppna **`/admin`**.
2. I tabellen **Användare** finns kolumnen **UTM source** (`signup_utm_source`) — t.ex. `facebook`, `reddit`, `instagram`.
3. Tom cell (`—`) = registrerad utan sparad källa (äldre konto eller ingen UTM i länk).
4. För kampanjdetaljer (`utm_medium`, `utm_campaign`, `utm_content`) finns värdena i databasen på samma rad (`signup_utm_medium`, `signup_utm_campaign`, `signup_utm_content`) tills admin-UI utökas; för launch räcker ofta **source + registreringsdatum** i tabellen.

**Tips:** filtrera manuellt på registreringsvecka (kolumnen **Skapad**) och jämför antal per UTM source med din launch-logg nedan.

---

## Postmallar (SV)

Byt ut `[LÄNK]` mot din UTM-länk. Håll ton enligt [`BRAND.md`](./BRAND.md): varm, direkt, utan skuld kring matsvinn.

### Mall A — Matsvinn (Facebook-grupp, ~120–180 ord)

**Rubrik (om gruppen har):** Svensk skafferapp — söker feedback (inte reklam)

**Brödtext:**

> Hej! Jag bygger **Home Pantry** — en svensk webbapp där du skannar streckkod eller laddar upp kvitto (även PDF från ICA/Kivra) och får kyl/frys/skafferi med utgångsdatum och inköpslista som utgår från vad som faktiskt finns hemma.
>
> Jag är **inte** ute efter att sälja något nu (gratis att testa). Jag vill ha **5–10 hushåll** som testar i 1–2 veckor och säger vad som känns onödigt krångligt — särskilt första gången.
>
> Det som skiljer från ICA-appen är att det är **butiksneutralt** och fokuserar på lager + utgång, inte erbjudanden.
>
> Länk: [LÄNK]
>
> Om det bryter mot gruppregler — säg till så tar jag bort. Tack!

**Första kommentar (valfritt):** Tips — lägg appen på hemskärmen via `/install-app` efter inloggning.

---

### Mall B — Föräldrar (~100–150 ord)

> Hej föräldrar! Jag testar en svensk app för **delat skafferi** i hushållet: skanna varor eller kvitto, se vad som finns i kyl/frys, och få inköpslista utan att alla ska gissa.
>
> Söker **3–5 familjer** som handlar veckovis och kan prova 30 min + återkomma med ärlig feedback (vad som strular med barn/stress i vardagen).
>
> Webbapp — funkar i telefonens webbläsare, kan “installeras” på hemskärmen.
>
> [LÄNK] — ingen betalvägg än.

---

### Mall C — Meal prep (~90–130 ord)

> Hej meal prep-gäng! Jag bygger **Home Pantry** — lager (skanna/kvitto) kopplat till **måltidsplan och inköpslista**, så listan speglar vad du faktiskt har hemma innan du batchar.
>
> Söker testare som redan meal preppar och vill slippa dubbelköp. Inte en recept-app som ICA — mer “vad har jag hemma → vad behöver jag köpa”.
>
> Feedback välkommet: [LÄNK]

---

### Mall D — Reddit `r/sweden` / `r/ZeroWaste` (kort, EN eller SV)

**Titel:** [Feedback] Swedish pantry web app — scan receipt / barcode, expiry tracking

**Brödtext (EN):**

> I'm building a store-neutral pantry app for Swedish households (barcode + receipt PDF, fridge/freezer/cupboard, expiry, shared household). Looking for 5–10 testers for 2 weeks — not a sales pitch, free to try. Would value honest friction feedback on first session.
>
> https://homepantry.com/?utm_source=reddit&utm_medium=community&utm_campaign=zerowaste_w12
>
> Happy to answer questions in comments.

---

### Mall E — Uppföljning i tråden (när någon visar intresse)

> Tack! Bästa start: antingen **ladda upp ett kvitto** eller skanna **5 streckkoder** — du behöver inte fylla hela skafferiet dag ett. Om något strular, Inställningar → *Ge feedback* eller svara här.

---

## Regler & etikett

| Gör | Gör inte |
|-----|----------|
| Be om **feedback** och var transparent om att du är byggare | Posta samma text i 10 grupper samma dag |
| Läs **pin/regler**; be mod om tillåtelse vid tveksamhet | Köp fake likes eller astroturfing |
| Svara på kommentarer inom 24 h | Argumentera med konkurrenter |
| Använd **UTM per kanal** | Lova features som inte finns (push, native app, ICA-priser) |
| Rapportera ärligt: webb/PWA, AI på kvitto, gratis utan betalvägg än | Dela användardata eller skärmdumpar utan samtycke |

**GDPR:** Be inte om personnummer i trådar. Samla e-post för intervjuer bara med samtycke (se [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md)).

---

## Vad mäta (PMF)

Alla mål och definitioner finns i kod (`src/lib/domain/pmf.ts`) och på **`/admin` → PMF-mätetal**. För community-launch: mät **före**, **under** och **2 veckor efter** varje våg.

### Primära metrics (läs varje måndag)

| Metric | Mål (indikativt) | Var |
|--------|------------------|-----|
| **Aktiveringsgrad** | >40 % av nya registreringar | `/admin` |
| **Median tid till första scan** | <3 min | `/admin` |
| **Veckoscan-rate** | >30 % av WAU scannar | `/admin` |
| **D7-retention** | >20 % | `/admin` |
| **D30-retention** | >15 % tidigt | `/admin` |

### Sekundära (launch-specifika)

| Signal | Hur |
|--------|-----|
| **Klick → registrering** | UTM i webbanalytics ÷ antal registreringar samma vecka (manuellt OK) |
| **Kvalitet trafik** | Andel som når aktivering per `utm_campaign` (manuell kohort: registrerade vecka 12 + campaign namn i anteckningsbok tills UTM sparas i DB) |
| **Feedback-tema** | `/admin` → Användarfeedback — tagga “community” i intern anteckning |
| **Sean Ellis** | I intervjuer / enkät: *“Hur besviken skulle du vara om Home Pantry försvann?”* — mål >40 % “Mycket besviken” ([`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §13) |

### Events (redan instrumenterat)

| Event | Betydelse |
|-------|-----------|
| `scan_completed` | Streckkod funkar |
| `receipt_parsed` | Kvitto-wow |
| `fill_suggestions_added` | Smart fill / differentiator |

### Enkel launch-logg (kopia till anteckningsbok)

| Vecka | Kanal | `utm_campaign` | Inlägg datum | Klick (uppsk) | Registreringar | Aktiverade (24h) | D7 (senare) | Lärdom |
|-------|-------|----------------|--------------|---------------|----------------|------------------|-------------|--------|
| W12 | FB matsvinn | `matsvinn_w12` | | | | | | |
| W13 | Reddit | `zerowaste_w13` | | | | | | |
| W14 | FB föräldrar | `foraldrar_w14` | | | | | | |

---

## Tidsplan (2–4 veckor)

| Dag | Aktivitet |
|-----|-----------|
| **−3** | Välj 2–3 kanaler; skriv UTM-länkar; kontrollera att `homepantry.com` + `/privacy` är live |
| **0** | Posta **primär** (Mall A); pinna egen kommentar med install-tip |
| **1–3** | Svara alla kommentarer; bjud in 3–5 till kort DM-samtal om [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) |
| **7** | Läs `/admin` PMF; justera copy om aktivering < baslinje |
| **8** | Posta **sekundär** (Mall D) om regler OK |
| **14** | Valfri **tertiär** (Mall B eller C) endast om W12 gav ≥5 registreringar och ≥2 aktiverade |
| **21** | Syntes: vilken kanal vann; dokumentera i tabellen ovan; uppdatera landning/copy om ett återkommande invändning |

---

## Go / no-go innan post

- [ ] Domän live ([`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md))
- [ ] Onboarding: kvitto **eller** 5 streckkoder ([`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md) #2)
- [ ] `/privacy` + FAQ om AI/kvitto (#3)
- [ ] `/install-app` testad på iPhone + Android (#4)
- [ ] PMF-dashboard öppnas utan fel (#1)
- [ ] Du har tid att svara i tråden 30 min/dag i 5 dagar

---

## Syntes efter launch (fyll av ägare)

**Bästa kanal:** _______________

**Bästa vinkel (copy):** matsvinn / föräldrar / meal prep

**Topp 3 invändningar i kommentarer:**

1.
2.
3.

**Produktändring att prioritera (max 1):**

---

## Relaterade dokument

| Dokument | Innehåll |
|----------|----------|
| [`90_DAY_ROADMAP.md`](./90_DAY_ROADMAP.md) | Punkt 13 status |
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | §13 PMF-metrics, §15 punkt 13 |
| [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) | Djupintervjuer med community-leads |
| [`MARKETING_SITE.md`](./MARKETING_SITE.md) | Landning, A/B hero, CTAs |
| [`BRAND.md`](./BRAND.md) | Ton i poster |

---

*Kit levererat maj 2026. Själva postningen och syntesen körs av produktägare.*
