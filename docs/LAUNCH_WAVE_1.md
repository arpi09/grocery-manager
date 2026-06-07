# Launch våg 1 — redo att posta

Operativt kit för **Spår B1 + B2** i tillväxtplanen: ett avgränsat community-experiment med Wrapped/Skaffurapport som viral krok. **Ägaren postar manuellt** — detta dokument innehåller färdig copy, UTM-länkar och mättabeller.

**Bas:** [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) · **Prod:** [skaffu.com](https://skaffu.com) · **Mät:** [`/admin`](https://skaffu.com/admin)

---

## Go / no-go (kryssa innan vecka 1)

- [ ] [skaffu.com](https://skaffu.com) + `/privacy` live
- [ ] Onboarding: kvitto **eller** 5 streckkoder fungerar på mobil
- [ ] `/install-app` testad (iPhone + Android)
- [ ] `/statistik/wrapped` laddar + delningskort (PNG / Web Share)
- [ ] `/admin` PMF-panel öppnas utan fel
- [ ] Gruppregler lästa för primär FB-grupp + Reddit-sub
- [ ] Tid att svara i trådar ~30 min/dag i 5 dagar efter post

---

## Kanal & timing

| Våg | Vecka | Kanal | `utm_campaign` | Posta |
|-----|-------|-------|----------------|-------|
| **Primär** | 1 | Facebook-grupp matsvinn (SV) | `matsvinn_w1` | Dag 0 |
| **Sekundär** | 2 | Reddit `r/ZeroWaste` *eller* `r/sweden` | `zerowaste_w2` | Dag 8 (+7 efter primär) |

**Regel:** Posta **inte** sekundär kanal förrän du läst `/admin` efter vecka 1. Om primär gav &lt;2 registreringar — justera copy (Wrapped-krok, onboarding-tip) innan vecka 2.

---

## UTM-länkar (kopiera rakt av)

| Syfte | URL |
|-------|-----|
| **Primär post** | `https://skaffu.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=post_a` |
| **Wrapped-djuplänk (kommentar)** | `https://skaffu.com/statistik/wrapped?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=wrapped_hook` |
| **Install-tip (kommentar)** | `https://skaffu.com/install-app?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=install_tip` |
| **Sekundär (Reddit ZeroWaste)** | `https://skaffu.com/?utm_source=reddit&utm_medium=community&utm_campaign=zerowaste_w2&utm_content=post_a` |
| **Sekundär (Reddit sweden)** | `https://skaffu.com/?utm_source=reddit&utm_medium=community&utm_campaign=sweden_w2&utm_content=post_a` |

UTM sparas vid registrering (`signup_utm_*`) — filtrera i `/admin` → Användare → kolumn **UTM source** + **Skapad**.

---

## Vecka 1 — primär (Facebook matsvinn)

**Steg:** Sök SV-grupp (*Matsvinn*, *Rädda maten*, *Klimatsmart mat*). Läs pin/regler. Be mod om tillåtelse vid tveksamhet.

### Rubrik (om gruppen har rubrikfält)

Svensk skafferapp — söker feedback + dela er månad (inte reklam)

### Brödtext (~150 ord) — kopiera & klistra in

> Hej! Jag bygger **Skaffu** — en svensk webbapp där du skannar streckkod eller laddar upp kvitto (även PDF från ICA/Kivra) och får kyl/frys/skafferi med utgångsdatum och inköpslista som utgår från vad som **faktiskt** finns hemma.
>
> Jag är **inte** ute efter att sälja något (gratis att testa). Jag söker **5–10 hushåll** som provar 1–2 veckor och säger vad som känns krångligt — särskilt första gången.
>
> **Nytt:** Efter några dagars användning får du en **månadssammanfattning** — som Spotify Wrapped för kylskåpet — med hur mycket ni räddat och en **delningsbar bild** att posta här om ni vill (helt frivilligt). Öppna *Statistik → Er kylskåps-årstid* efter inloggning.
>
> Det som skiljer från ICA-appen: **butiksneutralt**, fokus lager + utgång, delat hushåll — inte erbjudanden.
>
> Länk: https://skaffu.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=post_a
>
> Om det bryter mot gruppregler — säg till så tar jag bort. Tack!

### Första kommentar (pinna om möjligt)

> **Snabbstart:** Ladda upp **ett kvitto** *eller* skanna **5 streckkoder** — du behöver inte fylla hela skafferiet dag ett.  
> **Wrapped:** https://skaffu.com/statistik/wrapped?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=wrapped_hook  
> **PWA på telefon:** https://skaffu.com/install-app?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w1&utm_content=install_tip

### Uppföljning i tråden (när någon visar intresse)

> Tack! Bästa start: kvitto **eller** 5 streckkoder. När ni har data — kolla *Er kylskåps-årstid* och dela PNG-kortet om ni vill inspirera andra. Strular något: Inställningar → *Ge feedback* eller svara här.

### Vecka 1 — ägarlogg (fyll efter post)

| Fält | Värde |
|------|-------|
| Gruppnamn | |
| Postdatum | |
| Klick (uppsk.) | |
| Registreringar (vecka 1) | |
| Aktiverade inom 24 h | |
| Kommentarer / DM | |
| Topp invändning | |
| Wrapped-delningar (uppsk.) | |

---

## Vecka 2 — sekundär (Reddit)

**Välj en:** `r/ZeroWaste` (EN, regel-följsam) **eller** `r/sweden` (kolla regler — ofta veckotråd / mod mail först).

### Alternativ A — `r/ZeroWaste` (EN)

**Titel:** [Feedback] Swedish pantry app — receipt scan, expiry, monthly “Wrapped” share card

**Brödtext:**

> I'm building **Skaffu** — a store-neutral pantry web app for Swedish households (barcode + receipt PDF, fridge/freezer/cupboard, expiry, shared household). Looking for 5–10 testers for 2 weeks — not a sales pitch, free to try.
>
> **Hook:** After a week of use you get a monthly summary (`/statistik/wrapped`) with saved SEK/kg and a **shareable PNG card** — optional to post here.
>
> Public aggregate stats (when cohort is large enough): `/rapport/YYYY-MM` — beta disclaimer until ≥50 households.
>
> https://skaffu.com/?utm_source=reddit&utm_medium=community&utm_campaign=zerowaste_w2&utm_content=post_a
>
> Happy to answer questions in comments.

### Alternativ B — `r/sweden` (SV eller EN)

**Titel:** [Feedback] Svensk skafferapp — kvitto, utgång, delat hushåll

**Brödtext (SV):**

> Bygger **Skaffu** — webbapp för kyl/frys/skafferi (streckkod + kvitto-PDF, utgångsdatum, delad inköpslista). Söker 5–10 hushåll som testar 2 veckor och ger ärlig feedback på första sessionen — inte reklam, gratis.
>
> Bonus: månadssammanfattning med delningskort på `/statistik/wrapped` när ni har data.
>
> https://skaffu.com/?utm_source=reddit&utm_medium=community&utm_campaign=sweden_w2&utm_content=post_a

### Vecka 2 — ägarlogg

| Fält | Värde |
|------|-------|
| Subreddit | |
| Postdatum | |
| Registreringar (vecka 2) | |
| Aktiverade inom 24 h | |
| D7 (fyll vecka 3+) | |

---

## Wrapped + Skaffurapport — viral krok (B2)

Använd i kommentarer, DM och uppföljningspost — **inte** som huvudbudskap dag 1 om gruppen är känslig för “reklam”.

| Asset | URL / beteende | När nämna |
|-------|-----------------|-----------|
| **Wrapped (privat)** | `/statistik/wrapped` | Efter testare har ≥1 kvitto eller ~10 varor |
| **Delningskort** | Slides → *Dela er månad* → PNG / Web Share | När någon frågar “vad får man ut av det?” |
| **Skaffurapport (publik)** | `/rapport/YYYY-MM` | Endast PR när ≥10 hushåll (k-anonymitet); ≥50 utan beta-disclaimer |

**Copy-snippet (DM / kommentar):**

> Prova en vecka — öppna sedan **Statistik → Er kylskåps-årstid**. Där ser ni sparade kronor/kg och kan ladda ner ett kort att dela. Helt frivilligt.

---

## Success metrics (från LAUNCH_PLAYBOOK)

Mät **före**, **under** och **2 veckor efter** varje våg. Läs varje **måndag** i [`/admin`](https://skaffu.com/admin) → PMF-mätetal. Logga veckovis i [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md).

### Primära metrics

| Metric | Mål (indikativt) | Var |
|--------|------------------|-----|
| **Aktiveringsgrad** | >40 % av nya registreringar | `/admin` → PMF → Aktivering |
| **Median tid till första scan** | <3 min | `/admin` → PMF → Första scan |
| **Veckoscan-rate** | >30 % av WAU scannar | `/admin` → PMF → Veckoscan |
| **D7-retention** | >20 % | `/admin` → PMF → D7 |
| **D30-retention** | >15 % (tidigt) | `/admin` → PMF → D30 |

### Sekundära (launch-specifika)

| Signal | Hur |
|--------|-----|
| **Klick → registrering** | UTM i analytics ÷ registreringar samma vecka (manuellt OK) |
| **Kvalitet trafik** | Andel aktiverade per `utm_campaign` (kohort: registrerade vecka + campaign i DB) |
| **Feedback-tema** | `/admin` → Användarfeedback — tagga “community” internt |
| **Sean Ellis** | I intervjuer: *“Hur besviken skulle du vara om Skaffu försvann?”* — mål >40 % “Mycket besviken” |

### Launch-logg (sammanfattning efter 4 veckor)

| Vecka | Kanal | `utm_campaign` | Inlägg datum | Klick (uppsk.) | Registreringar | Aktiverade (24h) | D7 (senare) | Lärdom |
|-------|-------|----------------|--------------|----------------|----------------|------------------|-------------|--------|
| 1 | FB matsvinn | `matsvinn_w1` | | | | | | |
| 2 | Reddit | `zerowaste_w2` / `sweden_w2` | | | | | | |

### Experiment-mål (2–4 veckor)

| Mål | Indikator |
|-----|-----------|
| **Rätt målgrupp** | Registreringar från SV-hushåll som handlar mat regelbundet |
| **Aktivering** | Andel PMF-aktivering (≥10 varor eller 1 kvitto inom 24 h) > baslinje |
| **Retention-signal** | D7/D30 för community-kohort vs övriga |
| **Lärande** | Vilken kanal + vinkel (matsvinn / Wrapped) ger bäst aktivering |

**Ej mål:** tusentals besökare, press, betald influencer, feature-storm utan användning.

---

## Tidsplan (ägare)

| Dag | Aktivitet |
|-----|-----------|
| **−3** | Go/no-go; skriv in faktiska gruppnamn ovan; spara UTM-länkar |
| **0** | Posta vecka 1 (FB); pinna install + Wrapped-kommentar |
| **1–3** | Svara alla kommentarer; bjud 2–3 till intervju ([`USER_INTERVIEW_TRACKER.md`](./USER_INTERVIEW_TRACKER.md)) |
| **7** | Måndag PMF — [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) vecka 1 |
| **8** | Posta vecka 2 (Reddit) om regler OK |
| **14** | Andra PMF-logg; fyll D7 för vecka 1-kohort |
| **21** | Syntes — fyll tabell + kopiera till case study v2 |

---

## Syntes efter launch (fyll av ägare)

**Bästa kanal:** _______________

**Bästa vinkel (copy):** matsvinn / Wrapped / onboarding-tip

**Topp 3 invändningar i kommentarer:**

1.
2.
3.

**Produktändring att prioritera (max 1):**

---

## Relaterat

| Dokument | Innehåll |
|----------|----------|
| [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) | Full playbook, fler mallar |
| [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) | 4 veckors måndagslogg |
| [`USER_INTERVIEW_TRACKER.md`](./USER_INTERVIEW_TRACKER.md) | 2–3 intervjuer från tråden |
| [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) | Intervjuguide |
| [`WRAPPED.md`](./WRAPPED.md) | Wrapped-spec |
| [`LAUNCH_CHECKLIST_GROWTH_WAVE.md`](./LAUNCH_CHECKLIST_GROWTH_WAVE.md) | Skaffurapport cron & gates |

*Deliverable redo 2026-06-07. Postning och syntes körs av ägaren över vecka 1–4.*
