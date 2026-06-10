# Launch-checklista — growth wave (Wrapped, Skaffurapport, Grannskafferiet v0)

Operativ checklista för deploy av **gamification + Wrapped / Skaffurapport / Grannskafferiet v0** (`9265b522` på `master`). Kompletterar [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) och [`PROD_SMOKE.md`](./PROD_SMOKE.md).

**Deploy:** manuell via Actions → **Deploy to production** — denna lista förbereder, triggar inte deploy.

---

## Före deploy

- [ ] **CI grön** — workflow **CI** på `master` (lint, check, test, integration, build). Senaste push: kontrollera [Actions → CI](https://github.com/arpi09/grocery-manager/actions/workflows/ci.yml).
- [ ] **E2E** — valfritt före deploy; **obligatoriskt** i deploy-kedjan (G3). Nattlig schedule 03:00 UTC eller manuell körning.
- [ ] **Migration 0030** — `drizzle/0030_expiring_share_link.sql` (`expiring_share_link`) appliceras vid prod-boot via befintlig migrationskedja; verifiera i deploy-logg att inget migrationsfel.
- [ ] **Migration 0038** — `drizzle/0038_nearby_expiring_share.sql` (Grannskafferiet v1 geo) appliceras vid prod-boot; verifiera i deploy-logg.
- [ ] **Migration 0039** — `drizzle/0039_expiring_share_report_block.sql` (report/block v1.1) appliceras vid prod-boot; verifiera i deploy-logg.
- [ ] **Cron schemalagd** — workflow [`.github/workflows/skaffurapport-cron.yml`](../.github/workflows/skaffurapport-cron.yml) mergad till `master`. Schema: **1:a i månaden 06:00 UTC** → `POST /api/cron/skaffurapport`. Secrets: `CRON_SECRET` (samma som övriga cron), variable `PRODUCTION_URL` (`https://skaffu.com`). Manuell test: Actions → **Skaffurapport cron** → Run workflow.
- [ ] **Firebase secrets** — `CRON_SECRET` i Secret Manager matchar GitHub (se [`CI_CD.md`](./CI_CD.md) § Secrets).

---

## Deploy (manuell)

- [ ] Actions → **Deploy to production** → Run workflow (ingen auto-deploy).
- [ ] Vänta grön deploy-run; notera target-SHA.

---

## Efter deploy — manuell smoke (growth wave)

Kör som inloggad användare med testdata om möjligt (~10 min).

| Område | URL / steg | Förväntat |
|--------|------------|-----------|
| **Wrapped** | `/statistik/wrapped` (ev. `?month=YYYY-MM`) | Slides laddar; dela/ladda ner PNG; event `wrapped_viewed` |
| **Wrapped-ingång** | `/statistik`, `/hem` (första måndagen i månaden) | CTA / banner syns när data finns |
| **Skaffurapport** | `/rapport/YYYY-MM` (föregående månad) | Marketing-layout; diagram eller beta-disclaimer |
| **Grannskafferiet** | Ät det först → **Dela utgående lista** → `/dela/[token]` | Snapshot read-only; länk 48 h; `noindex` |
| **Gamification** | `/statistik` | Milstolpar, streak, sparade kr; celebration-toasts vid markering |

Bas-smoke enligt [`PROD_SMOKE.md`](./PROD_SMOKE.md) (login, `/hem`, scan) ska fortfarande passera.

---

## PMF-gates & kommunikation

| Feature | Gate | Kommunikation |
|---------|------|---------------|
| **Wrapped** | Inget hushållsgolv — kan delas när som helst | LinkedIn / Stories: *privat* månadssammanfattning; UTM valfritt (`utm_campaign=wrapped-YYYY-MM`). Se [`WRAPPED.md`](./WRAPPED.md). |
| **Skaffurapport (publik PR)** | ≥10 hushåll (k-anonymitet); **≥50** för “stor” launch utan beta-disclaimer | LinkedIn / poddar **efter** månadscron och när `householdCount ≥ 50`. Annars endast intern preview. Se [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) § Skaffurapporten. |
| **Grannskafferiet v0** | Ingen extra gate | Soft mention i community-poster om relevant; se [`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md). |
| **Grannskafferiet v1.2 karta** | **≥5–10 aktiva delningar** i målområde/stad | Marknadsför **inte** `/grannskafferiet` som huvudingång före density-gate. Tills dess: **Dela som bild + länk** i grupper ([`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md) hybrid launch). Mät: `nearby_map_opened`, `expiring_share_created`. |

**Timing:** Wrapped kan postas direkt efter deploy. Publik rapport-PR vänta till **dagen efter** första lyckade månadscron (eller manuell `workflow_dispatch`) **och** PMF-gate uppfylld.

---

## Referenser (LAUNCH_PLAYBOOK)

| Sektion i [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) | Användning |
|--------------------------------------------------------|------------|
| Go / no-go innan post | Baslinje prod redo (domän, onboarding, `/privacy`, PWA) |
| PMF-mätetal | `/admin` — hushållantal för Skaffurapport-gate |
| Skaffurapporten (public PR) | Cron, URL, disclaimer, LinkedIn-vinkel |
| UTM | `utm_source=linkedin&utm_medium=pr&utm_campaign=skaffurapport-YYYY-MM` |

---

## Blockers (större deploy sen)

Senaste CI (2026-06-06, push `9265b522`):

- [x] **CI röd** — [run 27055421482](https://github.com/arpi09/grocery-manager/actions/runs/27055421482): job `quality` → `npm run lint` fail. `wrapped.service.ts`: oanvänd `startOfMonth`; `rapport/[month]/+page.svelte`: oanvänd `locale`. Fixa och pusha innan deploy.
- [ ] Migration 0030 ej applicerad → Grannskafferiet `/dela` faller.
- [ ] Cron-workflow ej på `master` → ingen automatisk månadsaggregering.
- [ ] `CRON_SECRET` / `PRODUCTION_URL` saknas i GitHub → cron failar tyst i schedule.

---

*Skapad jun 2026 — growth wave v0.*
