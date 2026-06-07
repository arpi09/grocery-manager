# Deploy — Home Pantry / Skaffu

**Relaterat:** [CI_CD.md](./CI_CD.md) · [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) · [PROD_SMOKE.md](./PROD_SMOKE.md)

---

## Be coordinator om deploy i chatten

Det enklaste sättet att släppa till produktion: skriv till **coordinator** i Cursor-chatten. Du behöver **inte** öppna GitHub Actions själv.

**Exempel på fraser:**

| Säg till coordinator | |
|----------------------|---|
| `deploy` | Deploya senaste `master` |
| `kör deploy` / `deploya till prod` | Samma — full quality → E2E → Firebase |
| `release` / `släpp till prod` | Samma |

**Vad coordinator gör:**

1. Kontrollerar att CI `quality` på `master` är grön på **samma SHA** som ska deployas (deploy-workflowen verifierar detta automatiskt via G1b SHA-gate).
2. Startar workflowen [**Deploy to production**](https://github.com/arpi09/grocery-manager/actions/workflows/deploy.yml) via `gh workflow run deploy.yml`.
3. Följer körningen tills **alla** jobb är gröna: `quality`, `e2e (1/3)(2/3)(3/3)`, `deploy`, `post-deploy smoke`, **`verify release completed`** (~12–20 min).
4. Om E2E, smoke eller `verify-release` failar: fixar minimalt, pushar `master`, väntar på grön CI, kör deploy igen.
5. Rapporterar tillbaka på svenska: SHA, länk till workflow-körning, prod-URL.

**Ingen prod-release utan grön Deploy-workflow inkl. `verify-release`.** Säg aldrig "deployed" om bara CI eller bara `quality` är grön.

Valfri mobilnotis skickas fortfarande om `DEPLOY_NOTIFY_WEBHOOK_URL` eller Telegram-secrets är konfigurerade.

**Manuellt i GitHub (fallback):** Actions → **Deploy to production** → Run workflow — se [Inputs](#inputs-deploy-to-production) nedan.

---

## Så deployar du (översikt)

Merge till `master` kör **bara snabb CI** (lint, check, tester, build — ~3–5 min). Ingen E2E och ingen Firebase-deploy sker automatiskt.

När du vill släppa till produktion: **be coordinator om deploy i chatten** (rekommenderat) eller kör workflowen manuellt i GitHub.

**E2E utan deploy:** Actions → **E2E** (manuellt), på PR mot `master`, eller nattligt kl. 03:00 UTC.

---

## Nattlig E2E och Cursor Automation

Produktion deployas **inte** automatiskt på natten. Två lager:

1. **GitHub Actions — E2E** (03:00 UTC): [`e2e.yml`](../.github/workflows/e2e.yml) kör quality + Playwright mot senaste `master`. Vid fel kan samma mobilnotis-secrets som deploy användas (valfritt).
2. **Cursor Automation** (04:00 UTC, ~1 h efter GitHub E2E): en schemalagd agent som:
   - Hämtar senaste **E2E**-körning på `master` (`gh run list --workflow=e2e.yml`)
   - Vid **grön:** rapporterar OK — ingen push, **ingen deploy**
   - Vid **röd:** läser loggar, gör minimal fix på `master`, pushar, kör lokal E2E om möjligt
   - **Aldrig** startar **Deploy to production**, `firebase deploy`, eller PROD_SMOKE

Skapa/redigera automationen i Cursor → **Automations** (prefill från coordinator-session). Beteende styrs av [`.cursor/rules/nightly-e2e-guard.mdc`](../.cursor/rules/nightly-e2e-guard.mdc).

Deploy till prod sker fortfarande bara när du ber coordinator om deploy i chatten eller kör **Deploy to production** manuellt.

---

## Workflows

| Fil | Namn (UI) | Trigger | Vad |
|-----|-----------|---------|-----|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | **CI** | Push/PR → `master` | G1 quality (reusable) — snabb feedback |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | **E2E** | PR → `master`; `workflow_dispatch`; nattlig schedule | G2 Playwright (3 shards) |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | **Deploy to production** | `workflow_dispatch`; guide-only `push` | G1b → G2 → G3 → G4 smoke → G5 verify-release |

Guide-only auto-deploy: push till `master` som **endast** ändrar `content/guides/**` kör full deploy-pipeline (samma gates som manuell deploy).

---

## Ägare — checklista (GitHub + Firebase)

Dessa steg kan inte aktiveras från kod men är **högsta ROI** mot dubbel deploy och trasiga releases:

| Åtgärd | Var |
|--------|-----|
| Branch protection på `master` — kräv status check **`quality`** | GitHub → Settings → Branches |
| Stäng av **Firebase App Hosting → GitHub auto-deploy** | Firebase Console |
| Säkerställ `FIREBASE_TOKEN` och `PRODUCTION_URL` i GitHub | Settings → Secrets and variables |

Se [CI_CD.md](./CI_CD.md) för G0–G5 gate-tabell och incident-lärdomar (2026-06-07).

---

## Inputs (Deploy to production)

| Input | Standard | Syfte |
|-------|----------|-------|
| `ref` | `master` | Branch eller tag att bygga och deploya |
| `sha` | *(tom)* | Specifik commit — överstyr `ref` om satt |
| `skip_e2e` | `false` | HOTFIX ONLY — hoppa över E2E (kräver `hotfix_confirm`) |
| `hotfix_confirm` | *(tom)* | Skriv exakt `hotfix` när `skip_e2e=true` |

---

## Secrets

| Secret | Syfte |
|--------|-------|
| `FIREBASE_TOKEN` | `npx firebase login:ci` — krävs för deploy från Actions |
| `DEPLOY_NOTIFY_WEBHOOK_URL` | Valfri push-notis (ntfy, Discord, Slack) |
| `DEPLOY_TELEGRAM_BOT_TOKEN` + `DEPLOY_TELEGRAM_CHAT_ID` | Valfri Telegram-notis |

Utan `FIREBASE_TOKEN` körs quality + E2E ändå; deploy-jobbet skippar med tydlig loggrad.

**Firebase Console → App Hosting → GitHub auto-deploy:** stäng av om Actions ska vara enda källan — undvik dubbel deploy.

---

## Release-gates (G0–G5)

| Gate | Beskrivning |
|------|-------------|
| **G0** | Lokalt: `npm run check && npm test` |
| **G1** | CI `quality` på varje push/PR (+ `check:server-imports`, `check:client-bundle`) |
| **G1b** | Deploy kräver grön CI på samma SHA |
| **G2** | E2E × 3 shards inkl. marketing hydration smoke |
| **G3** | Firebase App Hosting deploy |
| **G4** | `scripts/smoke-prod-urls.sh` — HTTP 200 + ingen `Internal Error` i HTML |
| **G5** | `verify-release` — workflow failar om e2e/deploy/smoke inte kördes |

---

## Efter deploy

Coordinator eller e2e-agent kör [PROD_SMOKE.md](./PROD_SMOKE.md) (5 punkter) när deploy faktiskt skett — inte användaren som läxa. Verifiera `/` i browser med konsolen öppen (inte bara curl).

---

## English summary

- **Merge to `master`** → fast CI only (~3–5 min).
- **Production release** → GitHub Actions → **Deploy to production** → all jobs green including **verify release completed**.
- **E2E before merge (optional)** → open a PR to `master` (E2E workflow) or run **E2E** manually.
