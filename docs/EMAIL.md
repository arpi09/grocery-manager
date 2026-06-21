# Email (Resend)

Skaffu sends transactional email via [Resend](https://resend.com):

- **Household invites** when an owner invites someone by email
- **Email verification** for new accounts
- **Password reset** links
- **Expiry reminders** (weekly cron + session-scoped hook) for users who opt in under Settings
- **PMF weekly digest** (Monday cron) to owner — see [PMF_WEEKLY.md](./PMF_WEEKLY.md#automation)
- **Prod error alerts** (cron) to owner when new errors appear in admin logs

## Templates & layout

| Mejl | Builder | Layout |
|------|---------|--------|
| Hushållsinbjudan | `buildHouseholdInviteEmailContent` | Branded (`email-layout.ts`) |
| E-postverifiering | `buildEmailVerificationEmailContent` | Branded |
| Lösenordsåterställning | `buildPasswordResetEmailContent` | Branded |
| Utgångspåminnelse | `buildExpiryReminderEmailContent` | Branded |
| PMF veckodigest | `buildPmfDigestEmailContent` (`pmf-digest.ts`) | Owner shell + tabell |
| Prod error alert | `buildErrorAlertEmailContent` (`error-alert.ts`) | Owner shell |

Shared branded HTML: [`src/lib/server/email-layout.ts`](src/lib/server/email-layout.ts) (`buildBrandedEmailHtml`, Skaffu header, `#2c4a3e`).

User-facing copy: [`src/lib/server/email.ts`](src/lib/server/email.ts) via `translate()` → `email.templates.*` in [`sv.json`](src/lib/i18n/locales/sv.json) / [`en.json`](src/lib/i18n/locales/en.json).

Expiry reminder CTA links to `/planer/vecka?from=email` (veckoförslag — not legacy “Ät det först” wording).

## Global kill switch (default: off)

Outbound email is **disabled by default**. Nothing is sent via Resend until an admin explicitly enables it.

| Layer | Control | Default |
|-------|---------|---------|
| Admin UI | `/admin` → **Email sending** toggle | Off |
| Environment | `EMAIL_SENDING_DISABLED=true` | Optional extra safety in local `.env` |

Both must allow sending: admin toggle **on** and `EMAIL_SENDING_DISABLED` **not** set to `true`.

When disabled, `sendEmail` returns early (warn log only). Invites still work — copy the invite link from Settings. Expiry reminder cron does not fail loudly; push notifications still deliver if enabled.

### Expiry reminder dedup

- **Interval:** At most one digest per user per 7 calendar days (`expiry_reminder_last_sent_at`).
- **Cron:** `POST /api/cron/expiry-reminders` (Monday 07:00 UTC) — primary prod trigger.
- **Hook:** On authenticated requests, at most **once per browser session** (cookie `hp_expiry_reminder_checked`, httpOnly). Same service path as cron.
- **Atomic claim:** `tryClaimReminderSend` conditional UPDATE prevents parallel sends (race from multi-tab or cron + session). Reverts claim if all channels fail.

See [EMAIL_DEDUP_AUDIT.md](./EMAIL_DEDUP_AUDIT.md) for the duplicate-email investigation.

**Exception:** `sendOwnerPmfDigest()` and `sendOwnerErrorAlert()` bypass the kill switch when `PMF_DIGEST_TO` / `ERROR_ALERT_TO` is set — owner-only, not user invites. Requires `RESEND_API_KEY` and verified `RESEND_FROM` (`hello@skaffu.com`).

## Local development

1. Create a free account at [resend.com](https://resend.com).
2. Copy an API key from **API Keys**.
3. Add to `.env` (never commit `.env`):

```bash
RESEND_API_KEY=re_...
RESEND_FROM=Skaffu <onboarding@resend.dev>
# Optional extra safety:
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

`apphosting.yaml` references `RESEND_API_KEY` (secret), `RESEND_FROM`, and `EMAIL_SENDING_DISABLED` (default allows sending when admin toggle is on).

## Custom domain

1. Resend → **Domains** → add your domain and add DNS records.
2. Update `RESEND_FROM` to use that domain.
3. Clear `EMAIL_SENDING_DISABLED` and enable sending in `/admin`.

## skaffu.com (prod live)

**Status jun 2026:** `https://skaffu.com` is **Connected** (Firebase + SSL). `PUBLIC_ORIGIN` / `ORIGIN` point to skaffu.com. **Resend domain skaffu.com is Verified** (DKIM ok). `RESEND_FROM` is `Skaffu <hello@skaffu.com>`. **`EMAIL_SENDING_DISABLED=false` in prod** — outbound allowed when admin **Email sending** is on in `/admin`.

### Owner checklist before enable

| # | Steg | Var | Klar? |
|---|------|-----|-------|
| 1 | Lägg till domän | [Resend → Domains](https://resend.com/domains) → `skaffu.com` | ☑ |
| 2 | DNS (SPF, DKIM, ev. DMARC) | Cloudflare → **skaffu.com** → DNS | ☑ |
| 3 | Vänta **Verified** i Resend | Resend dashboard | ☑ |
| 4 | Sätt `RESEND_FROM` | Firebase App Hosting env: `Skaffu <hello@skaffu.com>` | ☑ |
| 5 | `EMAIL_SENDING_DISABLED=false` | `apphosting.yaml` (deploy) + `/admin` toggle | ☑ |
| 6 | Testinbjudan | Inställningar → bjud in → länk `https://skaffu.com/invite/...` | efter deploy + toggle |

### Sender address

| Adress | Användning |
|--------|------------|
| `Skaffu <hello@skaffu.com>` | Transaktionellt (inbjudan, utgångspåminnelser) — **rekommenderat** |
| `Skaffu <onboarding@skaffu.com>` | Alternativ om `hello@` redan används |

Exempel efter verifiering:

```bash
RESEND_FROM=Skaffu <hello@skaffu.com>
```

Lokal `.env` — se kommenterade rader i `.env.example`.

### Test after enable

| Steg | Kontroll |
|------|----------|
| Kill switch | Default off in `/admin` — no Resend traffic until toggled |
| Invite | Inställningar → bjud in → mejl till valfri mottagare (kräver verified domain) |
| Länkar | Invite-URL ska peka på `https://skaffu.com/invite/...` |
| Expiry CTA | Utgångsmail → `https://skaffu.com/planer/vecka?from=email` |

Se även [SKAFFU_DOMAIN_MIGRATION.md §7](./SKAFFU_DOMAIN_MIGRATION.md) och [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md).

## Testing

| Check | How |
|-------|-----|
| Disabled | Default — invite created, no Resend call; no error banner in UI |
| Missing key | Omit `RESEND_API_KEY` — invite still created; UI shows invite email warning |
| Dev send | Enable in `/admin`, set `EMAIL_SENDING_DISABLED=false`, Settings → invite → submit. Check [Resend → Emails](https://resend.com/emails). |
| Invite link | Email and settings UI both show `/invite/{token}` using `ORIGIN` / `PUBLIC_ORIGIN`. |
| Unit tests | `src/lib/server/email.test.ts` — no `HP` in HTML, expiry CTA/url |

## Related docs

- [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md) — full deploy and secrets table
