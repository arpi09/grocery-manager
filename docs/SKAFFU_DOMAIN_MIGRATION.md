# skaffu.com — domänmigration (Firebase App Hosting)

Steg-för-steg för produktägaren: köp **skaffu.com** via Cloudflare, koppla till Firebase App Hosting, uppdatera miljövariabler och Turnstile. Repo och Firebase-projekt heter fortfarande **`home-pantry`** internt — publik URL blir **`https://skaffu.com`**.

> **Status idag:** Prod kör på `https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app`. **Sätt inte `PUBLIC_ORIGIN` till skaffu.com i `apphosting.yaml` förrän DNS + SSL är Connected** — annars blir canonical-länkar, mejl och CSRF fel.

Relaterat: [`DOMAIN_STRATEGY.md`](./DOMAIN_STRATEGY.md) · [`CUSTOM_DOMAIN.md`](./CUSTOM_DOMAIN.md) · [`CAPTCHA.md`](./CAPTCHA.md) · [`EMAIL.md`](./EMAIL.md) · [`PROD_SMOKE.md`](./PROD_SMOKE.md)

---

## Översikt (ordning)

| Steg | Var | När |
|------|-----|-----|
| 1 | Cloudflare Registrar | Köp `skaffu.com` |
| 2 | Firebase Console | Lägg till custom domain → få DNS-poster |
| 3 | Cloudflare DNS | Lägg in A / TXT / CNAME enligt Firebase |
| 4 | Vänta | Verifiering + SSL (15 min – några timmar) |
| 5 | Firebase env | `PUBLIC_ORIGIN` + `ORIGIN` → `https://skaffu.com`, redeploy |
| 6 | Cloudflare Turnstile | Lägg till `skaffu.com` (+ ev. `www`) som hostname |
| 7 | Resend (valfritt) | Verifiera avsändardomän för mejl |
| 8 | Smoke test | [`PROD_SMOKE.md`](./PROD_SMOKE.md) på `https://skaffu.com` |

---

## 1. Köp skaffu.com i Cloudflare

1. Logga in på [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. I vänstermenyn: **Domain Registration** → **Register Domains** (eller **Registrar** → **Register**).
3. Sök **`skaffu.com`** → bekräfta ledighet → **Purchase** / **Köp**.
4. Slutför betalning och vänta tills domänen syns under **Websites** / **Domains** med status **Active**.
5. DNS hanteras automatiskt i samma Cloudflare-konto (rekommenderat — inga nameserver-byten behövs om du köper här).

**Tips:** Behåll `*.hosted.app`-URL:en tills skaffu.com är **Connected** — då kan du testa prod under hela övergången.

---

## 2. Firebase Console — lägg till custom domain

1. Öppna [Firebase Console](https://console.firebase.google.com/) → projekt **`home-pantry-4bee5`**.
2. Vänstermenyn: **Build** → **App Hosting**.
3. Välj backend **`home-pantry`**.
4. Fliken **Settings** (eller **Custom domains** / **Domains** — UI-variant).
5. Klicka **Add custom domain** / **Lägg till anpassad domän**.
6. Ange **`skaffu.com`** → **Continue** / **Fortsätt**.
7. Firebase visar **exakta DNS-poster** (kopiera dem — värden är projektspecifika, gissa inte).

Typiska posttyper (exakt host + värde kommer från konsolen):

| Typ | Host / namn | Syfte |
|-----|-------------|--------|
| **A** | `@` (apex) | Pekar apex mot Firebase App Hosting IPv4 |
| **TXT** | `@` | Domänverifiering (ägarskap) |
| **CNAME** | `_acme-challenge…` | SSL (ACME) — **behåll efter setup** |
| **CNAME** | `www` | Subdomän → Firebase (eller A om konsolen visar A för www) |

8. Lägg till **`www.skaffu.com`** som separat post:
   - Välj **Redirect to existing website** / **Omdirigera till befintlig webbplats** och peka på **`skaffu.com`** om Firebase erbjuder det (rekommenderat för SEO).
   - Annars: lägg till som egen domän på samma backend (båda fungerar; canonical styrs av `PUBLIC_ORIGIN`).

9. Låt Firebase-sidan vara öppen — du behöver posterna i steg 3.

Officiell referens: [Connect a custom domain (App Hosting)](https://firebase.google.com/docs/app-hosting/custom-domain).

---

## 3. Cloudflare DNS — lägg in Firebase-poster

1. Cloudflare Dashboard → välj **`skaffu.com`**.
2. **DNS** → **Records** → **Add record**.
3. För **varje** post Firebase visade:
   - Välj **Type** (A, TXT, CNAME).
   - **Name:** `@` för apex, eller `www`, eller exakt `_acme-challenge…` som Firebase anger.
   - **Content / Target:** klistra in värdet från Firebase **exakt**.
   - **Proxy status:** sätt till **DNS only** (grått moln) för poster Firebase anger för custom domain / SSL — proxied orange moln kan störa verifiering och certifikat. Om Firebase docs säger annat för en specifik post, följ Firebase.
   - **Save**.
4. Ta bort **konfliktande** poster på apex (`@`):
   - Gamla A/CNAME som pekar på parkering eller annan host.
   - **AAAA** på apex om Firebase ber om det — App Hosting använder dem inte och de kan blockera SSL.
5. Upprepa för `www` och `_acme-challenge`-CNAME.

**Kontroll:** [Google Admin Toolbox Dig](https://toolbox.googleapps.com/apps/dig/) eller `dig skaffu.com` — poster ska matcha Firebase.

---

## 4. Verifiering och SSL

1. Tillbaka i Firebase → **App Hosting** → **home-pantry** → **Custom domains**.
2. Status går typiskt: **Needs setup** → **Pending** → **Connected**.
3. Propagering: minuter upp till 48 timmar (Cloudflare + Firebase).
4. När status är **Connected** med giltigt certifikat (hänglås i webbläsaren på `https://skaffu.com`):
   - Testa `https://skaffu.com/` — ska ladda appen (kan fortfarande visa fel canonical tills steg 5).
   - Testa `https://www.skaffu.com/` — ska redirecta till apex eller ladda samma sajt.
5. **Rör inte** `_acme-challenge`-CNAME — förnyelse av certifikat kräver den.

---

## 5. Efter domänen är live — miljövariabler

**Först när SSL fungerar** — uppdatera canonical origin så mejl, SEO och CSRF matchar webbläsarens URL.

### Alternativ A: Firebase Console (snabbast)

1. Firebase → **App Hosting** → **home-pantry** → **Environment** (eller **Settings → Environment variables**).
2. Sätt (BUILD + RUNTIME där det gäller):

   | Variabel | Värde |
   |----------|--------|
   | `PUBLIC_ORIGIN` | `https://skaffu.com` |
   | `ORIGIN` | `https://skaffu.com` |

3. **Save** → trigga **ny deploy** (push till `main` eller `npm run deploy:firebase`).

### Alternativ B: `apphosting.yaml` i repo

Uppdatera värdena (behåll hosted.app tills steg 4 är klart):

```yaml
- variable: PUBLIC_ORIGIN
  value: https://skaffu.com
  availability:
    - BUILD
    - RUNTIME

- variable: ORIGIN
  value: https://skaffu.com
  availability:
    - RUNTIME
```

Commit + deploy.

**Lämna `PUBLIC_APP_URL` oinställd** — marknad och app delar samma domän (`/` + `/login`).

**GitHub Actions (valfritt):** uppdatera repository variable **`PRODUCTION_URL`** till `https://skaffu.com` (cron/smoke) — se [`CI_CD.md`](./CI_CD.md).

---

## 6. Cloudflare Turnstile (registrering `/register`)

Gör **efter** `https://skaffu.com` löser i DNS (widget validerar exakt hostname).

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile**.
2. Öppna widgeten som matchar `PUBLIC_TURNSTILE_SITE_KEY` i prod.
3. **Settings** → **Hostname Management** → **Add Hostnames**.
4. Lägg till:
   - `skaffu.com`
   - `www.skaffu.com` (om www fortfarande kan nå `/register`)
5. **Save** — vänta ~1 minut.
6. **Behåll** befintliga hostnames (`localhost`, `home-pantry--home-pantry-4bee5.europe-west4.hosted.app`) under övergången tills du stänger hosted.app-trafik.

Ingen ny site key behövs om samma widget används — se [`CAPTCHA.md`](./CAPTCHA.md).

Test: inkognito → `https://skaffu.com/register` — widget ska ladda utan fel **110200**.

---

## 7. Resend (valfritt, efter domän)

Mejl skickas idag från `onboarding@resend.dev` (`EMAIL_SENDING_DISABLED=true` i prod).

När du vill skicka från t.ex. `hello@skaffu.com`:

1. [Resend Dashboard](https://resend.com/domains) → **Add Domain** → `skaffu.com`.
2. Lägg Resend-DNS-poster i Cloudflare (TXT/CNAME enligt Resend).
3. Verifiera domän → uppdatera `RESEND_FROM` och sätt `EMAIL_SENDING_DISABLED=false`.
4. Se [`EMAIL.md`](./EMAIL.md).

---

## 8. Post-cutover — verifieringschecklista

- [ ] `https://skaffu.com/` — landningssida, giltigt SSL
- [ ] `https://www.skaffu.com/` — redirect till apex (eller samma sajt)
- [ ] `https://skaffu.com/login` — inloggning, session kvar efter login
- [ ] `https://skaffu.com/register` — Turnstile OK, registrering → `/hem`
- [ ] Formulär POST — inga CSRF 403 (bekräftar `ORIGIN`)
- [ ] View source `/` — `canonical` och `og:url` = `https://skaffu.com`
- [ ] Hushållsinbjudan — länk `https://skaffu.com/invite/…` (inte `*.hosted.app`)
- [ ] [`PROD_SMOKE.md`](./PROD_SMOKE.md) med `BASE=https://skaffu.com`
- [ ] (Valfritt) gammal `*.hosted.app` fungerar fortfarande under övergång

---

## Rollback vid problem

| Problem | Åtgärd |
|---------|--------|
| skaffu.com nere, hosted.app fungerar | Fortsätt peka användare till hosted.app; **ändra inte** `PUBLIC_ORIGIN` till skaffu.com förrän DNS/SSL är OK |
| Fel efter env-byte (CSRF, fel länkar) | Sätt tillbaka `PUBLIC_ORIGIN` + `ORIGIN` till hosted.app-URL i Firebase Console → redeploy |
| Turnstile 110200 på skaffu.com | Lägg till hostname i Turnstile; eller tillfälligt använd hosted.app för `/register` |
| SSL fastnar Pending | Kontrollera A/TXT/CNAME i Cloudflare (DNS only), ta bort AAAA på apex, vänta propagation |
| Vill avbryta domänbytet helt | Ta bort custom domain i Firebase Console; ta bort DNS-poster i Cloudflare; behåll env på hosted.app |

Hosted.app-URL (nuvarande prod):

`https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app`

---

## Snabbreferens — Firebase + Cloudflare (klick)

### Cloudflare — köp domän

1. dash.cloudflare.com → **Domain Registration** → **Register**
2. Sök `skaffu.com` → köp → vänta Active

### Firebase — koppla domän

1. console.firebase.google.com → **home-pantry-4bee5**
2. **Build** → **App Hosting** → **home-pantry**
3. **Settings** / **Custom domains** → **Add custom domain**
4. `skaffu.com` → kopiera DNS → **Add** `www.skaffu.com` med redirect om möjligt
5. Vänta **Connected**

### Cloudflare — DNS

1. **Websites** → **skaffu.com** → **DNS** → **Records**
2. **Add record** för varje Firebase-post (A, TXT, CNAME)
3. Proxy **DNS only** (grått moln) för Firebase-poster
4. Spara

### Efter Connected

1. Firebase **Environment** → `PUBLIC_ORIGIN` + `ORIGIN` = `https://skaffu.com` → redeploy
2. Turnstile → **Add Hostnames** → `skaffu.com`, `www.skaffu.com`
3. Smoke: `https://skaffu.com/register` + checklista ovan

---

## Vad som redan är förberett i repo (före köp)

- Kod läser **`PUBLIC_ORIGIN`** / **`ORIGIN`** — ingen hårdkodad hosted.app i canonical/CTA-fallback (se `src/lib/marketing/app-url.ts`).
- `.env.example` visar `https://skaffu.com` som exempel för prod.
- `apphosting.yaml` behåller hosted.app **tills du uppdaterar efter steg 4** (kommenterat i filen).
- Cookies: host-only (ingen hårdkodad cookie-domain) — fungerar på ny apex utan kodändring.
- Ingen CORS-konfiguration i `hooks.server.ts` som blockerar ny domän.

---

## När du skriver "domain is live"

Meddela agent/coordinator när Firebase visar **Connected** för `skaffu.com`. Då kan vi:

1. Uppdatera `apphosting.yaml` `PUBLIC_ORIGIN` / `ORIGIN` till `https://skaffu.com`
2. Uppdatera `CAPTCHA.md` + Turnstile-hostnames
3. Uppdatera marknads-copy (kontaktmejl `hello@skaffu.com` m.m.) om önskat
4. Uppdatera GitHub `PRODUCTION_URL`
5. Köra full prod-smoke på skaffu.com
