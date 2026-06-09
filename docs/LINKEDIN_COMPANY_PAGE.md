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
2. **Visuellt:** logotyp, banner (samma ton som `static/og-skaffu.png`)  
3. **Om-text:** tredje person (“Skaffu hjälper hushåll…”) — se [LINKEDIN_LAUNCH.md](./LINKEDIN_LAUNCH.md)  
4. **Roll:** du som **ADMINISTRATOR** eller **CONTENT_ADMIN**  
5. **Domän:** verifiera `skaffu.com` om LinkedIn erbjuder det  
6. **Första inlägg:** publicera **ett** välkomstinlägg manuellt (sidan ska inte vara tom)

**Content-policy:** ärlig beta, inga falska användarsiffror.

---

## Fas 1 — Inläggskö (implementerat)

### Admin-UI

`/admin?tab=social`:

- Lista drafts med preview (text + UTM-länk)
- Redigera body/länk innan godkännande
- **Godkänn** → status `approved`
- **Kopiera till LinkedIn** — urklipp + toast (fallback tills API är godkänt)
- **Publicera** — när LinkedIn OAuth är kopplad (Fas 2)
- Filter: draft / godkänt / publicerat / misslyckat

Första gången kön är tom seedas ett utkast från [LINKEDIN_REPOST.md](./LINKEDIN_REPOST.md).

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
