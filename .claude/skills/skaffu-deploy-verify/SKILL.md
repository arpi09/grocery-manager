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

Deploya alltid en **pinnad full merge-SHA** — aldrig `--ref master` blind:

```bash
FULL_SHA=$(gh pr view <nr> --json mergeCommit --jq .mergeCommit.oid)   # eller: git rev-parse <sha>
gh workflow run deploy.yml --ref master -f ref=master -f sha=$FULL_SHA -f deploy_tier=auto
```

- **Varför inte `--ref master`:** `changelog-on-merge` pushar `docs(changelog): … [skip ci]` ovanpå varje merge → master HEAD saknar CI-artefakt → `resolve CI artifact` failar.
- **Varför full SHA (40 tecken):** `actions/checkout` slår upp förkortade SHA som branch/tag-namn och failar.

Följ tills **alla** success: quality, e2e 1–3, deploy, post-deploy smoke, verify release.

### Känd flake: re2 i pre-deploy verify

`npm ci` kan hänga på native-modulen `re2` (firebase-tools → superstatic) tills jobbet dödas av `timeout-minutes: 25` → run **cancelled**. Åtgärd: **trigga om samma SHA** — felsök inte koden.

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
