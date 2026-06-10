# LinkedIn Company Page + godkännande-kö

Skaffu publicerar godkända inlägg till **LinkedIn Company Page** via admin-kö i `/admin` → **LinkedIn-kö**. Agenter skapar **drafts** via API; du granskar, godkänner och publicerar (API eller manuell kopia).

Se även [LINKEDIN_LAUNCH.md](./LINKEDIN_LAUNCH.md) (personlig profil) och [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md) (copy-mallar).

---

## Fas 0 — Manuellt (du, ~30 min)

Gör detta i LinkedIn UI innan API-koppling:

1. **Skapa företagssida:** LinkedIn → Företag → Skapa företagssida  
   - Namn: **Skaffu**  
   - Webb: `https://skaffu.com`  
   - Bransch: mjukvara / consumer app  
   - Storlek: 1–10  
2. **Visuellt:** logotyp + huvudomslag + omslagsbildspel (se [Logotyp](#logotyp) och [Omslagsbilder](#omslagsbilder) nedan)  
3. **Om-text:** tredje person (“Skaffu hjälper hushåll…”) — se [LINKEDIN_LAUNCH.md](./LINKEDIN_LAUNCH.md)  
4. **Roll:** du som **ADMINISTRATOR** eller **CONTENT_ADMIN**  
5. **Domän:** verifiera `skaffu.com` om LinkedIn erbjuder det  
6. **Första inlägg:** publicera **ett** välkomstinlägg manuellt (sidan ska inte vara tom)

**Content-policy:** ärlig beta, inga falska användarsiffror.

---

## Logotyp

LinkedIn kräver en **kvadratisk** logotyp (minst 300 × 300 px). Använd **inte** [`static/pwa/icon-512.png`](../static/pwa/icon-512.png) — den har svarta pixlar utanför de rundade hörnen och ger vita/konstiga hörn i LinkedIn.

| Krav | Värde |
|------|--------|
| Fil | `static/linkedin/logo-300.png` |
| Storlek | **300 × 300 px** |
| Bakgrund | Hela ytan fylld med `#3d6b4f` (inga svarta/vita ytterhörn) |

### Generera

```bash
npm run generate:linkedin-logo
# eller allt på en gång:
npm run generate:linkedin
```

Script: [`scripts/generate-linkedin-logo.mjs`](../scripts/generate-linkedin-logo.mjs) — rasteriserar [`static/favicon.svg`](../static/favicon.svg) på solid grön bakgrund.

### Uppladdning i LinkedIn

1. Företagssida → **Admin** → **Sidan** (eller **Redigera sida**)
2. Klicka på logotypen → **Ladda upp från datorn**
3. Välj `static/linkedin/logo-300.png` — **inte** PWA-ikonen
4. Spara och kontrollera att hörnen är helt gröna (inga vita fläckar)

---

## Omslagsbilder

LinkedIn har **två** uppladdningsställen på företagssidan:

| Plats | Fil | Syfte |
|-------|-----|--------|
| **Huvudomslag** (statisk banner bakom logotypen) | `static/linkedin/cover-hero.png` | Alltid synlig — varumärkesbild |
| **Omslagsbildspel** (roterande karusell) | `cover-01-brand.png` … `cover-05-cta.png` | 3–5 slides som roterar |

Alla använder samma brand som [`static/og-skaffu.svg`](../static/og-skaffu.svg).

### Specifikation

| Krav | Värde |
|------|--------|
| LinkedIn minimum | **1128 × 191 px** (aspekt ~5,9:1) |
| Repo-export | **2256 × 382 px** (2×) — skarpare efter LinkedIns nedskalning/beskärning |
| Format | PNG |
| Max fil | 3 MB per bild |

**Varför 2× och inte 1584×396?** LinkedIn anger 1128×191 för företagsomslag (bred banner). 1584×396 är ett annat aspektförhållande (~4:1) som beskärs annorlunda. Vi håller samma proportioner och dubblar upplösningen.

### Säker zon (text)

Profil-logotypen överlappar **vänster ~220 px** på visad storlek. Placera aldrig viktig text där.

```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO]  │        SÄKER ZON — text centrerad här              │
│ overlap │                                                    │
│ ~220px  │              skaffu.com-pill                       │
└──────────────────────────────────────────────────────────────┘
  ↑ undvik text här
```

Scriptet centrerar rubrik och undertext i zonen till höger om logotypen.

### Generera i repot (primär)

```bash
npm run generate:linkedin-covers
# eller:
npm run generate:linkedin
```

Skriver PNG till `static/linkedin/`:

| # | Fil | Tema | Uppladdning |
|---|-----|------|-------------|
| — | `static/linkedin/cover-hero.png` | Huvudomslag | **Huvudomslag** |
| 1 | `static/linkedin/cover-01-brand.png` | Varumärke | Bildspel |
| 2 | `static/linkedin/cover-02-scan.png` | Kom igång | Bildspel |
| 3 | `static/linkedin/cover-03-meal.png` | Maträtt | Bildspel |
| 4 | `static/linkedin/cover-04-waste.png` | Matsvinn | Bildspel |
| 5 | `static/linkedin/cover-05-cta.png` | CTA | Bildspel |

Script: [`scripts/generate-linkedin-covers.mjs`](../scripts/generate-linkedin-covers.mjs)

### Slide-copy (exakt text på bilderna)

| # | Huvudtext | Undertext |
|---|-----------|-----------|
| hero | **Skaffu** | Skafferiet du har koll på |
| 1 | **Skaffu** | Skafferiet du har koll på |
| 2 | **Skanna det du har hemma** | Streckkod, kvitto eller foto |
| 3 | **Maträtt på knapptryck** | Recept från ditt lager |
| 4 | **Ät det som går ut** | Mindre matsvinn |
| 5 | **Gratis att prova** | skaffu.com |

Design: ljus gradient (`#f7f5f0` → `#e8f0ea`), primär `#3d6b4f`, text centrerad i säker zon. `skaffu.com`-pill på hero, slide 1 och 5. Ingen vänster accent-stripe (undviker kantartefakter).

### Uppladdning i LinkedIn

**Huvudomslag**

1. Företagssida → **Admin** → **Sidan** → redigera **omslagsbild** (bannern)
2. Ladda upp `static/linkedin/cover-hero.png`
3. Spara — kontrollera att "Skaffu" och `skaffu.com` syns (inte bakom logotypen)

**Omslagsbildspel**

1. Företagssida → **Admin** → **Omslagsbilder** (karusell)
2. **Ladda upp från datorn** → `cover-01-brand.png` … `cover-05-cta.png` i ordning
3. **Spara**
4. Kontrollera på mobil och desktop: text ska vara läsbar, inte suddig eller avklippt

**Organisations-ID:** URL:en `linkedin.com/company/127803966/…` ger numeriskt id **127803966**. Sätt i env när API kopplas:

```env
LINKEDIN_ORGANIZATION_ID=127803966
```

### Canva-mall (backup)

Om du vill finjustera visuellt i stället för repo-scriptet:

1. Canva → **Custom size 1128 × 191 px**
2. Bakgrund: gradient `#f7f5f0` → `#e8f0ea`
3. Accent: `#3d6b4f` för rubrik eller liten knapp-pill
4. Logotyp: exportera från [`static/linkedin/logo-300.png`](../static/linkedin/logo-300.png) (eller kör `npm run generate:linkedin-logo`)
5. Duplicera slide 5 gånger, byt text enligt slide-copy-tabellen
6. Exportera PNG (max kvalitet, under 3 MB per fil)

Huvudrad: håll under ~35 tecken för läsbarhet på mobil.

---

## Innehållstyper — guider vs rapport vs kö

| Innehåll | URL | Hur det skapas | Syns på `/`? |
|----------|-----|----------------|-------------|
| **SEO-guider** | `/guider/[slug]` | GitHub Actions `guides-generate-cron.yml` → **PR** med ny `.md` | Ja, upp till 3 kort ("Senaste guider") |
| **Skaffurapport** | `/rapport/YYYY-MM` | Månadscron + aggregering från förbrukningsdata | Nej (egen sida) |
| **LinkedIn-kö** | `/admin?tab=social` | Seed vid första tom kö; agenter via API | Inlägg, inte hemsida |

Guider autogenereras **inte** direkt på prod — merga PR för att synas. LinkedIn-länkar till rapport **endast** när kohorten uppfyller k-anonymitet (≥10 hushåll); annars landning eller senaste guide (`src/lib/marketing/linkedin-draft-defaults.ts`).

---

## Fas 1 — Inläggskö (implementerat)

### Admin-UI

`/admin?tab=social`:

- Lista drafts med preview (text + UTM-länk)
- Varning om länk pekar på rapport utan k-anonymitet
- **Föreslå bättre länk** — uppdaterar draft till landning, guide eller rapport (om redo)
- Redigera body/länk innan godkännande
- **Godkänn** → status `approved`
- **Kopiera till LinkedIn** — urklipp + toast (fallback tills API är godkänt)
- **Publicera** — när LinkedIn OAuth är kopplad (Fas 2)
- Filter: draft / godkänt / publicerat / misslyckat

Första gången kön är tom seedas ett utkast från [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md) med smart standardlänk. Befintliga seed-drafts med hårdkodad `rapport/2026-06` eller gammal copy repareras vid admin-besök (`tab=social`).

### Agent-API

`POST /api/admin/social-posts` (kräver inloggad **admin**-session):

```json
{
  "body": "Inläggstext (obligatorisk)",
  "linkUrl": "https://skaffu.com/rapport/2026-06",
  "utmSource": "linkedin",
  "utmMedium": "social",
  "utmCampaign": "growth_repost",
  "utmContent": "post_a",
  "title": "Internt namn (valfritt)",
  "source": "agent"
}
```

Svar `201`:

```json
{
  "id": "…",
  "status": "draft",
  "builtLinkUrl": "https://skaffu.com/rapport/2026-06?utm_source=linkedin&…"
}
```

Lista: `GET /api/admin/social-posts?status=draft&limit=20`

**Cursor-agenter:** använd admin-cookie/session eller kör från samma miljö som dev-servern. Publicera **aldrig** utan godkännande — servern tillåter publish endast för `approved`.

### Markdown → kö (valfritt)

```bash
node scripts/sync-linkedin-queue.mjs docs/LINKEDIN_REPOST.md
```

Kräver `ADMIN_SESSION_COOKIE` eller kör manuellt via API med curl + session.

---

## Fas 2 — LinkedIn Developer + OAuth

1. [LinkedIn Developer Portal](https://www.linkedin.com/developers/) → app **Skaffu**  
2. Produkter: Sign In + Share / Community Management  
3. **Ansök** scope `w_organization_social`  
4. Redirect URI: `https://skaffu.com/api/linkedin/callback` (+ localhost för dev)  
5. Env (se `.env.example`):

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ORGANIZATION_ID=    # numeriskt → urn:li:organization:{id}
```

6. I admin: **Koppla LinkedIn** → OAuth en gång → `refresh_token` i `app_settings` (`linkedin_oauth`)  
7. **Publicera** på godkänt inlägg → `POST /rest/posts` → `published` + `externalId`

Om API-granskning dröjer: använd **Kopiera till LinkedIn** i 2–4 veckor.

---

## Fas 3 — Cursor automation (minimal)

Veckovis automation (ej auto-publish):

1. Läs PMF/admin-stats  
2. `POST /api/admin/social-posts` med `source: "automation"`  
3. Du godkänner i `/admin` → publicera eller kopiera

---

## Statusflöde

```
draft → approved → published
              ↘ failed (API-fel, kan godkännas igen)
```

---

## Felsökning

| Symptom | Åtgärd |
|--------|--------|
| Publicera-knapp saknas | Koppla LinkedIn + sätt env-variabler |
| `w_organization_social` saknas | Vänta på LinkedIn-granskning; använd kopiera-fallback |
| Publish failed i admin | Se `publishError` på raden; kontrollera org-ID och token |
| Vita/svarta hörn på logotyp | Använd `logo-300.png`, inte `icon-512.png`; kör `npm run generate:linkedin-logo` |
| Suddig/avklippt omslagstext | Ladda upp 2×-PNG från `npm run generate:linkedin-covers`; text är centrerad utanför logotyp-zon |
