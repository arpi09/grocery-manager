# Deploy — Home Pantry / Skaffu

**Relaterat:** [CI_CD.md](./CI_CD.md) · [FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) · [PROD_SMOKE.md](./PROD_SMOKE.md)

---

## Så deployar du

Merge till `master` kör **bara snabb CI** (lint, check, tester, build — ~3–5 min). Ingen E2E och ingen Firebase-deploy sker automatiskt.

När du vill släppa till produktion:

1. Se till att **CI** är grön på `master` (senaste merge).
2. Gå till GitHub → **Actions** → **Deploy to production** → **Run workflow**.
3. Lämna **ref** som `master` (standard) eller ange en **sha** om du vill deploya en specifik commit.
4. Kryssa i **Skip E2E** endast vid akut hotfix — standard är att E2E körs före deploy (~15–25 min totalt).
5. Vänta tills workflowen är grön. Du får mobilnotis om `DEPLOY_NOTIFY_WEBHOOK_URL` eller Telegram-secrets är konfigurerade.

**E2E utan deploy:** Actions → **E2E** (manuellt), på PR mot `master`, eller nattligt kl. 03:00 UTC.

---

## Workflows

| Fil | Namn (UI) | Trigger | Vad |
|-----|-----------|---------|-----|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | **CI** | Push/PR → `master` | G1 quality — snabb feedback |
| [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) | **E2E** | PR → `master`; `workflow_dispatch`; nattlig schedule | G2 Playwright |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | **Deploy to production** | `workflow_dispatch` only | G1 → G2 → G3 Firebase |

---

## Inputs (Deploy to production)

| Input | Standard | Syfte |
|-------|----------|-------|
| `ref` | `master` | Branch eller tag att bygga och deploya |
| `sha` | *(tom)* | Specifik commit — överstyr `ref` om satt |
| `skip_e2e` | `false` | Hoppa över E2E vid nödfall (dokumentera varför) |

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
