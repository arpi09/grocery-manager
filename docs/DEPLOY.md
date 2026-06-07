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

1. Kontrollerar att CI på `master` är grön och security-gate OK.
2. Startar workflowen [**Deploy to production**](https://github.com/arpi09/grocery-manager/actions/workflows/deploy.yml) via `gh workflow run deploy.yml`.
3. Följer körningen tills den är klar (~12–20 min med E2E — tre parallella shards).
4. Om E2E eller quality failar: fixar minimalt, pushar `master`, kör deploy igen.
5. Rapporterar tillbaka på svenska: SHA, länk till workflow-körning, prod-URL.

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
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | **CI** | Push/PR → `master` | G1 quality — snabb feedback |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | **E2E** | PR → `master`; `workflow_dispatch`; nattlig schedule | G2 Playwright (3 shards) |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | **Deploy to production** | `workflow_dispatch` only | G1 → G2 (3 shards) → G3 Firebase |

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

## Efter deploy

Coordinator eller e2e-agent kör [PROD_SMOKE.md](./PROD_SMOKE.md) (5 punkter) när deploy faktiskt skett — inte användaren som läxa.

---

## English summary

- **Merge to `master`** → fast CI only (~3–5 min).
- **Production release** → GitHub Actions → **Deploy to production** → Run workflow.
- **E2E before merge (optional)** → open a PR to `master` (E2E workflow) or run **E2E** manually.
