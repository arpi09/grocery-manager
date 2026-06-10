# LinkedIn / Facebook repost — growth kit

Kort copy för **uppföljningspost** efter första LinkedIn-försöket. Beta-honest copy utan att lova rapportdata; kommentar med “fota kylen”-tip.

**Mät:** [`/admin`](https://skaffu.com/admin) → UTM source `linkedin`, kampanj `growth_repost`. Vänta **48–72 h** innan nästa kanal.

**Länkval:** Länka till Skaffurapport (`/rapport/YYYY-MM`) **endast** när admin visar ≥10 hushåll i kohorten (k-anonymitet). Annars: senaste publicerade guide (`/guider/{slug}`) eller landning (`skaffu.com` + `utm_content=photo_tip`). Seed-draft och admin-kön använder `src/lib/marketing/linkedin-draft-defaults.ts`.

**Kampanj (guide + LinkedIn):** Admin → flik *Social* → *Generera artikel + LinkedIn-inlägg* skapar ett par (DB `guide_article` + `social_post`) med länk `https://skaffu.com/guider/{slug}?utm_source=linkedin&utm_medium=social&utm_campaign=guide_link&utm_content={slug}`. Godkänn båda → publicera artikel på webben → publicera LinkedIn. Se `docs/MARKETING_SITE.md`.

---

## UTM-länkar

| Syfte | URL |
|-------|-----|
| **Primär post (rapport redo)** | `https://skaffu.com/rapport/{föregående-månad}?utm_source=linkedin&utm_medium=social&utm_campaign=growth_repost&utm_content=post_a` |
| **Primär post (guide)** | `https://skaffu.com/guider/{slug}?utm_source=linkedin&utm_medium=social&utm_campaign=growth_repost&utm_content={slug}` |
| **Landning + fotorunda (kommentar)** | `https://skaffu.com/?utm_source=linkedin&utm_medium=social&utm_campaign=growth_repost&utm_content=photo_tip` |

Byt `{föregående-månad}` till föregående kalendermånad (t.ex. `2026-05` i juni 2026) **när** rapporten uppfyller k-anonymitet.

---

## LinkedIn — kopiera & klistra in

### Brödtext (seed i admin-kön)

> Svenska hushåll kastar mat för miljarder varje år. Ofta för att vi glömmer vad som redan finns i kylen.
>
> Skaffu hjälper hushåll skanna in lager, följa utgångsdatum och generera maträtt från det du har hemma.
>
> Prova gratis på skaffu.com. Fota kylen eller skanna streckkod.
>
> {länk enligt smart resolver — se admin → LinkedIn-kö}

### Första kommentar

> **Snabbstart:** Ett kvitto *eller* fota kylen / frys / skafferi — du behöver inte mata in allt manuellt dag ett.  
> https://skaffu.com/?utm_source=linkedin&utm_medium=social&utm_campaign=growth_repost&utm_content=photo_tip

---

## Facebook (valfritt, samma vecka)

Samma brödtext fungerar i SV matsvinn-grupper — byt `utm_source=linkedin` till `utm_source=facebook` och `utm_campaign=growth_repost` om du postar där istället.

---

## Checklista efter post

| Fält | Värde |
|------|-------|
| Postad | |
| Kanal | LinkedIn / FB |
| Klick (admin) | |
| Registreringar 48 h | |
| Nästa steg | Justera krok eller testa Wrapped-länk |
