# VAPID setup — Web Push

**VAPID** (Voluntary Application Server Identification) is a pair of keys that lets your server prove it is allowed to send push notifications to browsers subscribed via your PWA.

Env var names used in code: `PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_CONTACT`. See [PWA.md](./PWA.md).

## Generate keys (one-time)

```bash
npx web-push generate-vapid-keys
```

Store the output in `private/VAPID_KEYS.local.txt` (gitignored) — **never commit the private key**.

## Production — Firebase App Hosting

`apphosting.yaml` references the public key inline and `VAPID_PRIVATE_KEY` as a secret. After generating keys, set the secret (paste private key when prompted):

```bash
npx firebase apphosting:secrets:set VAPID_PRIVATE_KEY --project home-pantry-4bee5
npx firebase apphosting:secrets:grantaccess VAPID_PRIVATE_KEY --backend home-pantry --project home-pantry-4bee5
```

Verify without reading the value:

```bash
npx firebase apphosting:secrets:describe VAPID_PRIVATE_KEY --project home-pantry-4bee5
```

Redeploy after secrets are set so Cloud Run picks up `VAPID_PRIVATE_KEY`.

The public key is already in `apphosting.yaml` as `PUBLIC_VAPID_PUBLIC_KEY` (BUILD + RUNTIME). Update that value there if you rotate keys.

## Local development

Add to `.env` (copy from `.env.example` if needed):

```env
PUBLIC_VAPID_PUBLIC_KEY=<public key from generate-vapid-keys>
VAPID_PRIVATE_KEY=<private key — server only, never commit>
```

Use `npm run dev:https` to test push locally (service worker is off in plain `npm run dev`).

## Security

- **Do not** put `VAPID_PRIVATE_KEY` in committed files (`apphosting.yaml`, docs, or git).
- Public key in `apphosting.yaml` is fine — browsers need it for subscription.
