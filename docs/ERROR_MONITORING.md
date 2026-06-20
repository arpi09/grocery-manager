# Prod error monitoring

How Skaffu captures production errors, surfaces them in admin, and alerts the owner — so bugs are found before users report them manually.

**Related:** [`PROD_SMOKE.md`](./PROD_SMOKE.md) · [`CI_CD.md`](./CI_CD.md) · [`EMAIL.md`](./EMAIL.md)

---

## Error flow

| Source | Captured by | Visible in admin |
|--------|-------------|------------------|
| Server 500 (`handleError`) | `recordAppError` → Postgres `app_error` | Admin → **Error logs** |
| API / webhook failures (e.g. Kivra) | explicit `recordAppError` | Same |
| Client crashes (`window.onerror`, unhandled rejections, SvelteKit client errors) | `POST /api/client-errors` → `recordAppError` | Same (path prefix `CLIENT …`) |

There is **no Sentry** — errors stay in-app (7-day retention, max 200 rows).

---

## Owner alerting (email)

**Cron:** GitHub Actions [`error-alert-cron.yml`](../.github/workflows/error-alert-cron.yml) → `POST /api/cron/error-alert` every **30 minutes**.

When new errors exist since the last alert cursor, Resend emails the owner with a summary + link to `/admin`.

| Env (Firebase App Hosting secrets) | Purpose |
|-----------------------------------|---------|
| `RESEND_API_KEY` | Send alert email |
| `RESEND_FROM` | From address (verified domain) |
| `ERROR_ALERT_TO` | Alert recipient (optional — falls back to `PMF_DIGEST_TO`) |
| `PMF_DIGEST_TO` | Fallback recipient |
| `CRON_SECRET` | Authorize cron routes |

Alerts **bypass** `EMAIL_SENDING_DISABLED` (same pattern as PMF weekly digest).

**GitHub:** secret `CRON_SECRET`, variable `PRODUCTION_URL` (same as other crons).

---

## Prevention (CI / deploy)

| Gate | What it catches |
|------|-----------------|
| `check:server-imports` | `.server` / Node imports in client code |
| `check:client-bundle` | Forbidden strings in shipped client JS (`process.cwd`, `guides.server`, …) |
| E2E `smoke.spec.ts` | Marketing hydration / `process is not defined` |
| Deploy `smoke-prod-urls.sh` | Prod HTTP 200 + no "Internal Error" / 500 HTML / client crash strings |

---

## Agent workflow

Before asking the user to reproduce a prod bug:

1. Check **Admin → Error logs** (or ask coordinator to).
2. Read this doc + [`PROD_SMOKE.md`](./PROD_SMOKE.md).
3. Confirm deploy pipeline gates above are green on the suspect SHA.

See [`.cursor/rules/prod-error-monitoring.mdc`](../.cursor/rules/prod-error-monitoring.mdc).

---

## Owner checklist (one-time)

- [ ] Firebase secrets: `RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`, `PMF_DIGEST_TO` (or `ERROR_ALERT_TO`)
- [ ] GitHub: `CRON_SECRET`, `PRODUCTION_URL`, enable **Error alert cron** workflow
- [ ] Optional: `DEPLOY_NOTIFY_WEBHOOK_URL` / Telegram for deploy success (not runtime errors)
- [ ] GitHub repo **Watch → Actions** (or failed-workflow notifications) for CI/deploy failures

After deploy, verify cron manually once:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_URL/api/cron/error-alert"
```

Expected: `{"ok":true,"sent":false,"skipped":"no new errors"}` when logs are clean.

---

## Machine-readable export (nightly autofix)

**Route:** `GET /api/cron/error-export` — same `Authorization: Bearer $CRON_SECRET` as other cron routes.

| Query | Default | Max |
|-------|---------|-----|
| `hours` | 24 | 168 |
| `limit` | 25 | 100 (`ERROR_LOG_ADMIN_LIST_MAX`) |

Response includes full `stack` per error (admin UI loads stack on demand). Used by the nightly Cursor Automation — see [`.cursor/rules/nightly-prod-error-guard.mdc`](../.cursor/rules/nightly-prod-error-guard.mdc) and [`NIGHTLY_PROD_ERROR_AUTOFIX.md`](./NIGHTLY_PROD_ERROR_AUTOFIX.md).

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_URL/api/cron/error-export?hours=24&limit=25"
```

**v1:** No autofix cursor in DB — automation uses 24h window and fixes **one** error cluster per run.

---

## Nightly automation (owner)

| Item | Detail |
|------|--------|
| Schedule | 04:00 UTC (`0 4 * * *`) — after nightly E2E (03:00 UTC) |
| Branch | `master` (direct push, no PR) |
| Secrets | `CRON_SECRET`, `PRODUCTION_URL` in Cursor Cloud Agents dashboard |
| Deploy | Automation never runs `deploy.yml` — coordinator deploys separately |

Runbook: [`NIGHTLY_PROD_ERROR_AUTOFIX.md`](./NIGHTLY_PROD_ERROR_AUTOFIX.md).
