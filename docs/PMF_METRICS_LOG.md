# PMF metrics log — 4 veckor (launch + case study)

Veckovis logg för **Spår B3**: måndags-PMF enligt [`PMF_WEEKLY.md`](./PMF_WEEKLY.md). Kopiera siffror från [`/admin`](https://skaffu.com/admin) → PMF-mätetal. Efter **4 veckor**: överför sammanfattning till **case study v2** (§ Resultat) med ärliga råtal.

**Rutin:** ~30 min varje måndag · samma metrics som veckomejl (cron mån 08:00 UTC)

**Auto-export:** På `/admin` → fliken **Analys** → *Exportera CSV (30 dagar)*, eller direkt `GET /api/admin/data?section=export&period=30` (admin-inloggad). CSV innehåller PMF-snapshot, event per dag och topp-routes — för Excel, case study och investerare.

---

## Baseline (före launch våg 1)

*Fyll innan första community-post. Källa: `/admin` eller `pmf-snapshot.integration.test.ts`.*

| | Värde | Datum |
|---|-------|-------|
| Användare | *(fyll från `/admin`)* | |
| Hushåll | *(fyll från `/admin`)* | |
| Aktivering (24 h) | *(fyll %)* | |
| Sean Ellis ("Mycket besviken") | *(fyll % — mål >40 %)* | |
| Pro-waitlist | *(fyll)* / 50 | |

**Launch startdatum (vecka 1 post):** _______________

---

## Vecka 1 — måndag ___________

**Launch:** Primär kanal postad? ☐ Ja · Datum: ______ · `utm_campaign`: `matsvinn_w1`

### Hälsa (`/admin` överst)

| | Värde |
|---|-------|
| Användare | |
| Hushåll | |
| Lagerposter | |
| Fel (7 d) | |
| Pro-waitlist | / 50 |

### PMF vs mål

| Metric | Nu | Mål | Förra vecka | Δ | På mål? |
|--------|-----|-----|-------------|---|---------|
| Aktivering (24 h) | | ≥40 % | | | |
| Tid till första scan (median) | | ≤3 min | | | |
| Veckoscan-rate | | ≥30 % | | | |
| D7-retention | | ≥20 % | | | |
| D30-retention | | ≥15 % | | | |
| Flera medlemmar (WAU) | | ≥50 % | | | |
| Smart fill / vecka | | ≥20 % | | | |

*Underliggande råtal (eligible, WAU, events) från samma panel — anteckna här om behövs:*

### Launch-kohort (vecka 1)

| Signal | Värde |
|--------|-------|
| Nya registreringar (7 d) | |
| Varav UTM `facebook` | |
| Aktiverade inom 24 h (launch-kohort) | |
| Nya feedback-poster (`/admin#feedback`) | |

### En åtgärd denna vecka

**Metric under mål (välj EN):** _______________________

**Åtgärd:** _______________________

### Lärdomar & citat (intervjuer / trådar)

- 
- 

---

## Vecka 2 — måndag ___________

**Launch:** Sekundär kanal postad? ☐ Ja · Datum: ______ · `utm_campaign`: ___________

### Hälsa

| | Värde |
|---|-------|
| Användare | |
| Hushåll | |
| Lagerposter | |
| Fel (7 d) | |
| Pro-waitlist | / 50 |

### PMF vs mål

| Metric | Nu | Mål | Förra vecka | Δ | På mål? |
|--------|-----|-----|-------------|---|---------|
| Aktivering (24 h) | | ≥40 % | | | |
| Tid till första scan (median) | | ≤3 min | | | |
| Veckoscan-rate | | ≥30 % | | | |
| D7-retention | | ≥20 % | | | |
| D30-retention | | ≥15 % | | | |
| Flera medlemmar (WAU) | | ≥50 % | | | |
| Smart fill / vecka | | ≥20 % | | | |

### Launch-kohort (vecka 2)

| Signal | Värde |
|--------|-------|
| Nya registreringar (7 d) | |
| Varav UTM `reddit` | |
| Aktiverade inom 24 h | |
| D7 för vecka 1-kohort (om eligible) | |

### En åtgärd denna vecka

**Metric under mål (välj EN):** _______________________

**Åtgärd:** _______________________

### Lärdomar & citat

- 
- 

---

## Vecka 3 — måndag ___________

### Hälsa

| | Värde |
|---|-------|
| Användare | |
| Hushåll | |
| Lagerposter | |
| Fel (7 d) | |
| Pro-waitlist | / 50 |

### PMF vs mål

| Metric | Nu | Mål | Förra vecka | Δ | På mål? |
|--------|-----|-----|-------------|---|---------|
| Aktivering (24 h) | | ≥40 % | | | |
| Tid till första scan (median) | | ≤3 min | | | |
| Veckoscan-rate | | ≥30 % | | | |
| D7-retention | | ≥20 % | | | |
| D30-retention | | ≥15 % | | | |
| Flera medlemmar (WAU) | | ≥50 % | | | |
| Smart fill / vecka | | ≥20 % | | | |

### Event counts (7 d) — valfritt

| Event | Antal |
|-------|-------|
| `scan_completed` | |
| `receipt_parsed` | |
| `wrapped_viewed` | |
| `wrapped_shared` | |

### En åtgärd denna vecka

**Metric under mål (välj EN):** _______________________

**Åtgärd:** _______________________

### Lärdomar & citat

- 
- 

---

## Vecka 4 — måndag ___________ (syntes → case study)

### Hälsa

| | Värde |
|---|-------|
| Användare | |
| Hushåll | |
| Lagerposter | |
| Fel (7 d) | |
| Pro-waitlist | / 50 |

### PMF vs mål (slutlinje)

| Metric | Vecka 4 | Mål | Vecka 1 (baseline) | Δ totalt | På mål? |
|--------|---------|-----|-------------------|----------|---------|
| Aktivering (24 h) | | ≥40 % | | | |
| Tid till första scan (median) | | ≤3 min | | | |
| Veckoscan-rate | | ≥30 % | | | |
| D7-retention | | ≥20 % | | | |
| D30-retention | | ≥15 % | | | |
| Flera medlemmar (WAU) | | ≥50 % | | | |
| Smart fill / vecka | | ≥20 % | | | |

### Launch-experiment (4 veckor)

| Kanal | Registreringar | Aktiverade (24h) | Bäst vinkel |
|-------|----------------|------------------|-------------|
| FB `matsvinn_w1` | | | |
| Reddit | | | |
| **Totalt** | | | |

### En åtgärd denna vecka

**Metric under mål (välj EN):** _______________________

**Åtgärd:** _______________________

### Lärdomar & citat (intervjuer)

- 
- 

---

## Export till case study v2 (efter vecka 4)

*Kopiera till `docs/CASE_STUDY_SKAFFU.md` § Resultat — ärliga siffror, inga överdrifter.*

### Resultat (utkast)

**Period:** ___________ – ___________

**Skala:** ___ användare, ___ hushåll efter launch-experiment.

**Aktivering:** ___ % (mål 40 %) — ___ / ___ nya inom 24 h.

**Retention:** D7 ___ % · D30 ___ % (tidigt kohort).

**Bästa kanal:** ___________ — ___ registreringar, ___ % aktivering.

**Wrapped:** ___ `wrapped_viewed` · ___ `wrapped_shared` (7 d peak).

**Pro-waitlist:** ___ / 50.

### Lärdomar (3 bullets)

1. 
2. 
3. 

### Citat (anonymt, från [`USER_INTERVIEW_TRACKER.md`](./USER_INTERVIEW_TRACKER.md))

> 

> 

### Beslut nästa fas

- [ ] Fortsätt community (vilken kanal?)
- [ ] Produktfix #1: ___________
- [ ] Uppdatera onboarding/landning copy

---

## Referens

| Metric | Definition | `/admin`-panel |
|--------|------------|----------------|
| Aktivering | ≥10 varor eller kvittoparse inom 24 h | PMF → Aktivering |
| Första scan | Median registrering → scan/kvitto | PMF → Första scan |
| Veckoscan | WAU med scan/kvitto denna vecka | PMF → Veckoscan |
| D7 / D30 | Retention eligible kohort | PMF → D7 / D30 |

Full rutin: [`PMF_WEEKLY.md`](./PMF_WEEKLY.md) · Launch metrics: [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) · Intervjuer: [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md)

*Deliverable redo 2026-06-07. Ägaren fyller varje måndag under launch-perioden.*
