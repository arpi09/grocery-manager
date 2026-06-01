# Email (Resend)

Home Pantry sends transactional email via [Resend](https://resend.com):

- **Household invites** when an owner invites someone by email
- **Expiry reminders** (weekly cron) for users who opt in under Settings

## Global kill switch (default: off)

Outbound email is **disabled by default**. Nothing is sent via Resend until an admin explicitly enables it.

| Layer | Control | Default |
|-------|---------|---------|
| Admin UI | `/admin` → **Email sending** toggle | Off |
| Environment | `EMAIL_SENDING_DISABLED=true` | Set in `apphosting.yaml` until domain is verified |

Both must allow sending: admin toggle **on** and `EMAIL_SENDING_DISABLED` **not** set to `true`.

When disabled, `sendEmail` returns early (warn log only). Invites still work — copy the invite link from Settings. Expiry reminder cron does not fail loudly; push notifications still deliver if enabled.

After verifying a custom domain in Resend:

1. Update `RESEND_FROM` in Firebase App Hosting (or `.env` locally).
2. Remove or set `EMAIL_SENDING_DISABLED=false` in App Hosting.
3. Enable **Email sending** on `/admin`.

## Local development

1. Create a free account at [resend.com](https://resend.com).
2. Copy an API key from **API Keys**.
3. Add to `.env` (never commit `.env`):

```bash
RESEND_API_KEY=re_...
RESEND_FROM=Home Pantry <onboarding@resend.dev>
# Optional extra safety (matches production default):
EMAIL_SENDING_DISABLED=true
```

Resend's shared `onboarding@resend.dev` sender works for testing. Invites only deliver to the **Resend account owner's email** until you verify a custom domain.

4. Enable sending: `/admin` → turn on **Email sending** (and unset `EMAIL_SENDING_DISABLED` locally if set).
5. Ensure `ORIGIN` / `PUBLIC_ORIGIN` match how you open the app (see `.env.example`) so invite links in emails are correct.

## Production (Firebase App Hosting)

Secrets stay in **Firebase Secret Manager** — no GitHub secret needed for Resend.

```bash
npx firebase apphosting:secrets:set RESEND_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend home-pantry --project home-pantry-4bee5
```

**Windows helper (both Resend + Turnstile server secret):** `powershell -File scripts/setup-resend-turnstile-secrets.ps1` — see [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md#resend-and-turnstile-secrets-helper-script).

`apphosting.yaml` references `RESEND_API_KEY` (secret), `RESEND_FROM`, and `EMAIL_SENDING_DISABLED=true` by default.

## Custom domain (later)

1. Resend → **Domains** → add your domain and add DNS records.
2. Update `RESEND_FROM` to use that domain.
3. Clear `EMAIL_SENDING_DISABLED` and enable sending in `/admin`.

## skaffu.com (efter Firebase Connected)

**Gör inte detta förrän `skaffu.com` är Connected i Firebase App Hosting** (DNS + SSL). Tills dess: prod behåller `onboarding@resend.dev` och `EMAIL_SENDING_DISABLED=true`.

### 1. Verifiera domän i Resend

1. [Resend → Domains](https://resend.com/domains) → **Add domain** → `skaffu.com`.
2. Resend visar DNS-poster (SPF, DKIM, ev. DMARC). Lägg in dem i **Cloudflare DNS** (samma konto som domänen).
3. Vänta tills status **Verified** (ofta 15 min–några timmar).

`www.skaffu.com` behövs normalt **inte** för avsändare om `RESEND_FROM` använder apex (`@skaffu.com`). Lägg till subdomän i Resend bara om du vill skicka från t.ex. `hello@www.skaffu.com`.

### 2. Välj avsändaradress

| Adress | Användning |
|--------|------------|
| `Skaffu <hello@skaffu.com>` | Transaktionellt (inbjudan, utgångspåminnelser) — **rekommenderat** |
| `Skaffu <onboarding@skaffu.com>` | Alternativ om `hello@` redan används |
| `Home Pantry <hello@skaffu.com>` | Behåll varumärke Home Pantry i visningsnamn |

Exempel efter verifiering:

```bash
# Firebase Secret Manager / App Hosting env (inte förrän domän Verified)
RESEND_FROM=Skaffu <hello@skaffu.com>
```

Lokal `.env` — se kommenterade rader i `.env.example`.

### 3. Uppdatera prod (efter Verified + skaffu.com live)

Ordning:

1. Sätt `PUBLIC_ORIGIN` + `ORIGIN` till `https://skaffu.com` ([SKAFFU_DOMAIN_MIGRATION.md](./SKAFFU_DOMAIN_MIGRATION.md)).
2. Uppdatera `RESEND_FROM` i Firebase App Hosting (eller secret om ni flyttar dit).
3. **Fortfarande av:** lämna `EMAIL_SENDING_DISABLED=true` tills du medvetet slår på mejl.
4. När du vill skicka: sätt `EMAIL_SENDING_DISABLED=false` **och** slå på **Email sending** i `/admin`.

### 4. Test efter enable

| Steg | Kontroll |
|------|----------|
| Kill switch | Default off — ingen Resend-trafik |
| Invite | Inställningar → bjud in → mejl till valfri mottagare (kräver verified domain) |
| Länkar | Invite-URL ska peka på `https://skaffu.com/invite/...` (kräver steg 3.1) |

Se även [SKAFFU_DOMAIN_MIGRATION.md §7](./SKAFFU_DOMAIN_MIGRATION.md) och [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md).

## Testing

| Check | How |
|-------|-----|
| Disabled | Default — invite created, no Resend call; no error banner in UI |
| Missing key | Omit `RESEND_API_KEY` — invite still created; UI shows invite email warning |
| Dev send | Enable in `/admin`, set `EMAIL_SENDING_DISABLED=false`, Settings → invite → submit. Check [Resend → Emails](https://resend.com/emails). |
| Invite link | Email and settings UI both show `/invite/{token}` using `ORIGIN` / `PUBLIC_ORIGIN`. |

## Related docs

- [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md) — full deploy and secrets table
