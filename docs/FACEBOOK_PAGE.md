# Facebook Page — bilder och manuell setup

Skaffu har en **Facebook Page** för varumärkesnärvaro och manuella inlägg. v1: genererade bilder, dokumentation och sidfotlänk på skaffu.com. **Ingen** Facebook-kanal i admin-kö (`social_post`) ännu.

Sid-URL: `https://www.facebook.com/profile.php?id=100066978903320`  
Page ID: `100066978903320`

Se även [LINKEDIN_COMPANY_PAGE.md](./LINKEDIN_COMPANY_PAGE.md) (parallell setup) och [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md) (copy-mallar — byt `utm_source=facebook` vid manuell post).

---

## Fas 0 — Manuellt (du, ~20 min)

Gör detta i Meta Business Suite / Page Settings:

1. **Profilbild** — se [Profilbild](#profilbild) nedan  
2. **Omslagsfoto** — `static/facebook/cover-hero.png` (byt till `cover-01` … `cover-05` vid behov)  
3. **Om-text:** tredje person, ingen em-dash — se [Om-text](#om-text)  
4. **Webbplats:** `https://skaffu.com`  
5. **Första inlägg:** publicera **ett** välkomstinlägg manuellt (sidan ska inte vara tom)

**Content-policy:** ärlig beta, inga falska användarsiffror.

---

## Profilbild

Facebook visar profilbilden som en **cirkel** (176–196 px på desktop). Använd **inte** [`static/pwa/icon-512.png`](../static/pwa/icon-512.png) — svarta pixlar utanför rundade hörn ger vita fläckar.

| Krav | Värde |
|------|--------|
| Fil | `static/facebook/profile-320.png` |
| Storlek | **320 × 320 px** |
| Bakgrund | Hela ytan fylld med `#3d6b4f` (inga svarta/vita ytterhörn) |

### Generera

```bash
npm run generate:facebook-logo
# eller allt på en gång:
npm run generate:facebook
# LinkedIn + Facebook:
npm run generate:social
```

Script: [`scripts/generate-facebook-logo.mjs`](../scripts/generate-facebook-logo.mjs) — rasteriserar [`static/favicon.svg`](../static/favicon.svg) på solid grön bakgrund.

### Uppladdning

1. Facebook Page → **Inställningar** → **Profil** (eller klicka profilbilden → **Redigera**)  
2. **Ladda upp foto** → välj `static/facebook/profile-320.png`  
3. Spara och kontrollera att hörnen är helt gröna (inga vita fläckar i cirkeln)

---

## Omslagsfoto

Facebook har **ett** omslagsfoto (ingen karusell som LinkedIn). Övriga teman (`cover-01` … `cover-05`) är alternativ filer du kan byta till vid behov.

| Plats | Fil | Syfte |
|-------|-----|--------|
| **Omslagsfoto** | `static/facebook/cover-hero.png` | Primärt omslag |
| Alternativ | `cover-01-brand.png` … `cover-05-cta.png` | Byt omslag vid kampanj/tema |

Alla använder samma brand som [`static/og-skaffu.svg`](../static/og-skaffu.svg).

### Specifikation

| Krav | Värde |
|------|--------|
| Facebook desktop | **820 × 312 px** |
| Facebook mobil safe zone | **640 × 360 px** |
| Repo-export | **1640 × 720 px** (2× av 820×360) |
| Format | PNG (JPG &lt;100 KB om FB klagar på filstorlek — PNG bättre för text/logo) |

### Säker zon (text)

Profilbilden överlappar **nederst till vänster ~200 × 200 px** på visad storlek. Placera aldrig viktig text där.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              SÄKER ZON — text centrerad här                  │
│                                                              │
│ [PROFIL]                                                     │
│ overlap                                                      │
└──────────────────────────────────────────────────────────────┘
  ↑ undvik text här (nederst vänster)
```

Scriptet centrerar rubrik och undertext i mitten av canvas (640×312 safe zone).

### Generera

```bash
npm run generate:facebook-covers
# eller:
npm run generate:facebook
```

Skriver PNG till `static/facebook/`:

| # | Fil | Tema |
|---|-----|------|
| — | `cover-hero.png` | Primärt omslag |
| 1 | `cover-01-brand.png` | Varumärke |
| 2 | `cover-02-scan.png` | Kom igång |
| 3 | `cover-03-meal.png` | Maträtt |
| 4 | `cover-04-waste.png` | Matsvinn |
| 5 | `cover-05-cta.png` | CTA |

Script: [`scripts/generate-facebook-covers.mjs`](../scripts/generate-facebook-covers.mjs)

### Slide-copy (exakt text på bilderna)

| # | Huvudtext | Undertext |
|---|-----------|-----------|
| hero | **Skaffu** | Handla ihop med koll på skafferiet |
| 1 | **Skaffu** | Handla ihop med koll på skafferiet |
| 2 | **Delad lista i realtid** | Bjud in partner, checka av i butiken |
| 3 | **Koll på skafferiet** | Se vad som finns hemma innan ni handlar |
| 4 | **Se vad som går ut snart** | Mindre matsvinn hemma |
| 5 | **Kom igång gratis** | skaffu.com |

### Uppladdning

1. Facebook Page → **Redigera omslagsfoto** (eller Meta Business Suite → **Sida** → **Omslagsfoto**)  
2. Välj `static/facebook/cover-hero.png`  
3. Kontrollera mobil/desktop-förhandsvisning — ingen text under profil-overlap

---

## Delningsgrafik (inlägg / länkar)

1200×630 PNG för manuella inlägg och länkförhandsvisning i feed (samma proportioner som OG-bild).

| Fil | Tema |
|-----|------|
| `share-hero.png` | Generisk Skaffu + skaffu.com |
| `share-01-brand.png` … `share-05-cta.png` | Samma teman som omslag |

### Generera

```bash
npm run generate:facebook-share
# eller:
npm run generate:facebook
```

Script: [`scripts/generate-facebook-share.mjs`](../scripts/generate-facebook-share.mjs)

Vid manuell post: bifoga PNG som bild **eller** länka till skaffu.com (OG-bild `/og-skaffu.png` används automatiskt). Se [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md) — byt `utm_source=facebook` i UTM-länkar.

---

## Om-text

Tredje person, samma ton som LinkedIn Company Page. Ingen em-dash (—).

```
Skaffu hjälper hushåll skanna in lager, följa utgångsdatum och generera maträtt från det som redan finns hemma. Webbapp för kyl, frys och skafferi. Prova gratis på skaffu.com.
```

---

## Delad brand-modul

[`scripts/social-brand.mjs`](../scripts/social-brand.mjs) — `COLORS`, `FONT`, `PRIMARY`, `COVER_SLIDES`, `escapeXml`. [`scripts/social-fonts.mjs`](../scripts/social-fonts.mjs) bäddar in DM Sans som base64 `@font-face`; [`scripts/social-render.mjs`](../scripts/social-render.mjs) rasteriserar via **resvg** (Sharp ignorerar inbäddade typsnitt).

Efter brand- eller copy-ändringar:

```bash
npm run generate:og-image
npm run generate:social
```

---

## Sidfot på skaffu.com

Marketing-sidfoten länkar till Facebook via `footer.socialLinks` i [`src/lib/marketing/content.ts`](../src/lib/marketing/content.ts). [`MarketingFooter.svelte`](../src/lib/components/marketing/MarketingFooter.svelte) behöver ingen strukturändring.

---

## Inte i v1

- Facebook-draft i admin / `social_post.channel = 'facebook'`
- Meta API för auto-publicering
- Vanity URL (`facebook.com/Skaffu`) — uppdatera `content.ts` när du skapar den
