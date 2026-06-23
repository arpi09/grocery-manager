---
name: skaffu-deploy-verify
description: Verifies Skaffu production deploy readiness and post-deploy smoke. Use when user says deploy, prod, release, rollback, or asks if prod is live.
---

# Skaffu deploy verification

## Pre-deploy (samma SHA)

1. `gh run list --workflow=ci.yml --branch=master -L 3` — **`pr-gate / pr-gate`** success på target SHA.
2. G0 lokalt om du pushat nytt: `npm run quick:dev`.
3. Security: `private/SECURITY_REPORT.md` om tillgänglig — blocked = stop.

## Trigger

`gh workflow run deploy.yml --ref master -f ref=master`

Följ tills **alla** success: quality, e2e 1–3, deploy, post-deploy smoke, verify release.

## Post-deploy (obligatorisk)

1. Uppdatera `docs/CURRENT_REALITY.md` prod SHA.
2. Kör checklista i [docs/PROD_SMOKE.md](../../docs/PROD_SMOKE.md) — **läs CURRENT_REALITY för faktisk nav**.
3. Browser: `/`, login, default landing (förväntat `/inkop`), inkop lista, checkoff.

## Rollback

- Firebase App Hosting: revert rollout i console ELLER deploy föregående green SHA.
- Git: `git revert` + push master + deploy igen.
- DB migrations 0045+ — ingen auto-down; forward-fix only.

## Förbjudet

Säg inte "deployed" utan grön deploy-workflow + post-deploy smoke för SHA.
