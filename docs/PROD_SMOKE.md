# Produktionssmoke efter deploy

Manuell checklista efter G3-deploy (Firebase App Hosting). E2E och CI använder Turnstile-bypass — dessa steg verifierar **produktion** där captcha och push är skarpt konfigurerade.

**Relaterat:** [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) · [`CAPTCHA.md`](./CAPTCHA.md) · [`VAPID_SETUP.md`](./VAPID_SETUP.md) · [`CI_CD.md`](./CI_CD.md)

---

## Checklista (5–8 min)

- [ ] **Admin-login** — logga in med admin-konto; landar på `/hem` utan 500
- [ ] **Marketing `/`** — landningssida laddar (200, inget serverfel)
- [ ] **`/register` + Turnstile** — registreringssida visar widget; lyckad registrering landar på `/hem` (ingen bypass)
- [ ] **`/login`** — inloggningssida svarar 200; befintlig användare kan logga in
- [ ] **Settings → push** — `/settings` visar push-sektion; aktivering begär browser-tillstånd (eller tydligt fel om blockerat)
- [ ] **`GET /api/push/vapid-public-key`** — returnerar `{ ok: true, publicKey: "..." }` (503 om VAPID saknas i Firebase secrets)
- [ ] **Kvitto-uppladdning (valfritt)** — ladda upp en enkel PDF/bild på `/receipt`; parse returnerar rader eller tydligt användarfel (kräver `OPENAI_API_KEY` i prod)
- [ ] **PWA / service worker** — appen laddar efter hård refresh; ingen evig spinner på `/hem`

---

## Snabb curl (VAPID)

Ersätt `BASE` med prod-URL (samma som `PUBLIC_ORIGIN`, utan avslutande `/`).

**Prod (default):** `https://skaffu.com`  
**Legacy hosted.app:** `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app` — se [`SKAFFU_DOMAIN_MIGRATION.md`](./SKAFFU_DOMAIN_MIGRATION.md).

```bash
BASE=https://skaffu.com
```

```bash
curl -sS "$BASE/api/push/vapid-public-key"
```

Förväntat: HTTP 200 och JSON med `publicKey` när VAPID är konfigurerat.

---

## När köra

| Trigger | Kör smoke? |
|---------|------------|
| Vanlig feature-deploy | Minst admin-login + `/` |
| Auth / Turnstile-ändring | Hela checklistan inkl. `/register` |
| Push / VAPID-ändring | Settings push + `vapid-public-key` GET |
| Kvitto / OpenAI-ändring | Valfri kvitto-rad ovan |

Dokumentera avvikelser i deploy-chat eller incident-notering.
