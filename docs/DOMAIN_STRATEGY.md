# Domänstrategi — Home Pantry (svensk marknad)

*Version: maj 2026 (reviderad efter produktägarfeedback). Utgår från `docs/BRAND.md`, `docs/COMPETITIVE_ANALYSIS.md`, `docs/MARKETING_SITE.md` och nuvarande prod på Firebase App Hosting.*

> **Status idag:** `homepantry.com` är **upptagen** (parkerings-IP). Prod kör på  
> `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app` tills en egen domän köps och kopplas ([`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md)).

> **Intern kodbas** kan fortsätta heta `home-pantry` / **Home Pantry** i UI — **publik domän behöver inte matcha** repo eller engelskt produktnamn.

---

## Produktägarfeedback (maj 2026) — avvisad tidigare riktning

> *"Inga av domännamnen är bra. De låter oproffsiga och är svåra att komma ihåg. Många vet nog inte vad pantry är."*

**Avvisas uttryckligen** som primär strategi:

| Avvisat | Varför |
|---------|--------|
| `homepantry.se` / `homepantry.*` | Engelskt *pantry* — otydligt på svenska, känns import-/bootstrap |
| `hemskafferiet.se` | För långt (13 tecken), tungt i tal |
| `hemmapantry.se` | Hybrid med obskyr engelska (*pantry*) |
| Övriga *pantry*- och långa action-domäner från v1-listan | Samma problem: uttal, stavning, proffsighet |

Ny riktning: **professionellt**, **rent svenskt uttal**, **kort**, **ingen obskyr engelska** om den inte förklaras i varje kontakt (undvik *pantry*, *larder*, *get*/`use`-prefix).

---

## Sammanfattning (ny rekommendation)

| Prioritet | Domän | Varför i ett nötskal |
|-----------|-------|----------------------|
| **1 — Primär** | **`skannhem.se`** | Kort svensk sammansättning (*skanna* + *hem*), scan-first, uttalbart, proffsigt — matchar tagline och GTM. |
| **2 — Backup** | **`hemlagret.se`** | Tydlig produktkategori (hemmets lager), varmt/köksnära utan engelska, skiljer från Matdags. |
| **3 — Backup** | **`laghem.se`** | Kort varumärkesbar form (*lager* + *hem*), lätt att säga — kräver en rad förklaring i hero. |

**Undvik som primär:** allt med *pantry*, `*dags*` (Matdags), generiska `skafferiet.*` (catering), `*koll*` nära **Skafferikoll** (`skafferikoll.se` — aktiv konkurrent), `hemkoll.*` (bostadstjänst på `hemkoll.com`), `mathem`/`matlager` (dagligvaru-/logistikassociation).

*Tillgänglighet = **hintar** (DNS maj 2026) — bekräfta alltid hos registrar (Internetstiftelsen, Loopia, Cloudflare, Porkbun).*

---

## 1. Kriterier (uppdaterade)

### Professionellt och minnesvärt på svenska

- **Uttal:** Ska fungera i telefon och i App Store utan stavning (*”ska-n-hem punkt se”*, inte *p-a-n-t-r-y*).
- **Längd:** **≤ 12 tecken** före TLD för primär domän (helst 6–10).
- **Språk:** Svenska ord eller **korta, egna varumärken** (2 stavelser) — inte lånord som kräver förklaring.
- **Undvik:** bindestreck, `get`/`use`/`try`, suffix `*app` som primär (känns billigt), ren beskrivande SEO-domän som huvudvarumärke.

### Positionering (från BRAND + konkurrens)

| Element | Implikation för domän |
|---------|------------------------|
| Tagline | *Skanna först. Håll koll på skafferiet. Handla smart.* → **skanna**, **hem**, **skafferi**, **lager** fungerar; *pantry* nej |
| Differentiator | Butiksneutral **lagersanningskälla**, scan/kvitto, smart inköpslista |
| Hot | **Matdags** (`matdags.se`), **Skafferikoll**, **Pantrist**, ICA/Bring/Hemköp — undvik ljudlikhet och `*dags*` |
| Ton | Varm, direkt, köksnära — domänen ska låta som en **tjänst**, inte kampanj eller catering |

### TLD

| TLD | Rekommendation |
|-----|----------------|
| **`.se`** | Primär — lokal trust, SV-ICP |
| **`.com`** | Defensiv backup om ledig (`skannhem.com` gav NXDOMAIN-hint maj 2026) |
| **`.app`** | Endast redirect/skydd — inte apex för mormor-testet |

### Intern vs publikt namn

- Repo, Firebase-projekt och kod: **`home-pantry`** — oförändrat.
- Publik domän + marknads-URL: **nytt svenskt namn** (tabell ovan).
- App Store / UI: kan visa *Home Pantry* med undertitel på svenska (*”Skanna hemma”*) tills/fullständig rebrand.

---

## 2. Namnkategorier — för- och nackdelar

### A. Rena svenska ord och korta sammansättningar

*Exempel:* `skannhem`, `hemlagret`, `hemkyl`, `matlagret`

| Fördelar | Nackdelar |
|----------|-----------|
| Hög trust, självförklarande | Risk för kategori-kollision (`matlager` ↔ logistik/Mathem) |
| Bra SEO-intent (*skafferi*, *hem*) | Vissa korta ord upptagna |

### B. Korta varumärkesnamn (≈2 stavelser, påhittade eller förkortade)

*Exempel:* `laghem`, `skollo`, `skafferio`, `skannio`

| Fördelar | Nackdelar |
|----------|-----------|
| Distinkt vs Matdags; lätt att äga varumärke | Kräver 1 mening förklaring i hero |
| Kort för ikon och App Store | `skollo` kan associeras till *skola* |

### C. Verb- och action-varumärken

*Exempel:* `skannat`, `hemscan` (engelskt scan), `spillmin`

| Fördelar | Nackdelar |
|----------|-----------|
| Scan-first tydligt | `hemscan` = engelska; `spillmin` negativ framing |
| | Långa former (`skannaskafferi`) — avvisade |

### D. Beskrivande / SEO-tunga (sekundära, inte apex)

*Exempel:* `skafferiapp`, `smartskafferi`, `inkopskoll`

| Fördelar | Nackdelar |
|----------|-----------|
| Tydlig kategori | Oproffsigt som huvuddomän; `*koll*` nära Skafferikoll |

### E. Avvisade kategorier från v1

| Kategori | Status |
|----------|--------|
| `homepantry*`, `hemmapantry*` | Avvisad — *pantry* |
| `hemskafferiet*` | Avvisad — för lång |
| `get*` / `use*` | Avvisad — SaaS-trust |
| `*dags*` | Undvik — Matdags |

---

## 3. Ny lista: 18 konkreta förslag (ej v1-listan)

Poäng: **Proffsighet**, **SV-uttal**, **Brand fit** (scan-first, butiksneutral), **Tillgänglighet (DNS-hint maj 2026)**.

| # | Domän | Kategori | DNS-hint | Kort motivering |
|---|-------|----------|----------|-----------------|
| 1 | **`skannhem.se`** | Sammansättning | NXDOMAIN | Scan-first + hem; 8 tecken; matchar produktflöde |
| 2 | **`hemlagret.se`** | Sammansättning | NXDOMAIN | “Hemmets lager” — lager som sanningskälla |
| 3 | **`laghem.se`** | Varumärke | NXDOMAIN | 6 tecken; lager+hem i ett ord |
| 4 | **`skafferio.se`** | Varumärke | NXDOMAIN | Skafferi + modernt suffix; distinkt |
| 5 | **`matlagret.se`** | Sammansättning | NXDOMAIN | Tydligt; risk: låter som logistik |
| 6 | **`hemkyl.se`** | Sammansättning | NXDOMAIN | Kort; smalt (kyl ≠ frys/skafferi) |
| 7 | **`kylhem.se`** | Sammansättning | NXDOMAIN | Kort; samma smalhet |
| 8 | **`skollo.se`** | Varumärke | NXDOMAIN | Kort; risk: skola |
| 9 | **`skannio.se`** | Varumärke | NXDOMAIN | Tech-känsla; mindre köksnärt |
| 10 | **`smartskafferi.se`** | SEO | NXDOMAIN | Tydligt men långt (13) |
| 11 | `skafferiapp.se` | SEO | NXDOMAIN | Beskrivande; svagt varumärke |
| 12 | `skaffly.se` | Varumärke | NXDOMAIN | Lekfullt — kan kännas oseriöst |
| 13 | `skafferix.se` | Varumärke | NXDOMAIN | X-suffix; startup-kliché |
| 14 | `hemscan.se` | Action | NXDOMAIN | Engelskt *scan* — bryter kriterium |
| 15 | `spillmin.se` | Action | NXDOMAIN | Matsvinn-vinkel; negativt |
| 16 | `hemlista.se` | Sammansättning | NXDOMAIN | Nära Bring/ICA-lista — smal differentiator |
| 17 | `varukoll.se` | SEO | NXDOMAIN | Nära Skafferikoll; generiskt |
| 18 | `inkopskoll.se` | SEO | NXDOMAIN | Långt; *koll*-trängsel |

**Upptagna / problem (ej i topp 18 som rekommendation):**

| Domän | Problem |
|-------|---------|
| `hemkoll.se` | `.se` NXDOMAIN men **`hemkoll.com` + App Store “Hemkoll”** = bostadsköp — varumärkesrisk |
| `matlager.se`, `matkoll.se`, `lagero.se`, `hemly.se`, `hemvaror.se` | DNS finns — sannolikt upptagna |
| `mathem.se` | Mathem — dagligvaru-e-handel |
| `skafferikoll.se` | **Direkt konkurrent** (skafferi + koll) |
| `skafferiet.se` | Catering/fest |
| `mittlager.se` | Upptagen (v1) |
| `homepantry.com` | Upptagen (parkerad) |
| `inkopslista.se` | DNS finns |

---

## 4. Topp 10 — uttal, minne, brand fit, risker

### 1. `skannhem.se` ★★★★★

| | |
|--|--|
| **Uttal** | *SKANN-hem* (två tydliga stavelser) |
| **Minne** | Koppling till huvud-CTA *Skanna* + *hemma* |
| **Brand fit** | Scan-first, butiksneutral, kyl/frys/skafferi under “hem” |
| **Risker** | Liten risk att “skann” uppfattas som endast streckkod (kvitto/foto i copy); inget nära Matdags/Pantrist |
| **Tillgänglighet** | DNS: **NXDOMAIN** (maj 2026); ingen träff i webbsök |
| **`.com`** | `skannhem.com` — **NXDOMAIN** (defensiv registrering möjlig) |

### 2. `hemlagret.se` ★★★★☆

| | |
|--|--|
| **Uttal** | *HEM-la-gret* |
| **Minne** | Tydlig bild: allt du har hemma, på ett ställe |
| **Brand fit** | Stärker “lager som sanningskälla”; proffsig B2C |
| **Risker** | Kan låta lite “ERP/lagerbolag”; 10 tecken; skiljer sig från `mittlager.se` (upptagen) |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 3. `laghem.se` ★★★★☆

| | |
|--|--|
| **Uttal** | *LAG-hem* |
| **Minne** | Kortast i listan — bra för ikon och muntlig rekommendation |
| **Brand fit** | Lager + hem utan att säga “skafferi” |
| **Risker** | Abstrakt utan tagline; `lag` kan associeras till *lägga* för vissa |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 4. `skafferio.se` ★★★★☆

| | |
|--|--|
| **Uttal** | *Skaff-EER-io* |
| **Minne** | Tydlig skafferirots + modernt |
| **Brand fit** | Kategori direkt; varmt/köksnärt |
| **Risker** | `-io` kan kännas startup; inte scan-first i själva ordet |
| **Tillgänglighet** | DNS: **NXDOMAIN**; `skafferio.com` — **NXDOMAIN** |

### 5. `matlagret.se` ★★★☆☆

| | |
|--|--|
| **Uttal** | *MAT-la-gret* |
| **Minne** | Starkt ordpar |
| **Brand fit** | Mat + lager = inventering |
| **Risker** | **Mathem**/ICA-lager i medier; kan låta som grossist |
| **Tillgänglighet** | DNS: **NXDOMAIN** (men `matlager.se` med DNS — **kolla inte förväxla**) — *obs: `matlager.se` har DNS, `matlagret.se` NXDOMAIN* |

### 6. `hemkyl.se` ★★★☆☆

| | |
|--|--|
| **Uttal** | *HEM-kyl* |
| **Minne** | Mycket kort |
| **Brand fit** | Delvis (kyl är en plats i appen) |
| **Risker** | **För smalt** — undercommunicerar skafferi, kvitto, inköpslista |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 7. `kylhem.se` ★★★☆☆

| | |
|--|--|
| **Uttal** | *KYL-hem* |
| **Minne** | Kort |
| **Brand fit** | Samma som hemkyl |
| **Risker** | Smalt; lite omvänt ordflöde |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 8. `skollo.se` ★★☆☆☆

| | |
|--|--|
| **Uttal** | *SKOL-lo* |
| **Minne** | Kort, catchy |
| **Brand fit** | Skafferi + koll i ljud — utan “koll” i stavning |
| **Risker** | **Skola**-association; mindre proffsigt för hushåll 30–55 |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 9. `skannio.se` ★★☆☆☆

| | |
|--|--|
| **Uttal** | *SKANN-io* |
| **Minne** | Tech-varumärke |
| **Brand fit** | Scan i namnet |
| **Risker** | `-io` mindre köksnärt; kallare än skannhem |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

### 10. `smartskafferi.se` ★★☆☆☆

| | |
|--|--|
| **Uttal** | *smart-SKAFF-eeri* |
| **Minne** | Beskrivande |
| **Brand fit** | SEO-vänligt |
| **Risker** | Långt; “smart” utslitet; oproffsigt som apex |
| **Tillgänglighet** | DNS: **NXDOMAIN** |

---

## 5. Tillgänglighetskontroll — toppkandidater (maj 2026)

Metod: `Resolve-DnsName` (Windows) + webbsökning. **Registrar kan visa annat.**

| Domän | DNS-hint | Webbsök / konkurrens |
|-------|----------|----------------------|
| `skannhem.se` | **NXDOMAIN** | Ingen etablerad aktör hittad |
| `skannhem.com` | **NXDOMAIN** | — |
| `hemlagret.se` | **NXDOMAIN** | Ej förväxlas med `mittlager.se` (upptagen) |
| `laghem.se` | **NXDOMAIN** | — |
| `skafferio.se` | **NXDOMAIN** | — |
| `skafferio.com` | **NXDOMAIN** | — |
| `matlagret.se` | **NXDOMAIN** | Ord nära Mathem/logistik — varumärkescopy viktig |
| `hemkoll.se` | **NXDOMAIN** | **`hemkoll.com` + app** = bostad — **undvik** |
| `skafferikoll.se` | **Upptagen / aktiv sajt** | Direkt konkurrent — **undvik *skafferi+koll*** |
| `matlager.se` | **DNS finns** | Upptagen — ej samma som `matlagret` |
| `lagero.se` | **DNS finns** | Upptagen |
| `hemly.se` | **DNS finns** | Upptagen |

*Verifiera i [Internetstiftelsens domänsök](https://internetstiftelsen.se/sok/) innan köp.*

---

## 6. Rekommendation (ny)

### Primär: **`skannhem.se`**

1. **Professionellt och svenskt** — inga lånord; två klara stavelser.
2. **Minnesvärt** — speglar tagline (*Skanna först*) och kärnflöde (streckkod, kvitto, foto).
3. **Brand fit** — butiksneutral “hem”; rymmer kyl, frys, skafferi utan att låsa till en plats.
4. **Konkurrens** — avstår från Matdags-`*dags*`, Skafferikoll-`*koll*`, Pantrist-ljud, ICA-lista-namn.
5. **Indie-budget** — en `.se` + ev. `skannhem.com` som defensiv (~200–400 kr/år).
6. **Repo** — `home-pantry` oförändrat; marknad kan säga *”Skannhem — skanna det du har hemma”* med Home Pantry som undertitel tills rebrand.

**Kommunikationsexempel:** *Skannhem punkt se* · Hero: *”Skanna hemma. Handla smart — utan att gissa.”*

### Backup 1: **`hemlagret.se`**

Välj om ni vill betona **lager/inventering** framför scan i domänen — mer “seriös hushållstjänst”, något längre i tal.

### Backup 2: **`laghem.se`**

Välj om ni prioriterar **kort varumärke** och accepterar en extra förklaringsrad i hero/App Store.

### Defensiv (valfritt)

- `skannhem.com` om ledig i registrar (DNS-hint NXDOMAIN maj 2026).
- **Registrera inte** `hemkoll.se` om ni expanderar internationellt — krock med bostads-`hemkoll.com`.

### Vad ni bör undvika (uppdaterat)

| Undvik | Varför |
|--------|--------|
| **Allt med *pantry*** | Produktägarfeedback + otydligt på SV |
| `homepantry.com` som plan | Upptagen |
| `*dags*` | Matdags |
| `skafferikoll*`, `*koll` + skafferi** | Skafferikoll.se konkurrent |
| `hemkoll*` | Bostadstjänst etablerad på `.com` |
| `mathem*`, `matlager.se` | Dagligvaru-/lager-varumärken |
| `skafferiet.se` | Catering |
| Bindestreck, `get`/`use` | Trust + uttal |
| Två aktiva apex-sajter | SEO + Turnstile/Resend-dubbel setup |

---

## 7. Beslutschecklista (ägare)

- [ ] Smaka på topp 3 i tal: **skannhem**, **hemlagret**, **laghem** (telefon-test med 2–3 användare).
- [ ] Verifiera ledighet i registrar för primär + backup.
- [ ] Köp primär `.se` (+ ev. defensiv `.com`).
- [ ] Besluta publikt produktnamn vs intern `Home Pantry` (undertitel vs rebrand).
- [ ] Koppla custom domain i Firebase ([`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md)).
- [ ] Uppdatera `PUBLIC_ORIGIN` / `ORIGIN`; Turnstile hostnames ([`CAPTCHA.md`](./CAPTCHA.md)).
- [ ] Uppdatera marknads-copy/UTM när apex står.

---

## 8. Efter köp: Firebase, miljövariabler och Turnstile

Oförändrat tekniskt flöde — se [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md), [`CAPTCHA.md`](./CAPTCHA.md), [`EMAIL.md`](./EMAIL.md). **En domän, en deploy** (`/` marknad, `/login` app).

---

## Relaterade dokument

- [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) — teknisk koppling Firebase
- [`CAPTCHA.md`](./CAPTCHA.md) — Turnstile hostnames vid domänbyte
- [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) — Matdags, Skafferikoll, SEO, GTM
- [`BRAND.md`](./BRAND.md) — ton och visuellt varumärke
- [`MARKETING_SITE.md`](./MARKETING_SITE.md) — en domän, marketing + app

---

## Historik

| Version | Innehåll |
|---------|----------|
| v1 (maj 2026) | `homepantry.se`, `hemskafferiet.se`, `hemmapantry.se` som toppval |
| **v2 (maj 2026)** | Omprövning efter SV produktägarfeedback; ny lista utan *pantry*; primär **`skannhem.se`** |
