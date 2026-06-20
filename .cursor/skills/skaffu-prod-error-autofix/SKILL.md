---
name: skaffu-prod-error-autofix
description: Nightly prod error autofix — fetch in-app error logs, fix one cluster, push master, no deploy. Use when running nightly prod error automation or coordinator delegated prod error fix.
---

# Skaffu prod error autofix

Operational skill for the nightly Cursor Automation that fixes recurring production errors.

## When to use

- Nightly scheduled Cursor Automation (04:00 UTC)
- Coordinator delegates a minimal prod error fix without deploy

## Read first

1. [`.cursor/rules/nightly-prod-error-guard.mdc`](../../rules/nightly-prod-error-guard.mdc) — scope, flow, forbidden actions
2. [`docs/ERROR_MONITORING.md`](../../../docs/ERROR_MONITORING.md) — error capture, alert email, export API
3. [`docs/NIGHTLY_PROD_ERROR_AUTOFIX.md`](../../../docs/NIGHTLY_PROD_ERROR_AUTOFIX.md) — secrets, verify curl, automation setup

## Core steps

1. Fetch: `GET $PRODUCTION_URL/api/cron/error-export?hours=24&limit=25` with `Authorization: Bearer $CRON_SECRET`
2. If `count == 0`, stop — no push
3. Pick **one** recurring cluster (path + message); prefer 500s and post-deploy regressions
4. Minimal fix + `npm run check:fast` + relevant unit tests
5. Commit and `git push origin master` — **no PR**, **no deploy**

## Cloud Agent secrets (Cursor dashboard)

| Secret | Value |
|--------|-------|
| `CRON_SECRET` | Same as GitHub Actions / Firebase App Hosting |
| `PRODUCTION_URL` | `https://skaffu.com` |

## Do not

- Run `deploy.yml` or claim prod is live
- Fix multiple unrelated clusters in one run
- Ask the user to reproduce when export + stack suffice
