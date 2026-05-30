# Custom domain — homepantry.com

Step-by-step guide to serve Home Pantry on **homepantry.com** (and `www`) via Firebase App Hosting. DNS and domain attachment are done in Firebase Console and at your domain registrar — this repo documents the process and holds the code/env prep.

**Recommended setup (v1):** one domain, one deploy — marketing at `/` and app at `/login`, `/hem`, etc. See [`MARKETING_SITE.md`](./MARKETING_SITE.md).

Official reference: [Connect a custom domain (Firebase App Hosting)](https://firebase.google.com/docs/app-hosting/custom-domain).

---

## Before you start

- [ ] App already deploys to Firebase App Hosting backend **`home-pantry`** (see [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md)).
- [ ] You own **homepantry.com** and can edit DNS at the registrar (e.g. Google Domains, Cloudflare, Loopia).
- [ ] Decide canonical host: **`https://homepantry.com`** (apex, recommended) with `www` redirecting to apex.

---

## 1. Add domains in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/) → project **home-pantry-4bee5**.
2. Go to **App Hosting** → backend **home-pantry** → **Custom domains** (or **Settings → Domains**).
3. Click **Add custom domain**.
4. Enter **`homepantry.com`** → continue. Firebase shows required DNS records (exact values are **project-specific** — copy from the console, do not guess).
5. Repeat for **`www.homepantry.com`**.

Typical record types (see [Firebase docs](https://firebase.google.com/docs/app-hosting/custom-domain#dns-records)):

| Type | Host / name | Purpose |
|------|-------------|---------|
| **A** | `@` (apex) | Points apex to Firebase App Hosting IPv4 |
| **TXT** | `@` | Domain ownership verification |
| **CNAME** | `_acme-challenge…` | SSL certificate (ACME) — **keep after setup** |
| **CNAME** | `www` | Subdomain → Firebase (or A record if console shows A for www) |

Notes:

- Use the **exact** hostnames and values Firebase displays for your backend.
- Remove conflicting **AAAA** records on the apex if Firebase asks — App Hosting does not use them and they can block SSL.
- Remove old **A/CNAME** records pointing at other hosts (previous site, parking page).
- Propagation can take minutes to 48 hours; status in console moves from **Needs setup** → **Pending** → **Connected**.

---

## 2. Configure DNS at your registrar

1. Log in where **homepantry.com** DNS is managed.
2. Add/update records from step 1 (A, TXT, CNAME as shown).
3. Save and wait for propagation. Use `dig homepantry.com` / [Google Admin Toolbox Dig](https://toolbox.googleapps.com/apps/dig/) if needed.

Troubleshooting: [App Hosting custom domain FAQ](https://firebase.google.com/docs/app-hosting/troubleshooting).

---

## 3. SSL provisioning

- Firebase provisions TLS via **Google Certificate Manager** once DNS verifies.
- Status **Connected** with a valid certificate usually within **15 minutes to a few hours** after DNS is correct.
- Do **not** delete the `_acme-challenge` CNAME — certificate renewal depends on it.
- Both `homepantry.com` and `www.homepantry.com` get certificates when both are added.

---

## 4. www → apex redirect (recommended)

Prefer **`https://homepantry.com`** as the canonical URL (SEO, emails, `PUBLIC_ORIGIN`).

When adding **`www.homepantry.com`** in Firebase Console, choose **Redirect to existing website** (or equivalent) and select **`homepantry.com`** if offered.

If the console does not offer redirect:

- Serve both hosts on the same backend (both work), and rely on **`PUBLIC_ORIGIN=https://homepantry.com`** so canonical links and emails always use apex.
- Optionally add a redirect at the DNS/CDN layer (e.g. Cloudflare page rule) from `www` → apex.

This project uses **App Hosting only** (no classic Firebase Hosting `redirects` in `firebase.json`). Redirects are configured in Firebase Console or external DNS/CDN.

---

## 5. Update production environment variables

After the custom domain is **Connected**, set the canonical origin in Firebase (Console → App Hosting → **home-pantry** → **Environment**, or edit `apphosting.yaml` and redeploy):

```yaml
PUBLIC_ORIGIN: https://homepantry.com
ORIGIN: https://homepantry.com
```

| Variable | When to set | Purpose |
|----------|-------------|---------|
| `PUBLIC_ORIGIN` | BUILD + RUNTIME | Canonical URL in marketing meta (`og:url`, `canonical`), client-visible base |
| `ORIGIN` | RUNTIME | `@sveltejs/adapter-node` — form-action CSRF and absolute URL generation |
| `PUBLIC_APP_URL` | Optional | **Only** if marketing and app are on **different** domains. Leave unset for single-domain v1. |

Redeploy after changing env (push to `main` or `npm run deploy:firebase`).

**Do not** set `PUBLIC_APP_URL` when marketing and app share `homepantry.com` — CTAs should stay relative (`/login`).

---

## 6. Same domain: marketing + app

No routing changes required. The SvelteKit app already uses route groups:

| URL | Serves |
|-----|--------|
| `/` | Marketing landing (`(marketing)`) |
| `/funktioner`, `/faq`, `/privacy`, … | Marketing pages |
| `/login`, `/register` | Auth |
| `/hem`, `/scan`, `/inkop`, … | Logged-in app |

`hooks.server.ts` treats marketing paths as public; authenticated users on marketing URLs redirect to `/hem`.

---

## 7. Email and absolute links

Invite emails and settings UI build links with `getAppOrigin()` (`src/lib/server/origin.ts`), which reads **`ORIGIN`** then **`PUBLIC_ORIGIN`**.

After domain cutover:

1. Set both to `https://homepantry.com`.
2. Send a test household invite — link should be `https://homepantry.com/invite/{token}`.
3. (Later) Verify **Resend** sender domain for `hello@homepantry.com` — see [`EMAIL.md`](./EMAIL.md).

Future expiry-reminder emails will use the same helper.

---

## 8. Post-cutover verification checklist

- [ ] `https://homepantry.com/` — marketing landing loads, valid SSL (padlock).
- [ ] `https://www.homepantry.com/` — redirects to apex or loads same site (per your redirect choice).
- [ ] `https://homepantry.com/login` — login works; session cookie persists after login.
- [ ] `https://homepantry.com/hem` — dashboard after login.
- [ ] Register / form POST — no CSRF errors (confirms `ORIGIN` matches browser URL).
- [ ] View source on `/` — `<link rel="canonical">` and `og:url` use `https://homepantry.com`.
- [ ] Household invite email — link uses `https://homepantry.com`, not `*.hosted.app`.
- [ ] Old `*.hosted.app` URL still works until you remove it (optional; keep during transition).

---

## Owner checklist (Firebase Console — 5 steps)

1. **App Hosting → home-pantry → Custom domains → Add** `homepantry.com`.
2. **Copy DNS records** (A, TXT, CNAME) into your registrar for apex.
3. **Add** `www.homepantry.com`; enable **redirect to homepantry.com** if available.
4. Wait until both domains show **Connected** with SSL active.
5. **Environment:** set `PUBLIC_ORIGIN` and `ORIGIN` to `https://homepantry.com`, redeploy, run verification checklist above.

---

## Related docs

- [`MARKETING_SITE.md`](./MARKETING_SITE.md) — marketing architecture and env vars
- [`FIREBASE_DEPLOY.md`](./FIREBASE_DEPLOY.md) — deploy pipeline and env table
- [`EMAIL.md`](./EMAIL.md) — Resend and invite links
