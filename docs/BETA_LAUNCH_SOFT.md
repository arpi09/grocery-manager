# Mjuk beta — lansering till nätverk

Operativt kit för **5–15 betrodda hushåll** innan community-launch. Posta först när **prod har samma SHA som master** (pantry sync live) — annars tappar testare förtroende.

**Komplettera med:** [`PMF_WEEKLY.md`](./PMF_WEEKLY.md), [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md), metrics på [`/admin`](https://skaffu.com/admin).

---

## Ram

- **Sidoprojekt:** "Privat sidoprojekt på fritiden, orelaterat till jobbet." Inga jämförelser med arbetsgivaren.
- **Timing:** LinkedIn + DM **efter** grön deploy och eget 30-min prod-röktest.
- **Betalning:** Gratis att testa. Nämn inte Pro/pris om ingen frågar — "betalning kommer senare" räcker.

---

## LinkedIn (utkast)

> Jag har ett litet sidoprojekt vid sidan av jobbet: **Skaffu** (skaffu.com) — hålla koll på mat hemma, planera kring det som går ut, minska onödigt svinn. Nu i **beta**, gratis att testa. Helt oberoende av mitt arbete. Ärlig feedback uppskattas — vad som känns begripligt och vad som strular.

**Utelämna:** Pro/pris, "revolutionerande", aggressiv growth, datum som krockar med sjukperiod.

**Länk (valfritt UTM):** `https://skaffu.com/?utm_source=linkedin&utm_medium=dm&utm_campaign=soft_beta_w24`

---

## DM-mall (5–15 personer du litar på)

> Hej [namn]! Jag har pillat på ett litet sidoprojekt på kvällarna — **Skaffu** (skaffu.com), en svensk webbapp för att hålla koll på mat hemma (kyl/frys/skafferi, utgång, delad inköpslista).
>
> Jag är i **tidig beta** och söker 5–15 hushåll som vill prova i 1–2 veckor och säga vad som känns krångligt. Helt gratis, inget att sälja — bara ärlig feedback.
>
> Bästa start: skanna några streckkoder **eller** ladda upp ett kvitto. Funkar i telefonens webbläsare; kan läggas på hemskärmen efter inloggning.
>
> [https://skaffu.com](https://skaffu.com)
>
> Om du har 15 min senare i veckan vore ett kort samtal guld värt. Tack!

Anpassa ton per relation. Personliga inbjudningar > bred post.

---

## Vad be dem prova

| Flöde | Var | Vad du vill veta |
|-------|-----|------------------|
| **Hem / skafferistatus** | `/hem` | Förstår de vad som går ut? Känns swipe (Slut/Delvis) naturligt? |
| **Scan** | `/scan` | Streckkod eller foto — når de 5–10 varor utan att ge upp? |
| **Synk** | `/inventory/synk` | Delat hushåll — ser de samma lager? Staleness-badge begriplig? |
| **Inköp** | Inköpslista | Smart fill + avbockning → flytt till skafferi (bridge) — funkar det? |

**Aktiveringsmål:** ≥3 hushåll når 10 varor eller 1 kvitto inom 24 h (samma definition som `/admin` PMF).

**Feedback:** Inställningar → *Ge feedback*, eller svara i DM.

---

## Vad INTE lova eller nämna

| Feature | Status | Säg istället |
|---------|--------|--------------|
| **Batch-bridge** (3 avbockningar → skafferi) | Planerad Fas 5b, ej byggd | "Du kan flytta varor manuellt efter avbockning" |
| **Coach marks** (swipe/bridge/synk) | Ej byggda | — |
| **Veckovis staleness push** (Fas 5e) | Ej byggd | — |
| **Aktivitetsfeed med visningsnamn** | Delvis | — |
| **Native app / App Store** | Ej nu | "Webbapp, lägg på hemskärmen" |
| **Pro / Stripe** | Testläge | "Gratis i beta" |

---

## 4-veckors sekvens

| Vecka | Du | Teknik |
|-------|-----|--------|
| **1** | Vänta med LinkedIn tills deploy lyckats; röktesta prod själv | P0 ship |
| **2** | LinkedIn-post + DM till 5–15 | Fixa P0-buggar; läs `/admin` PMF |
| **3** | 2–3 korta samtal ([USER_INTERVIEWS.md](./USER_INTERVIEWS.md)) | Liten fix-release om nödvändigt |
| **4** | PMF-granskning ([PMF_WEEKLY.md](./PMF_WEEKLY.md)) | Beslut: community-launch eller pivot — **inte** före D7-signal |

---

## Framgångsmått (mjuk beta)

| Mål | Tröskel |
|-----|---------|
| Beta-kohort | 5–15 aktiva hushåll |
| Aktivering | ≥3 når 10 varor eller 1 kvitto inom 24 h |
| Kvalitativt | 2 intervjuer med "skulle sakna det" / "förvirrande X" |
| **Ej mål** | Downloads, revenue, viral community-spread |

---

## Deferred until post-beta

Skjut tills beta-kohorten (2 veckor) gett friktions- och retention-signal i [`/admin`](https://skaffu.com/admin):

| Item | Varför vänta |
|------|--------------|
| **Fas 5b batch-bridge** | Största återstående friktion inköp→skafferi — bygg när beta bekräftar behovet |
| **Stripe live / Pro** | [PRICING.md](./PRICING.md) — gates ej uppfyllda; håll testläge under beta |
| **Community-launch** | [LAUNCH_PLAYBOOK.md](./LAUNCH_PLAYBOOK.md) — Facebook/Reddit kräver stabil prod + tid att svara i trådar |

---

## Relaterat

| Dokument | Innehåll |
|----------|----------|
| [`PMF_WEEKLY.md`](./PMF_WEEKLY.md) | Veckovis `/admin`-rutin + beta vecka 1–4 |
| [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) | Community-launch (efter mjuk beta) |
| [`USER_INTERVIEWS.md`](./USER_INTERVIEWS.md) | Intervjukit |
| [`BRAND.md`](./BRAND.md) | Ton i copy |

*Kit jun 2026. Postning och syntes körs av produktägare.*
