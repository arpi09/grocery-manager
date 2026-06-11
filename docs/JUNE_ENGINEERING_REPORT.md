# Juni Engineering Report — Skaffu / home-pantry

*Rapporteringsperiod: 2026-06-01 → 2026-06-11 (idag). Källor: `git log`, `gh pr list`, `gh run list --workflow=deploy.yml`, docs, `private/AGENT_STATUS.md`, agent-transcripts (648 filer med aktivitet i perioden).*

**Språk:** Svenska narrativ; tekniska referenser på engelska där det är standard.

**Viktig disclaimer:** PMF-siffror i `/admin` är **inte** exporterade till denna rapport — [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) är i stort sett tom. All användningsdata nedan är antingen strukturell (events/deploy) eller ärligt markerad som gap.

---

## Sammanfattning i siffror

| Metric | Värde | Källa / konfidens |
|--------|-------|-------------------|
| Commits på `master`-linjen | **435** | `git rev-list --count --since=2026-06-01` |
| Aktiva commit-dagar | **11/11** | Ingen ledig dag i juni hittills |
| Mergade PRs | **37** (#1–#37) | `gh pr list --state merged` |
| `feat`-commits (non-merge) | **~67** | `git log --grep=feat` |
| Deploy workflow-körningar | **98** | `deploy.yml` jun 1–11 |
| Lyckade deploy-körningar | **31** (31,6 %) | samma |
| Misslyckade deploy-körningar | **56** | samma |
| Avbrutna deploy-körningar | **11** | samma |
| **Unika prod-SHAs** (grön Firebase deploy) | **30** | Dedupe på `headSha` |
| Senaste gröna prod-SHA | **`c3aadf5f`** (2026-06-10 19:00 UTC) | [run 27299239492](https://github.com/arpi09/grocery-manager/actions/runs/27299239492) |
| Lokal `HEAD` (ej deployad) | **`89b27ce8`** + dirty working tree | `git status` 2026-06-11 |
| Agent-transcript-filer (jun-aktivitet) | **~648** | `LastWriteTime >= 2026-06-01` |

---

## 1. Features completed

Levererat arbete grupperat efter produktkategori. Datum = primär merge/ship-dag; SHAs = representativa commits.

### Growth experiments

| Datum | Commits / PR | Sammanfattning | Användarpåverkan |
|-------|--------------|----------------|------------------|
| 2026-06-06 | `9265b522`, `75f44ca8`, `9ef760bc` | **Growth wave v0:** Wrapped (`/statistik/wrapped`), Skaffurapport (`/rapport/YYYY-MM`), Grannskafferiet v0 (dela-länk `/dela/[token]`, dela som bild), gamification-hub | Delningsbara månadssammanfattningar; viral loop *möjlig* men kräver aktiverade hushåll — gate ≥50 hushåll för publik rapport-PR |
| 2026-06-09 | `4d680c2a`, `58e3342c` | Expiring share card för social; eat-first share actions på `/hem` | Enklare att dela utgående varor utanför appen |
| 2026-06-10 | `2dfadcc7`, `cb02fc1f`, `62f7c85e` | Facebook page assets; admin marketing campaigns; LinkedIn OAuth publish queue | Ägare kan posta growth-innehåll från `/admin` — **inte** slutanvändarfeature |
| 2026-06-11 | `4f8b5621` | [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) — strategidokument, W4 scope | Ingen direkt prod-effekt; klargör att acquisition > karta-polish |

### Onboarding

| Datum | Commits / PR | Sammanfattning | Användarpåverkan |
|-------|--------------|----------------|------------------|
| 2026-06-01–02 | `0e6b190e`, `5818a744`, `1a14a787`, `92cebfcc` | Förbättrad onboarding; 5-stegs guide → kortare fast-start scan; fullscreen mobil | Lägre friktion till första scan — TTV-mål <3 min |
| 2026-06-04–05 | PR #5, #13, #22, `46c3c9df`, `ba8bce29` | Photo-first onboarding (F2); celebration; onboarding v3 med embedded scan + page hints | Registrering → scan/kvitto snabbare; fler `onboarding_completed`-events |
| 2026-06-07 | `ba8bce29`, `eecb668c`, `7a8ddd1c` | **Binary activation:** kvitto *eller* scan som enda väg; PWA celebration | Tydligare aktiveringsmoment; färre modal-dead-ends |
| 2026-06-08 | `7031f1be`, `365ff8a4`, PR #37 | Holistic home hub; scan defaults; förenklad top-level scan entry | Ny användare landar på meningsfull `/hem` + `/scan` utan hub-fälla |

### Grannskafferiet

| Datum | Commits / PR | Sammanfattning | Användarpåverkan |
|-------|--------------|----------------|------------------|
| 2026-06-06 | `9265b522` | **v0:** token-länk, snapshot read-only, 48 h TTL, `noindex` | Dela utgående lista utan konto — acquisition *begränsad* (ingen SEO) |
| 2026-06-10 | `404f2bba`, `e2a29ed6`, `c3aadf5f` | **v1.0–v1.2 + v2a–v2c:** geo opt-in, nearby feed, report/block, MapLibre `/grannskafferiet`, nearby push, Pro 2 km radie, admin reports | Retention/nätverk för opt-in-användare; **inte** acquisition före density-gate (≥5–10 delningar/område) |
| 2026-06-11 | `7d3336ac`, `4f8b5621`, `89b27ce8` | iOS toggle-fix; Mer-meny → Grannskafferiet; growth-wave E2E | **Lokal/ej prod** — deploy fail 2026-06-11 |

### Nearby sharing

| Datum | Commits | Sammanfattning | Användarpåverkan |
|-------|---------|----------------|------------------|
| 2026-06-10 | `404f2bba`, migrations `0038`–`0040` | Opt-in grov plats (~111 m), jittered map coords, nearby API | Integritetsskyddad discovery inom 500 m (free) / 2 km (Pro) |
| 2026-06-10 | `c3aadf5f` | Nearby push (gratis, opt-in), Pro TTL 72 h för sharers | Push när någon nära delar — kräver web push + plats + opt-in |
| 2026-06-11 | W4 (`Toggle.svelte`, `NearbySharingSettingsPanel.svelte`) | iOS Safari: label-tap på toggle + `$effect` sync | **Kritisk bugfix** — utan denna fastnar opt-in på iPhone |

### Analytics

| Datum | Commits | Sammanfattning | Användarpåverkan |
|-------|---------|----------------|------------------|
| 2026-06-01 | `aa29b979`, `b84500c6`, `c901c0e1` | Hero A/B funnel; veckovis PMF digest e-post; admin AI usage view | Ägare ser trends — slutanvändare: cookie consent B |
| 2026-06-05 | PR #33, `f6aed780` | In-app PMF survey (Track D) | Feedback-loop utan att lämna appen |
| 2026-06-07 | `2ff968c6`–`f1ec51ae`, `05ed8464`, `21487cc5`, `c6333cee` | First-party behavior schema + beacon; nightly rollup cron; admin decisions/cohort/CSV export | **Stor admin-investering** — 0 direkt användarvärde tills beslut fattas på data |
| 2026-06-07 | `b73c67ee` | Eat-first week view + PMF events (P3) | Bättre veckovy + mätbarhet |

### AI

| Datum | Commits | Sammanfattning | Användarpåverkan |
|-------|---------|----------------|------------------|
| 2026-06-01–02 | `7be95852`, `c45df5dd`, `401b523a`, `ec23ed2c` | Kvitto plats-gissning; foto-runda; receipt autopilot v1; auto-expired tab | Snabbare lagerfyllning; färre manuella steg |
| 2026-06-05 | PR #30, `0effc5e1` | Photo AI zone detection (F4) | Foto-runda gissar kyl/frys/skafferi |
| 2026-06-07 | `c917ef15`, `ceb6ca1c` | Recipe OpenAI strict schema fix; Kivra forward MVP | Prod-stabilitet för recept; experimentell kvitto-forward |
| 2026-06-09 | `450a9b4c`, `0d3cdc33` | Photo-round P2: expiry, units, validation, high-detail vision, client image prep | Bättre foto-till-lager kvalitet |

**Övrigt värt att nämna (korsar kategorier):**

- **2026-06-01:** skaffu.com live (`29a938ac`), rebrand (`3284d9c2`), site-wide SEO, Resend prod (`c03a9565`)
- **2026-06-02:** Stripe Checkout test mode (PR #1 `59676729`)
- **2026-06-08:** Unified 4-tab nav (`32e620e1`), pantry sync Fas 5 (`e341e10c`, `c90d05ae`), prod hotfix `/hem` 500 (`4e6d59c8`, `2b813b41`)
- **2026-06-07:** CI/CD hardening (`dd7117cc`, `08527c58`), E2E 3-shard (`3692a401`)

---

## 2. Features deployed

### Prod reach

| Fält | Värde |
|------|-------|
| Plattform | Firebase App Hosting → [skaffu.com](https://skaffu.com) |
| Deploy-kanal | Manuell GitHub Actions **Deploy to production** ([`DEPLOY.md`](./DEPLOY.md)) — ingen auto-deploy |
| Unika prod-releases (jun) | **30 SHA** |
| Senaste verifierade prod | **`c3aadf5f`** — Grannskafferiet v2a–v2c ship (2026-06-10) |
| Prod vs lokal master | **Gap ~3 commits** (`7d3336ac`, `4f8b5621`, `89b27ce8`) + **5 modified files** ej committade |

**OBS:** `private/AGENT_STATUS.md` anger prod SHA `86d1d97d` (2026-06-08) — **föråldrad**. GitHub Actions visar lyckade deploys till `c3aadf5f` den 10 juni. Coordinator bör synka statusfil.

### Deploy-timeline (unika gröna SHA, kronologisk)

```
2026-06-05  90351762 → 8263b287   (6 releases)  UX/onboarding/PR-wave
2026-06-06  f0b5608e → 6768033e   (3)           Pre-growth + polish
2026-06-07  c917ef15 → 3b6d1220   (7)           Analytics + CI hardening
2026-06-08  d555eac4 → 86d1d97d   (5)           Nav unification + hotfixes
2026-06-09  6fdbc13b → 39b4bad4   (5)           Photo-round P2 + growth cards
2026-06-10  6a7544aa → c3aadf5f   (4)           Grannskafferiet v1–v2
2026-06-11  7d3336ac              (0 grön)      iOS toggle — E2E/deploy fail
```

### Frekvens

| Metric | Beräkning |
|--------|-----------|
| Prod-releases / vecka | 30 ÷ 1,6 veckor ≈ **19 SHA/vecka** (mycket högt — inkl. hotfix-kedjor) |
| Deploy-försök / vecka | 98 ÷ 1,6 ≈ **61 försök/vecka** |
| Success rate | **31,6 %** — majoriteten av körningar är retry/e2e-gate-fail |

### Misslyckade deploys och incidenter

| Datum | Incident | SHA / run | Utfall |
|-------|----------|-----------|--------|
| 2026-06-08 morgon | **Prod `/hem` 500** — `last_confirmed_at` null | `4e6d59c8` hotfix | Forward fix, inte rollback |
| 2026-06-08 | Massiv deploy-fail cluster (15+ failures) | E2E + touch target + CI auth smoke | `d555eac4` unblock auth smoke |
| 2026-06-07 kväll | Post-deploy smoke wiring | `dd7117cc`–`3b6d1220` | Flera failures innan pipeline stabil |
| 2026-06-10 eftermiddag | Grannskafferiet v1 deploy-kedja | `404f2bba`, `e2a29ed6` | 5 failures → fix → `c3aadf5f` success |
| 2026-06-11 | W4 toggle deploy | `7d3336ac` | **2 failures** (pågående vid rapport) |

**Rollbacks:** Inga dokumenterade Firebase rollbacks i perioden. Strategi = forward fix + ny deploy.

### Release notes

Ingen formell `CHANGELOG.md` eller GitHub Releases. Närmaste:

- [`LAUNCH_CHECKLIST_GROWTH_WAVE.md`](./LAUNCH_CHECKLIST_GROWTH_WAVE.md) — growth wave smoke
- [`GRANNSKAFFERIET_V1.md`](./GRANNSKAFFERIET_V1.md) — v1 spec + shipped status
- [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) — strategi jun 2026

---

## 3. Agent utilization

### Metodologi

| Signal | Antagande | Konfidens |
|--------|-----------|-----------|
| Agent-transcript `.jsonl` med `LastWriteTime >= 2026-06-01` | ~1 fil ≈ 1 Cursor-session (kan inkl. subagents) | Medel |
| Medel sessionslängd | 25–45 min (heuristik från coordinator-docs + commit burst-mönster) | Låg–medel |
| `private/AGENT_STATUS.md` | Live WIP/slots | Hög (punkt-in-time) |
| `SPAWN_BUDGET.md`, `MERGE_QUEUE.md` | **Saknas lokalt** — endast `AGENT_STATUS.md` | Gap |

### Uppskattad total usage

| Metric | Uppskattning |
|--------|--------------|
| Transcript-filer (jun) | **648** |
| Unika coordinator + implementation sessioner (justerat för subagents) | **~350–450** |
| **Uppskattade agent-timmar** | **~150–220 h** (648 × 20 min konservativt → 216 h) |
| Konfidensintervall | ±40 % — ingen token/faktura-data i repo |

### Kategorier (infererat från commits, docs, transcripts per dag)

| Kategori | Andel (uppsk.) | Bevis |
|----------|----------------|-------|
| Implementation / feature | ~55 % | 67 feat-commits, WIP W1–W4 |
| E2E / CI / deploy | ~25 % | 98 deploy runs, massiva `fix(e2e)` |
| Coordinator / planning | ~10 % | `CURSOR_COORDINATOR.md`, AGENT_STATUS resets |
| dev-runtime | ~5 % | `home-pantry-dev` worktree, `dev:watch` |
| Governance (security, pipeline) | ~5 % | `c9f12423`, deploy hardening |

### Worktrees & aktiva agenter

| Resurs | Status jun 2026 |
|--------|-----------------|
| Huvud-worktree | Feature branches → merge `master` |
| `home-pantry-dev` | dev-runtime, port 5173, auto-restart |
| WIP-disciplin | Max 3 feature branches (coordinator-v2) |
| Aktiv slot (2026-06-11) | **W4** — nearby sharing toggle |
| Spawn budget | **Ej loggbar** — `SPAWN_BUDGET.md` saknas |

### Transcript-aktivitet per dag

| Datum | Filer | Commits (dag) | Tolkning |
|-------|-------|---------------|----------|
| 06-01 | 72 | ~40 | skaffu.com launch |
| 06-02 | **162** | ~80 | Största agent-dagen |
| 06-03 | 51 | ~45 | UX P0/P1 launch |
| 06-04 | 74 | ~55 | PR-merge burst (#5–#20) |
| 06-05 | 68 | ~40 | Tracks A–D |
| 06-06 | 37 | ~25 | Growth wave |
| 06-07 | 61 | ~70 | Analytics + CI |
| 06-08 | 67 | ~45 | Nav + prod incident |
| 06-09 | 26 | ~30 | Photo P2 + growth |
| 06-10 | 19 | ~15 | Grannskafferiet |
| 06-11 | 11 | ~4 | W4 fix |

**Mönster:** Agent-aktivitet korrelerar med commit-volym men **inte 1:1** — juni 2 har flest transcripts trots att juni 7 har fler commits (mer autonom retry/E2E).

---

## 4. Top 10 most expensive activities

Rankat efter agent-tid + koordinering + risk. *Expensive ≠ värdelöst.*

| # | Aktivitet | Varför dyrt | Outcome | ROI-bedömning |
|---|-----------|-------------|---------|---------------|
| 1 | **CI/CD deploy pipeline hardening** (`dd7117cc`–`3b6d1220`, jun 7–8) | 20+ deploy failures, smoke wiring, SHA gates, 3-shard E2E | Stabilare G3 gate | **Medel** — infrastruktur nödvändig men brände ~2 dagar |
| 2 | **Grannskafferiet v1→v2 ship** (`404f2bba`→`c3aadf5f`, jun 10) | Migrationer 0038–0040, MapLibre, geo privacy, 5 deploy fails | Full nearby stack i prod | **Medel-låg** — retention feature före acquisition proof |
| 3 | **Unified nav + holistic UX** (`32e620e1`, `7031f1be`, jun 8) | Hot zone `/hem`, `/scan`, all E2E | Tydligare IA | **Hög** — påverkar varje session |
| 4 | **First-party analytics + admin panels** (`2ff968c6`–`c6333cee`, jun 7) | Schema, cron, 6+ admin views | Mätbarhet | **Låg kort sikt** — admin polish utan PMF-bevis |
| 5 | **E2E stabilization waves** (löpande, särskilt jun 3–5, 8) | 100+ `fix(e2e)` commits, Playwright flakes | Grön deploy | **Medel** — tax on velocity |
| 6 | **Onboarding iteration v1→v3→binary** (jun 1–7) | 4 redesigns, page hints, modal stack bugs | Snabbare TTV | **Hög** — core activation |
| 7 | **Prod `/hem` 500 incident** (jun 8) | Prod broken, multiple deploy attempts | Hotfix `2b813b41` | **Hög** (firefighting) — kostnad i förtroende |
| 8 | **Photo-round + AI vision P1/P2** (`c45df5dd`→`0d3cdc33`) | OpenAI schema, body limits, vision costs | Killer scan path | **Hög** — differentierande |
| 9 | **37 PR merge wave** (jun 4–5) | Serial review, conflict risk | Stor UX batch | **Medel-hög** |
| 10 | **Marketing/admin LinkedIn + SEO guides** (`ad63eb83`, `cb02fc1f`, jun 7–10) | OAuth, generators, DB guides | Acquisition tooling | **Okänd** — ej kopplat till konverteringsdata |

---

## 5. Top 10 highest ROI activities

| # | Aktivitet | Effort | Värde | Varför det mattered |
|---|-----------|--------|-------|---------------------|
| 1 | **skaffu.com go-live + rebrand** (`29a938ac`, `3284d9c2`) | Medel | **Kritiskt** | Credibility; all marketing pekar hit |
| 2 | **Binary onboarding activation** (`ba8bce29`) | Medel | **Hög** | Tydlig “kvitto eller scan” — mätbar activation |
| 3 | **Receipt autopilot + foto-runda** (`401b523a`, `c45df5dd`) | Hög | **Hög** | Differentierande vs manuella pantry-appar |
| 4 | **Unified 4-tab nav** (`32e620e1`) | Hög | **Hög** | Minskar cognitive load på mobil |
| 5 | **Eat-first hero + hem redesign** (`11704a52`, `7031f1be`) | Medel | **Hög** | Daily value loop — “vad går ut?” |
| 6 | **Email prod + expiry reminders** (`c03a9565`, `b84500c6`) | Låg | **Medel-hög** | Retention utan app-open |
| 7 | **In-app PMF survey** (PR #33) | Låg | **Medel** | Direkt signal — om den besvaras |
| 8 | **Grannskafferiet v0 dela-länk** (`9265b522`) | Medel | **Medel** | Hybrid launch utan tom karta |
| 9 | **Stripe test checkout** (PR #1) | Medel | **Medel** (future) | Betalväg redo — medvetet ej pushad |
| 10 | **Bug audit + P0=0** (`docs/BUG_AUDIT_2026-05.md`, W1) | Medel | **Medel** | Prod-stabilitet före soft beta |

---

## 6. Product Progress

### Användarförbättringar sedan 2026-06-01

- **Varumärke & domän:** Home Pantry → Skaffu på skaffu.com
- **Aktivering:** Scan-first, kvitto-PDF, foto-runda, binary onboarding
- **Daglig loop:** Eat-first på `/hem`, veckoritual, push (expiry + handla idag)
- **Hushåll:** Sync/staleness, invite prompt, pantry bridge till inköp
- **Delning:** Wrapped, Skaffurapport, Grannskafferiet v0→v2 (länk, karta, nearby push)
- **Trygghet:** Email verification, cookie consent, report/block på shares

### Nya capabilities

| Capability | Prod? | Notes |
|------------|-------|-------|
| Grannskafferiet karta | Ja (`c3aadf5f`) | Kräver opt-in + density för värde |
| Nearby push | Ja | Gratis; opt-in |
| Admin cohort/CSV export | Ja | Ägare only |
| LinkedIn publish från admin | Ja | Growth ops |
| Kivra forward MVP | Ja | Experimentell |
| iOS nearby toggle fix | **Nej** | W4 lokal |

### Usage

**Gap — ärligt:** [`PMF_METRICS_LOG.md`](./PMF_METRICS_LOG.md) baseline tom. [`ROADMAP.md`](./ROADMAP.md) säger uttryckligen “inga påhittade siffror”. Ingen D30-retention, aktivering % eller hushållantal i denna rapport.

### Overbuilt features (kritisk bedömning)

| Feature | Varför overbuilt *nu* |
|---------|------------------------|
| Admin analytics/decisions/AI insights | Fler dashboards än beslut baserade på data |
| Grannskafferiet v2 före density | Hela geo+push+map stack — retention utan supply |
| SEO guides generator pipeline | Acquisition kanal med okänd konvertering |
| LinkedIn OAuth queue | Ops tooling före PMF |
| 3-shard E2E + mandatory deploy E2E | Rätt för kvalitet — **dyrt** för solo/small team velocity |

---

## 7. Growth & Acquisition

Strategi dokumenterad i [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) (jun 2026).

### Per kanal

| Kanal | Status jun | Styrka | Svaghet |
|-------|------------|--------|---------|
| **Onboarding** | Shipped (binary) | Tydlig activation path | Konto-vägg före värde |
| **Grannskafferiet** | v2 i prod | Differentiering vs OLIO | Login + opt-in + density-gate |
| **Nearby sharing** | Prod (toggle-bug på iOS) | Automatisk discovery | iOS W4 ej deployad |
| **Public discovery** | SEO meta, guides, landing A/B | skaffu.com live | Låg pantry-sökintent SE |
| **Virality** | Wrapped, dela-bild, `/dela/[token]` | Delningsbar assets | Kräver aktiverat lager |

### Starkaste acquisition/retention

1. **Retention:** Eat-first + push + veckoritual (daily habit)
2. **Acquisition story (teoretisk):** Hybrid “lager → utgång → dela lokalt”
3. **Warm virality:** Wrapped/dela-bild > kall LinkedIn

### Största bottleneck

**Acquisition >> activation >> retention** (enligt egen strategi).

- Kall trafik konverterar dåligt ([`LINKEDIN_LAUNCH.md`](./LINKEDIN_LAUNCH.md))
- Soft beta ([`BETA_LAUNCH_SOFT.md`](./BETA_LAUNCH_SOFT.md)) väntar på prod=master — **fortfarande gap** (W4)
- PMF **ej bevisad** — retention-optimering är prematur utan funnel

---

## 8. Deployment Velocity

| Metric | Värde |
|--------|-------|
| Kalenderdagar | 11 |
| Unika prod-SHAs | 30 → **~2,7 releases/dag** |
| `feat` shipped / vecka | ~67 ÷ 1,6 ≈ **42 feat/vecka** (commit-baserat) |
| Deploy success rate | 31,6 % |
| Median lead time (commit → prod) | **Timmar samma dag** vid grön kedja; **1–2 dagar** vid fail clusters |
| Longest deploy drought | Ingen — daily activity |

### Bottlenecks

1. **Mandatory E2E i deploy.yml** — rätt säkerhet, hög retry-kostnad
2. **Manuell deploy trigger** — ingen continuous delivery
3. **Touch target / a11y / i18n UTF-8 regressions** — återkommande deploy blockers
4. **Coordinator prod smoke** — ibland skipped (`86d1d97d` ej re-smoked enligt AGENT_STATUS)
5. **Single maintainer** — 37 PRs all by `arpi09`

---

## 9. Ultra Analysis — agents ≠ value

### Kapacitetsanvändning

- **648 agent-sessioner** på **435 commits** ≈ **1,5 sessioner/commit** — hög AI-intensitet
- Juni 2 peak (162 transcripts) levererade skaffu.com + kärnfeatures — **bra koppling**
- Juni 7–8: många sessioner → CI/deploy fixes > user-visible features — **mis-match**
- Juni 10–11: färre sessioner men Grannskafferiet v2 — **effektivare focus**

### Tidigare ships?

**Ja, delvis.** Utan mandatory E2E deploy gate hade ~20 prod-SHAs nått prod 1–2 dagar tidigare (jun 7–8). **Men:** `/hem` 500 hade kunnat nå prod utan gate — netto oklart.

**Counterfactual:** WIP 3 + coordinator hade kunnat **pausa** Grannskafferiet v2 tills soft beta PMF baseline fylld — sparat ~3–5 agent-dagar.

### Värde levererad vs waste

| Levererat värde | Waste / debt |
|-----------------|--------------|
| skaffu.com, onboarding, eat-first | Admin analytics utan beslut |
| Foto-runda + kvitto | 56 failed deploy runs (retry tax) |
| Nav unification | iOS toggle shipped 3 gånger (jun 10–11) |
| PMF instrumentation | Tom `PMF_METRICS_LOG` — mät utan feedback loop |

### Hypotes: fler agenter = mer värde?

**Nej, bevisat falskt i jun 8-incidenten.** Coordinator “foreground deploy” + parallella retries **ökade** fail rate utan snabbare green. [`coordinator-v2.mdc`](../.cursor/rules/coordinator-v2.mdc) reset jun 9 och jun 11 bekräftar: **WIP 1 (W4 only), no spawn without budget.**

**Rekommendation:** Survival mode (WIP=1) tills PMF baseline fylld; deploy max 1–2 gånger/dag; feature freeze on geo/map.

---

## 10. CTO Summary

| Fråga | Svar |
|-------|------|
| **Största win** | **skaffu.com live + komplett activation stack** (scan/kvitto/foto/onboarding) på 11 dagar — från sidoprojekt till deploybar produkt |
| **Största mistake** | **Bygga Grannskafferiet v1–v2 + admin analytics före acquisition baseline** — engineering excellence utan bevisad funnel |
| **Största technical improvement** | **Deploy pipeline hardening** (E2E shard, post-deploy smoke, SHA gate) — 31,6 % success är fortfarande lågt men bättre än prod-500 |
| **Största product improvement** | **Unified nav + eat-first hem** — daily habit surface |
| **Growth lesson** | **Karta är retention, inte acquisition** — egen [`GROWTH_STRATEGY.md`](./GROWTH_STRATEGY.md) skriver det; engineering levererade karta ändå före density |
| **Största risk** | **Prod–master gap + iOS nearby toggle** — användare kan inte opt-in på iPhone; soft beta DM riskerar förtroende; PMF fortfarande obevisad |

---

## Bilaga A — Lokal/ej deployad work (2026-06-11)

| SHA | Beskrivning | Status |
|-----|-------------|--------|
| `7d3336ac` | iOS settings toggle + Mer → Grannskafferiet | Pushed; deploy **fail** |
| `4f8b5621` | GROWTH_STRATEGY.md + toggle fix | Pushed; deploy **fail** |
| `89b27ce8` | growth-wave E2E alignment | Pushed; deploy **fail** |
| *(working tree)* | `Toggle.svelte`, `NearbySharingSettingsPanel.svelte`, `NotificationSettingsPanel.svelte`, `admin/+page.svelte`, `e2e/growth-wave.spec.ts` | **Modified, not committed** |

---

## Bilaga B — Mergade PRs (komplett lista)

#1 Stripe · #2 UX gamification · #3 i18n photo · #4 e2e recipe · #5 scan onboarding · #6 scan shell · #7 og:image · #8 UX P0 · #9 UX P1 · #10 UX P2 · #11 inventory sort · #12 push toggle · #13 onboarding celebration · #14 post-register /hem · #15 recipe modal · #16 news timeline · #17 security audit · #18 toasts · #19 EatFirst toast · #20 email verify · #21 P0 bugs · #22 onboarding v3 · #23 UX polish · #24 e2e hints · #25 release e2e · #26 CI split · #27 Pro path · #28 scroll marketing · #29 Node 24 · #30 photo AI F4 · #31 Track A UX · #32 Track C marketing · #33 PMF survey · #34 onboarding cancel · #35 toasts · #36 code quality · #37 scan entry

---

## Bilaga C — Data gaps (ärligt)

1. **PMF metrics** — ej exporterade; admin dashboard ej läst i denna session
2. **`SPAWN_BUDGET.md` / `MERGE_QUEUE.md`** — saknas lokalt
3. **Firebase App Hosting logs** — ej analyserade
4. **Prod smoke on latest SHA** — ej verifierad efter `c3aadf5f`
5. **Användarantal, D7/D30** — medvetet utelämnade (inga påhittade siffror)

---

*Genererad 2026-06-11. Nästa uppdatering: efter W4 deploy + PMF vecka 1 baseline ifylld.*
