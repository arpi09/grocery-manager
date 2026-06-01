# Domänstrategi — Home Pantry (svensk marknad)

*Version: jun 2026 **v3** — primär domän **`skaffu.com`**. Utgår från `docs/BRAND.md`, `docs/COMPETITIVE_ANALYSIS.md`, `docs/MARKETING_SITE.md` och nuvarande prod på Firebase App Hosting.*

> **Status idag:** `homepantry.com` är **upptagen** (parkerings-IP). Prod kör på  
> `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app` tills en egen domän köps och kopplas ([`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md)).

> **Intern kodbas** kan fortsätta heta `home-pantry` / **Home Pantry** i UI — **publik domän behöver inte matcha** repo eller engelskt produktnamn.

> **Beslut v3 (jun 2026):** Primär publik domän **`skaffu.com`**. Registrering planeras via **Cloudflare Registrar** (`.se` stöds inte där — se [Skaffu v3](#skaffu--produktbeslut-v3-jun-2026)).

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

## Sammanfattning (v3 — gällande)

| Prioritet | Domän | Varför i ett nötskal |
|-----------|-------|----------------------|
| **1 — Primär** | **`skaffu.com`** | Kort varumärke (*skafferi* → *skaffu*), gulligt men minnesvärt, funkar SV+EN; registreras via Cloudflare. |
| **2 — Defensiv (senare)** | **`skaffu.se`** | Svensk TLD om/när ni vill — **inte** via Cloudflare Registrar (se v3). |
| **3 — Arkiv (v2)** | `skannhem.se`, `hemlagret.se`, `laghem.se` | Tidigare shortlist — ersatt som primär av Skaffu-beslutet. |

**Undvik som primär:** allt med *pantry*, `*dags*` (Matdags), generiska `skafferiet.*` (catering), `*koll*` nära **Skafferikoll** (`skafferikoll.se` — aktiv konkurrent), `hemkoll.*` (bostadstjänst på `hemkoll.com`), `mathem`/`matlager` (dagligvaru-/logistikassociation).

*Tillgänglighet = **hintar** (DNS jun 2026) — bekräfta alltid hos registrar. **`skaffu.com` / `skaffu.se`:** båda **NXDOMAIN** vid senaste kontroll.*

---

## Skaffu — produktbeslut v3 (jun 2026)

### Varför Skaffu + `.com`

| | |
|--|--|
| **Namn** | *Skaffu* — diminutiv av *skafferi*, lätt att säga (*SKAFF-oo*), “hip” på svenska och begripligt internationellt. |
| **Domän** | **`skaffu.com`** — primär apex; användaren registrerar via **Cloudflare** (en registrar, DNS + ev. CDN i samma konto). |
| **`.se` senare?** | Cloudflare **erbjuder inte** `.se`-registrering. Vill ni ha `skaffu.se` senare: **Internetstiftelsen**, **Loopia**, Porkbun m.fl. — planen **nu** är `.com` via Cloudflare. |
| **Repo / intern** | **`home-pantry`** oförändrat; Firebase-projekt och kod behöver inte byta namn. |

### DNS-hint (jun 2026)

| Domän | DNS-hint |
|-------|----------|
| `skaffu.com` | **NXDOMAIN** (`Resolve-DnsName`, jun 2026) |
| `skaffu.se` | **NXDOMAIN** (samma kontroll) |

*Bekräfta ledighet i Cloudflare Registrar innan köp — DNS-hint är inte garanti.*

### Brand och copy (exempel)

| Kontext | Exempel |
|---------|---------|
| **Uttal / URL** | *Skaffu punkt com* |
| **Hero** | *”Skaffu — skafferiet du faktiskt har koll på.”* |
| **Undertitel** | *Skanna först. Håll koll. Handla smart — utan att gissa.* (kan ligga kvar från `BRAND.md`) |
| **App Store / undertitel** | *Home Pantry* med *”av Skaffu”* eller *Skaffu — hemma i skafferiet* tills full rebrand. |
| **Kort pitch** | *Skaffu är lagret hemma: skanna, se vad som finns, få en smart inköpslista.* |

Ton: varm, köksnära, lite lekfull — balansera med tydlig nytta i hero så det inte bara känns “gulligt”.

### Risker

| Risk | Kommentar |
|------|-----------|
| **Ljudlikhet Skaffa** | [Skaffa](https://skaffa.fo) (Färöarna, matleverans) — annan marknad/TLD men liknande uttal; tydlig svensk copy och visuellt varumärke minskar förväxling. |
| **“Cute”-ton** | *Skaffu* kan upplevas mindre enterprise än t.ex. `skannhem` — kompensera med proffsig produktcopy, integritetspolicy och stabil UX. |
| **`.com` vs `.se` för SV-ICP** | Vissa användare förväntar `.se`; överväg defensiv `skaffu.se` när registrar är vald (ej Cloudflare). |

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

| TLD | Rekommendation (v3) |
|-----|---------------------|
| **`.com`** | **Primär apex** — `skaffu.com` via Cloudflare Registrar |
| **`.se`** | Defensiv / lokal trust senare — registrera hos Internetstiftelsen, Loopia m.fl. (ej Cloudflare Registrar) |
| **`.app`** | Endast redirect/skydd — inte apex för mormor-testet |

### Intern vs publikt namn

- Repo, Firebase-projekt och kod: **`home-pantry`** — oförändrat.
- Publik domän + marknads-URL: **`skaffu.com`** (varumärke *Skaffu*).
- App Store / UI: kan visa *Home Pantry* med undertitel kopplad till *Skaffu* tills full rebrand.

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

## 5. Tillgänglighetskontroll — toppkandidater (jun 2026)

Metod: `Resolve-DnsName` (Windows) + webbsökning. **Registrar kan visa annat.**

| Domän | DNS-hint | Webbsök / konkurrens |
|-------|----------|----------------------|
| **`skaffu.com`** | **NXDOMAIN** (jun 2026) | Primär v3 — verifiera i Cloudflare Registrar |
| **`skaffu.se`** | **NXDOMAIN** (jun 2026) | Defensiv `.se` — ej Cloudflare-registrering |
| `skannhem.se` | **NXDOMAIN** | Ingen etablerad aktör hittad (v2-arkiv) |
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

## 6. Rekommendation (v3 — gällande)

### Primär: **`skaffu.com`**

1. **Produktbeslut** — kort, minnesvärt varumärke (*skafferi* → *skaffu*), SV+EN-vänligt.
2. **Registrar** — köp och DNS via **Cloudflare** (plan enligt produktägare).
3. **`.se`** — Cloudflare stödjer inte `.se`; vid behov senare: Internetstiftelsen / Loopia för `skaffu.se` (DNS-hint NXDOMAIN jun 2026).
4. **Repo** — **`home-pantry`** oförändrat internt; publikt *Skaffu* på `skaffu.com`.
5. **Riskmedvetenhet** — ljudlikhet **Skaffa** (FO); håll copy tydligt svensk hushållstjänst; balansera “cute” med proffsig UX.

**Kommunikationsexempel:** *Skaffu punkt com* · Hero: *”Skaffu — skafferiet du faktiskt har koll på.”*

### Defensiv (valfritt, senare)

- **`skaffu.se`** — lokal trust; annan registrar än Cloudflare.
- **Registrera inte** `hemkoll.se` om ni expanderar internationellt — krock med bostads-`hemkoll.com`.

### Arkiv (v2 — ej primär längre)

- `skannhem.se`, `hemlagret.se`, `laghem.se` — kvar i listor ovan som research; ersatta av Skaffu-beslutet.

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

- [x] Primär domän vald: **`skaffu.com`** (jun 2026 v3).
- [ ] Verifiera `skaffu.com` ledig i **Cloudflare Registrar** (DNS-hint NXDOMAIN jun 2026).
- [ ] Registrera **`skaffu.com`** via Cloudflare; planera ev. `skaffu.se` separat (Internetstiftelsen / Loopia) om önskat.
- [ ] Smaka på *Skaffu* i tal (telefon-test); notera risk vs **Skaffa** och “cute”-ton.
- [ ] Besluta publikt *Skaffu* vs intern **Home Pantry** i UI (undertitel vs rebrand).
- [ ] Koppla custom domain i Firebase ([`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md)).
- [ ] Uppdatera `PUBLIC_ORIGIN` / `ORIGIN`; Turnstile hostnames ([`CAPTCHA.md`](./CAPTCHA.md)).
- [ ] Uppdatera marknads-copy/UTM till `skaffu.com` när apex står.

---

## 8. Efter köp: Firebase, miljövariabler och Turnstile

Oförändrat tekniskt flöde — se [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md), [`CAPTCHA.md`](./CAPTCHA.md), [`EMAIL.md`](./EMAIL.md). **En domän, en deploy** (`/` marknad, `/login` app).

---

## Relaterade dokument

- [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md) — steg-för-steg skaffu.com (Cloudflare + Firebase)
- [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) — generisk custom domain-guide (äldre homepantry-exempel)
- [`CAPTCHA.md`](./CAPTCHA.md) — Turnstile hostnames vid domänbyte
- [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) — Matdags, Skafferikoll, SEO, GTM
- [`BRAND.md`](./BRAND.md) — ton och visuellt varumärke
- [`MARKETING_SITE.md`](./MARKETING_SITE.md) — en domän, marketing + app

---

## Historik

| Version | Innehåll |
|---------|----------|
| v1 (maj 2026) | `homepantry.se`, `hemskafferiet.se`, `hemmapantry.se` som toppval |
| v2 (maj 2026) | Omprövning efter SV produktägarfeedback; ny lista utan *pantry*; primär **`skannhem.se`** |
| **v3 (jun 2026)** | Primär **`skaffu.com`** via Cloudflare; *Skaffu*-varumärke; `.se` senare via annan registrar; repo **`home-pantry`** oförändrat |
