# Email (Resend)

Home Pantry sends transactional email via [Resend](https://resend.com) — currently **household invite** messages when an owner invites someone by email.

## Local development

1. Create a free account at [resend.com](https://resend.com).
2. Copy an API key from **API Keys**.
3. Add to `.env` (never commit `.env`):

```bash
RESEND_API_KEY=re_...
RESEND_FROM=Home Pantry <onboarding@resend.dev>
```

Resend’s shared `onboarding@resend.dev` sender works for testing. Invites only deliver to the **Resend account owner’s email** until you verify a custom domain.

4. Ensure `ORIGIN` / `PUBLIC_ORIGIN` match how you open the app (see `.env.example`) so invite links in emails are correct.

## Production (Firebase App Hosting)

Secrets stay in **Firebase Secret Manager** — no GitHub secret needed for Resend.

```bash
npx firebase apphosting:secrets:set RESEND_API_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend home-pantry --project home-pantry-4bee5
```

`apphosting.yaml` already references `RESEND_API_KEY` (secret) and `RESEND_FROM` (env var). Override `RESEND_FROM` in the Firebase console after you verify a domain, e.g. `Home Pantry <noreply@yourdomain.com>`.

## Custom domain (later)

1. Resend → **Domains** → add your domain and add DNS records.
2. Update `RESEND_FROM` to use that domain.
3. Redeploy is not required for env-only changes if you update App Hosting environment variables in the console.

## Testing

| Check | How |
|-------|-----|
| Missing key | Omit `RESEND_API_KEY` — invite still created; UI shows “Inbjudan skapad men e-post kunde inte skickas.” |
| Dev send | Settings → Hushåll → Bjud in → enter email → submit. Check [Resend → Emails](https://resend.com/emails). |
| Invite link | Email and settings UI both show `/invite/{token}` using `ORIGIN` / `PUBLIC_ORIGIN`. |

## Related docs

- [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md) — full deploy and secrets table
