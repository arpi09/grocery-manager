# Nightly prod error autofix

Cursor Cloud Agent runs nightly (04:00 UTC) to fetch production error logs, fix **one** recurring cluster with a minimal diff, and push to `master` — **without** auto-deploy.

**Related:** [`ERROR_MONITORING.md`](./ERROR_MONITORING.md) · [`.cursor/rules/nightly-prod-error-guard.mdc`](../.cursor/rules/nightly-prod-error-guard.mdc)

---

## What it does

| Step | Action |
|------|--------|
| Fetch | `GET /api/cron/error-export` (24h window, max 25 rows, full stack) |
| Triage | Group by path + message; pick one cluster |
| Fix | Minimal code change + `check:fast` + unit tests |
| Push | `git push origin master` (no PR) |
| Deploy | **None** — prod gets the fix on next manual/coordinator deploy |

Email alerts via [`error-alert-cron.yml`](../.github/workflows/error-alert-cron.yml) continue unchanged (every 30 min).

---

## Cursor Automation setup

| Setting | Value |
|---------|-------|
| Schedule | `0 4 * * *` (04:00 UTC, after nightly E2E at 03:00) |
| Repository | `arpi09/grocery-manager` |
| Branch | `master` |

### Cloud Agent secrets

Configure in [Cursor Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents):

| Secret | Source |
|--------|--------|
| `CRON_SECRET` | Same string as GitHub Actions secret and Firebase App Hosting |
| `PRODUCTION_URL` | `https://skaffu.com` (GitHub variable `PRODUCTION_URL`) |

GitHub write access uses the standard Cursor ↔ GitHub integration (same as nightly E2E guard).

### Automation prompt (core)

```
Follow .cursor/rules/nightly-prod-error-guard.mdc and docs/ERROR_MONITORING.md.

1. Fetch prod errors:
   curl -sS -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_URL/api/cron/error-export?hours=24&limit=25"
2. If count=0, stop with summary.
3. Fix ONE recurring error cluster with minimal diff.
4. Run npm run check:fast and relevant unit tests.
5. Commit and git push origin master.
6. NEVER run deploy.yml or claim prod deployed.
```

---

## Verify export on prod (manual, once)

Requires your local copy of `CRON_SECRET` (GitHub secret / Firebase — not in repo).

**PowerShell:**

```powershell
curl.exe -sS -H "Authorization: Bearer $env:CRON_SECRET" "$env:PRODUCTION_URL/api/cron/error-export?hours=24"
```

**Bash:**

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "$PRODUCTION_URL/api/cron/error-export?hours=24"
```

Set `PRODUCTION_URL=https://skaffu.com` if not already exported.

**Expected (clean prod):**

```json
{"ok":true,"since":"…","count":0,"errors":[],"prodHint":{"note":"compare createdAt with last deploy SHA"}}
```

**401 Unauthorized:** `CRON_SECRET` mismatch between curl and Firebase, or secret not set in App Hosting.

---

## v1 limitations

- No autofix cursor in DB — 24h window only
- One fix per night (enforced in rule)
- No auto-deploy, Sentry, Slack, or PR flow
- Fix reaches prod only after next deploy
