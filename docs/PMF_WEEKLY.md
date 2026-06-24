# Veckovis PMF-rutin (ägare)

*~30 min varje måndag. Kompletterar [ROADMAP.md § Veckovis PMF-rutin](./ROADMAP.md#veckovis-pmf-rutin-ägare) och [NEXT_STEPS.md § Ägare](./NEXT_STEPS.md#ägare-nu).*

---

## Checklista (30 min)

### 1. Öppna dashboard (5 min)

1. Logga in som admin → [`/admin`](https://skaffu.com/admin).
2. **Hälsa:** användare, hushåll, lagerposter, fel senaste 7 dagar.
3. **PMF-panel:** veckosammanfattning + WoW-delta (pil upp/ner/platt per metric).
4. **Beslut-fliken** (`/admin?tab=decisions`): funnel + retention, topp-events, route-heatmaps och kohortkurvor (D1/D7/D30 per registreringsvecka när ≥30 D30-eligible).

> **Prod-lösenord:** `ADMIN_PASSWORD` i Firebase Secret Manager kan skilja sig från lokal `.env`. Uppdatera secret eller logga in via webbläsare om curl misslyckas.

### 2. Läs metrics mot mål (10 min)

| Metric | Mål | Var i `/admin` | Kommentar |
|--------|-----|----------------|-----------|
| **Aktivering (24 h)** | ≥40 % | PMF → Aktivering | 10+ varor eller kvittoparse inom 24 h |
| **Tid till första scan** | ≤3 min | PMF → Första scan | Median registrering → scan/kvitto |
| **Veckoscan-rate** | ≥30 % | PMF → Veckoscan | WAU som scannat/kvitto denna vecka |
| **D7-retention** | ≥20 % | PMF → D7 | Kräver användare registrerade ≥7 dagar |
| **D30-retention** | ≥15 % (tidigt) | PMF → D30 | **Primär PMF-gate** |
| **Kohort D7/D30** | Jämför senaste launch | Beslut → Kohort-retention | Kräver ≥30 D30-eligible; annars gate-meddelande |
| **Flera medlemmar (WAU)** | ≥50 % | PMF → Hushåll | Aktiva hushåll med ≥2 medlemmar |
| **Smart fill / vecka** | ≥20 % | PMF → Smart fill | WAU som använt AI-fill |
| **Sean Ellis** | >40 % "Mycket besviken" | PMF → Enkät | *"Hur besviken skulle du vara om Skaffu försvann?"* — ej i dashboard än; räkna manuellt från enkätsvar |

Underliggande råtal (eligible, WAU, event counts) visas i samma panel.

**Hero A/B (landning `/`):** Jämför `signup_complete / landing_view` per variant i `product_event` (metadata `variant`). Se [MARKETING_SITE.md § Measuring hero A/B conversion](./MARKETING_SITE.md#measuring-hero-ab-conversion). Utvärdera månadsvis tillsammans med PMF — välj vinnande copy när signup-rate skiljer sig tydligt vid jämförbar trafik.

### 3. WoW-mall (5 min)

Fyll i efter varje genomgång (kopiera rad per vecka):

```text
Vecka slut ___________
| Metric              | Nu    | Förra | Δ    | På mål? |
|---------------------|-------|-------|------|---------|
| Aktivering          |       |       |      |         |
| Tid första scan     |       |       |      |         |
| Veckoscan-rate      |       |       |      |         |
| D7                  |       |       |      |         |
| D30                 |       |       |      |         |
| Flera medlemmar     |       |       |      |         |
| Smart fill          |       |       |      |         |
| Sean Ellis          |       |       |      |         |

Metric under mål (välj EN): _______________________
En åtgärd denna vecka: ___________________________
Pro-waitlist (mål ≥50): _____ / 50
```

**Regel:** Välj **en** metric under mål → skriv **en** konkret åtgärd (produkt, copy eller support). Ingen feature-spridning.

### 4. Pro-waitlist + feedback (5 min)

1. [`/admin#waitlist`](https://skaffu.com/admin#waitlist) — jämför mot [PRICING.md §6](./PRICING.md) (mål ≥50).
2. [`/admin#feedback`](https://skaffu.com/admin#feedback) — nya churn-/friktionskommentarer.
3. Uppdatera [USER_INTERVIEWS.md § Syntes](./USER_INTERVIEWS.md) om ny intervju gjorts.

### 5. Logga (5 min)

Spara kort: datum, metric, åtgärd. Uppdatera **Senaste snapshot** nedan vid behov.

---

## Automation (veckomejl)

Varje **måndag 08:00 UTC** kör GitHub Actions `pmf-weekly-cron.yml` → `POST /api/cron/pmf-weekly` mot prod (samma `CRON_SECRET` som utgångspåminnelser, en timme efter expiry-cron kl 07:00).

Mejlet innehåller:

- Hälsa (användare, hushåll, lager, fel, pro-waitlist)
- Alla sju PMF-metrics vs mål + WoW-delta (samma beräkning som `/admin`)
- **En** föreslagen åtgärd (första metric under mål enligt PMF-prioritet)
- Länk till [`/admin`](https://skaffu.com/admin)

### Miljövariabler (Firebase App Hosting)

| Variabel | Syfte |
|----------|--------|
| `CRON_SECRET` | Secret — samma som expiry-cron |
| `PMF_DIGEST_TO` | Mottagare (t.ex. `owner@example.com`) |
| `RESEND_API_KEY` | Secret — redan satt |
| `RESEND_FROM` | `Skaffu <hello@skaffu.com>` — redan satt |

**Bypass:** PMF-digest använder `sendOwnerPmfDigest()` som **kringgår** `EMAIL_SENDING_DISABLED` och admin-reglaget — endast till adressen i `PMF_DIGEST_TO`. Användarinbjudningar påverkas inte.

WoW-delta beräknas live (nu vs förra veckan) — ingen separat snapshot-lagring behövs; samma logik som PMF-panelen.

### Manuell körning

```powershell
# GitHub → Actions → PMF weekly cron → Run workflow
# Eller lokalt mot prod (CRON_SECRET + PRODUCTION_URL):
curl -X POST -H "Authorization: Bearer $env:CRON_SECRET" https://skaffu.com/api/cron/pmf-weekly
```

### Första mejl

- Kräver deploy med koden + `PMF_DIGEST_TO` i Firebase.
- Första schemalagda körning: **nästa måndag 08:00 UTC** efter merge/deploy (eller kör `workflow_dispatch` direkt).

---

## CLI-snapshot (valfritt)

Om du har Cloud SQL `DATABASE_URL` i `.env` (read-only räcker):

```powershell
node --env-file=.env node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts src/lib/server/pmf-snapshot.integration.test.ts
```

Skriver JSON till stdout — samma siffror som PMF-panelen i `/admin`.

---

## Senaste snapshot (prod Cloud SQL)

*Datum: **2026-06-01** (måndag). Källa: `pmf-snapshot.integration.test.ts` mot prod `DATABASE_URL` (08:42 UTC). Smoke-testkonto raderat samma dag — siffror nedan **efter** radering. `/admin` via curl misslyckas om lokal `ADMIN_PASSWORD` ≠ Firebase secret.*

### Hälsa

| | Värde |
|---|------|
| Användare | 29 |
| Hushåll | 29 |
| Lagerposter | 6 |
| Aktiva nu | 1 |
| Fel (7 d) | 83 |
| Pro-waitlist | 0 / 50 |

### PMF vs mål (0/7 på mål)

| Metric | Nu | Mål | WoW Δ |
|--------|-----|-----|-------|
| Aktivering | 3,4 % (1/29) | 40 % | flat |
| Tid första scan | 1385 min | ≤3 min | flat |
| Veckoscan-rate | 3,6 % (1/28 WAU) | 30 % | flat |
| D7 | 0 % (0 eligible) | 20 % | flat |
| D30 | 0 % (0 eligible) | 15 % | flat |
| Flera medlemmar | 3,6 % (1/28) | 50 % | flat |
| Smart fill | 3,6 % (1/28) | 20 % | flat |

**Event counts (7 d):** scan 0 · kvitto 7 · smart fill 2

### WoW (jämfört med föregående vecka i panelen)

Alla sju metrics: **flat** (ingen föregående veckodata med förändring i `deltaDirection`). Baslinje fortfarande för tidig för D7/D30 (0 eligible).

*Intradag:* före smoke-radering var aktivering 6,7 % (2/30) — smoke-kontot var en av två aktiverade; radering sänkte aktivering till 3,4 % utan att ändra WoW-flaggan.

### Föreslagen åtgärd (vecka 2026-06-01)

**Metric:** Aktivering (3,4 % vs 40 %).

**En åtgärd:** Prioritera onboarding-friktion — kör 2 intervjuer med registrerade som inte nått 10 varor ([USER_INTERVIEWS.md](./USER_INTERVIEWS.md)); notera om kvitto vs streckkod blockerar. Publicera launch-post ([LAUNCH_POST_DRAFT.md](./LAUNCH_POST_DRAFT.md)) med UTM för att mäta nya registreringar.

---

## Beta vecka 1–4 (mjuk lansering)

Under [mjuk beta](./BETA_LAUNCH_SOFT.md) (5–15 hushåll): kör **förenklad** måndagsrutin. Full checklista ovan gäller fortfarande — detta är fokus per vecka.

| Vecka | `/admin` — läs | Ägare |
|-------|----------------|-------|
| **1** | Hälsa + fel (7 d); bekräfta prod SHA = master | Deploy + eget prod-röktest; **ingen** LinkedIn än |
| **2** | Aktivering (24 h), tid till första scan; UTM source på nya användare | LinkedIn + DM; en P0-buggfix om feedback kräver det |
| **3** | D7 (om eligible), veckoscan-rate, feedback-fliken | 2 korta intervjuer; notera i [USER_INTERVIEWS.md](./USER_INTERVIEWS.md) |
| **4** | D7/D30-kohort, alla sju PMF-metrics vs mål | Beslut: Fas 5b / community-launch / pivot — se [BETA_LAUNCH_SOFT.md § Deferred](./BETA_LAUNCH_SOFT.md#deferred-until-post-beta) |

**Beta-trösklar (indikativt):** ≥3 aktiverade hushåll; 2 intervjuer med tydlig friktion eller "skulle sakna det". Läs metrics i **PMF-panelen** och **Beslut-fliken** på [`/admin`](https://skaffu.com/admin).

---

## Relaterat

- [COMPETITIVE_ANALYSIS.md §13](./COMPETITIVE_ANALYSIS.md) — PMF-kriterier
- [DAY_90_DECISION.md](./DAY_90_DECISION.md) — beslut vid dag 90
- [ROADMAP.md](./ROADMAP.md) — fas och prioritet

*Uppdatera snapshot-sektionen varje måndag efter `/admin`-genomgång.*
