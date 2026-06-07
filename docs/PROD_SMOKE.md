# Produktionssmoke efter deploy

Checklista för **Cursor coordinator och agenter** efter grön **Deploy to production** (G3-deploy, Firebase App Hosting). E2E och CI använder Turnstile-bypass — dessa steg verifierar **produktion** där captcha och push är skarpt konfigurerade.

**Användaren kör inte denna lista** i normal leverans; den är agents arbete. Mänsklig körning endast vid felsökning eller om coordinator ber om bekräftelse av en specifik avvikelse.

**Relaterat:** [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) · [`CAPTCHA.md`](./CAPTCHA.md) · [`VAPID_SETUP.md`](./VAPID_SETUP.md) · [`CI_CD.md`](./CI_CD.md)

---

## Deploy gates (automated)

**Deploy to production** kör automatiskt efter Firebase:

| Steg | Vad | Failar deploy? |
|------|-----|----------------|
| E2E (3 shards) | Playwright mot byggd app (PGlite) | Ja — obligatoriskt utom hotfix med `skip_e2e` + `hotfix_confirm=hotfix` |
| **Post-deploy smoke** | `curl` `/`, `/login`, `/guider` → HTTP 200 | **Ja** — även om Firebase deploy lyckades |

Skript (samma som CI): [`scripts/smoke-prod-urls.sh`](../scripts/smoke-prod-urls.sh)

```bash
BASE_URL=https://skaffu.com bash scripts/smoke-prod-urls.sh
```

Röd smoke = **rollback** eller fix-forward; säg inte "prod är live" förrän smoke **och** checklistan nedan är gröna.

---

## Agent post-deploy (mandatory for coordinator)

Kör **efter** grön **Deploy to production** för target-SHA. Räkna inte deploy som klar och säg inte "prod är live" till användaren utan lyckad deploy-run **och** denna check (eller motsvarande täckning — se nedan).

1. **SHA** — Prod kör samma commit som den gröna deploy-run (kort SHA i Actions).
2. **Inloggning** — Logga in på prod; landar på `/hem` utan fel.
3. **Scan** — `/scan`; foto-runda syns som primärt val (photo-first hub).
4. **Recept** — Receptknapp i headern; modal öppnas och kan generera.
5. **Inställningar** — `/settings`; e-postpåminnelser sparar utan fel.

**CI E2E:** För kod-deploy täcker grön deploy-workflow E2E samma kritiska resor lokalt (Turnstile-bypass). Coordinator kör ändå 5-punktslistan på prod när deploy faktiskt skett. Vid auth/push/captcha-ändringar: utökad checklista nedan. Valfritt: browser MCP mot `https://skaffu.com` vid P0 eller nyligen rapporterade prod-buggar.

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

## När köra (coordinator / agenter)

| Trigger | Agent smoke? |
|---------|----------------|
| Vanlig feature-deploy | Minst 5-punktslistan ovan |
| Auth / Turnstile-ändring | Hela checklistan inkl. `/register` |
| Push / VAPID-ändring | Settings push + `vapid-public-key` GET |
| Kvitto / OpenAI-ändring | Valfri kvitto-rad ovan |
| Endast docs/rules (ingen deploy) | Ingen prod-smoke — ingen deploy triggad |

Dokumentera avvikelser i deploy-chat eller incident-notering. **Tilldela inte** checklistan till användaren som läxa.
