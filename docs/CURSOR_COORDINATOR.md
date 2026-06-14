# Cursor — koordinator och agenter (Home Pantry)

*Publik guide för nya Cursor-inloggningar och coordinator-agenter. Senast: 2026-05-31.*

Denna fil finns i git. Operativ status, kostnadssiffror och spawn-logg ligger i gitignorerad [`private/`](../private/) — kopiera från backup vid ny maskin (finns inte på GitHub).

---

## Agent-ingång (INDEX + skills)

Alla agenter (coordinator och implementation) börjar med [INDEX.md](./INDEX.md), [CURRENT_REALITY.md](./CURRENT_REALITY.md) och [RELEASE_MODEL.md](./RELEASE_MODEL.md) — prod SHA, nav, release policy och tier.

| Skill (`.cursor/skills/`) | När |
|---------------------------|-----|
| `skaffu-deploy-verify` | deploy, prod, release, rollback |
| `skaffu-core-loop-change` | hem, inkop, onboarding, nav, household |
| `skaffu-feature-flag-rollout` | Kill switches, Tier C, infra env — **not** post-merge activation ([RELEASE_MODEL.md](./RELEASE_MODEL.md)) |

Kärnloop-regel (alwaysApply): `.cursor/rules/skaffu-core-loop.mdc`.

Coordinator planning-regel: `.cursor/rules/coordinator-planning.mdc` — planning table (`Task | Execution Mode | Owner | Dependency`), fyra execution modes.

---

## Coordinator planning

Coordinator-planer använder fyrkolumnstabellen och fyra execution modes. Minimera PO-koordinering — anta aldrig att användaren startar en separat agent.

### Execution modes

| Mode | Who runs | When to use |
|------|----------|-------------|
| `COORDINATOR_AGENT` | Subagent/Task spawnad av coordinator | **Default** — kod, tester, docs, audits, refactors, release-planering |
| `COORDINATOR_LOCAL` | Coordinator i nuvarande chat, lokala verktyg | Små orchestration-steg (status, `gh run watch`, prod SHA efter deploy) |
| `USER_LOCAL` | Product owner (fysisk/manuell handling) | Turnstile, mobilkamera, App Store, fysisk enhet, manuell betalning, externa konton |
| `BLOCKED` | Ingen än | Deploy-lås, secrets, beslut, externt beroende |

### Planning rule

**Från och med nu:** varje coordinator-plan (`CreatePlan`) måste ha denna **fyrkolumns** uppgiftstabell (eller per-todo med alla fyra fält):

| Task | Execution Mode | Owner | Dependency |
|------|----------------|-------|------------|
| … | `COORDINATOR_AGENT` | e2e | none |
| … | `COORDINATOR_LOCAL` | coordinator | G0 på branch |
| … | `USER_LOCAL` | user | none |
| … | `BLOCKED` | — | deploy grön |

- **Owner:** `coordinator`, namngiven agent/branch-label, `user`, eller `—` vid `BLOCKED`
- **Dependency:** `none`, annan uppgift i planen, eller externt beroende (deploy, secrets, beslut)
- **Default:** implementerbar arbete → `COORDINATOR_AGENT`

Se [`.cursor/rules/coordinator-planning.mdc`](../.cursor/rules/coordinator-planning.mdc).

- Coordinator väljer mode **per uppgift** före körning
- `BLOCKED` → ange beroende uttryckligen i planen och `private/AGENT_STATUS.md`
- Prod SHA-uppdateringar → alltid `COORDINATOR_LOCAL` (post-deploy coordinator-steg)
- Sessionstart → [CURRENT_REALITY.md](./CURRENT_REALITY.md) + `private/AGENT_STATUS.md`

---

## Prioritetsordning

1. MASTER == PROD
2. Production Readiness
3. Founder Acceptance Test
4. Första riktiga hushåll
5. Kodkvalitet / Engineering Health
6. Positionering / Landing Page

Inte Cloud-strategi, dispatch eller extra orchestration.

---

## Cursor hooks (minimal för hastighet)

Projekt-hooks i [`.cursor/hooks.json`](../.cursor/hooks.json) är avsiktligt minimala — ingen `permission: ask`, inga hooks på varje filredigering.

| Policy | Var den lever |
|--------|----------------|
| Tier C / frozen zones | `skaffu-core-loop.mdc`, `skaffu-frozen-zones.mdc` |
| CURRENT_REALITY vid nav/deploy | `skaffu-reality-sync.mdc` + skill `skaffu-core-loop-change` |
| Release policy (master=truth) | [RELEASE_MODEL.md](./RELEASE_MODEL.md) — flags merge with feature, deploy publishes |
| Deploy / G0 / rollback | `deploy-safety.mdc`, `delivery-done.mdc` + skill `skaffu-deploy-verify` |

**Enda kvarvarande hook:** `beforeShellExecution` med matcher `gh workflow run deploy` — tyst `allow` + `agent_message` (ingen modal). Påminner agenten om G0/CI/rollback utan att blockera.

---

## Vad är coordinator?

**Coordinator** är den agent (chat) som äger leveransflödet: prioritering, WIP, spawn av andra agenter, merge/deploy-beslut och uppdatering av `private/`-statusfiler när de finns lokalt.

| Roll | Uppgift | Spawnar andra? |
|------|---------|----------------|
| **Coordinator** | Merge queue, WIP, spawn-proposal, G0 före push, security före deploy | Ja — endast coordinator |
| **Implementation / feature** | Kod, tester, refaktor inom tilldelad zon | Nej — inga peers |
| **dev-runtime** | Håller `dev:watch` igång, `dev:health` | Nej (underhåll) |
| **e2e** | Playwright i `e2e/`, worktree enligt `AGENTS-E2E.md` | Nej |
| **Governance** (security, complexity, dependency, pipeline) | Read-only skanningar, rapporter i `private/` | Nej |

Charter-filer i repot: [`AGENTS-DEV-RUNTIME.md`](../AGENTS-DEV-RUNTIME.md), [`AGENTS-E2E.md`](../AGENTS-E2E.md). Cursor-agentdefinitioner: [`.cursor/agents/`](../.cursor/agents/).

---

## När coordinator delegerar vs kodar själv

**Coordinator kodar själv** när arbetet är litet, tydligt och inte krockar med WIP eller hot zones — t.ex. en rad fix, doc-uppdatering, snabb smoke enligt checklista, eller svar på en ren fråga.

**Coordinator delegerar (spawn)** när:

- Uppgiften är större än en fokuserad session (flera filer, feature-slice, migration).
- En **hot zone** redan ägs av en annan agent (se nedan).
- WIP har ledig slot **och** spawn-proposal är ifylld (utom undantag nedan).
- Read-only **governance**-skanning ska köras (security före deploy, complexity, dependencies).
- **E2E** ska köras som batch **efter feature-freeze**, inte mitt i parallella features.

**Coordinator ska inte** öppna parallella `explore` / `shell` / `generalPurpose`-bursts under aktiv WIP 3-disciplin.

---

## Agent-typer i repot

### Cursor-agentfiler (`.cursor/agents/`)

| Agent | Fil | Syfte |
|-------|-----|--------|
| dev-runtime | `dev-runtime.md` | Dev-server, auto-restart, port 5173 |
| e2e | `e2e.md` | Playwright, `npm run test:e2e` |

### Regler (`.cursor/rules/` — requestable)

| Regel | Syfte |
|-------|--------|
| `coordinator-v2.mdc` | Merge queue, WIP 3, push/deploy, security-lifecycle |
| `coordinator-personal-cost-mode.mdc` | Shipped value, WIP-kapacitet, cadence (detaljer i `private/`) |
| `coordinator-spawn-budget.mdc` | Proposal före varje spawn |
| `dev-server-auto-restart.mdc` | Be aldrig användaren starta om dev manuellt |
| `delivery-done.mdc` | Agent-owned verification; ingen prod-smoke som användarläxa |
| `delivery-metrics.mdc` | Uppdatera metrics efter merge |
| `security-agent.mdc` | Read-only security, deploy-gate |
| `pipeline-release-agent.mdc` | CI/CD, rollback |
| `dependency-health-agent.mdc` | Dependencies |
| `complexity-agent.mdc` | Komplexitet/hotspots |

### Subagenter (Cursor Task-verktyg)

Coordinator kan anropa begränsade typer, t.ex. `explore`, `shell`, `generalPurpose`, `ci-investigator`, `best-of-n-runner`, `dev-runtime`, `e2e` — enligt samma WIP- och spawn-regler som manuella agenter. **Implementation-agenter får inte** själva spawna subagenter.

---

## WIP 3 och operativa regler

**WIP 3 (aktiv disciplin):** max **3 feature branches** (`feat/*`, `fix/*`) med en implementation-agent vardera. **dev-runtime** räknas inte in i implementation-taket.

| Regel | Innebörd |
|-------|----------|
| **master = merge** | Push till `master` kör snabb **CI** (~3–5 min). Prod-deploy via Actions → **Deploy to production** ([`DEPLOY.md`](./DEPLOY.md)). Agenter kodar på `feat/*` / `fix/*`, mergar när G0/CI är grön |
| **Parallella branches** | Upp till 3 aktiva feature/fix-branches; en agent per branch, en hot zone per agent |
| **Inga parallella bursts** | Inte flera `explore`/`shell`/`generalPurpose` samtidigt på samma uppgift eller hot zone |
| **En hot zone = en agent** | t.ex. `src/lib/i18n/`, settings-UI/API, `di.ts`, `db/migrations/` + `init.ts`, `hooks.server.ts`, delad auth/layout |
| **E2E efter freeze** | En avgränsad E2E-batch per vecka när feature-arbetet är fryst — inte XL E2E mitt i sprint |
| **Finish before starting** | Stäng/merge öppet arbete innan ny P1-feature-spawn |
| **Coordinator-only spawn** | Implementation-agenter spawnar inte peers |
| **G0 före push** | `npm run check:locales && npm run check && npm test` (E2E om auth/UI berörts) — se [`CI_CD.md`](./CI_CD.md), [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) |
| **Security före deploy** | Security-agent → `private/SECURITY_REPORT.md` måste vara grön nog för G3 |
| **Definition of done** | Ingen "deployed" / "prod är live" utan **lyckad Deploy to production** för target-SHA + coordinator kör [`PROD_SMOKE.md`](./PROD_SMOKE.md) (agent post-deploy, 5 punkter). Användaren får inte smoke-uppgifter |

**Parallell dev:** implementation på feature-branch i huvud-worktree; **dev-runtime** kör `dev:watch` i worktree `home-pantry-dev` (`npm run dev:start:ai`) så två agenter kan utveckla utan port-krock.

Övriga WIP-slots (när coordinator använder dem): 1 planner (read-only explore), 1 integration (merge/konflikt), 1 governance-skannning — se koordinatorregler; detaljer och experimentlogg i `private/WIP1_TEST_LOG.md`.

**Survival mode (WIP=1):** vid mycket tight budget — max 1 feature-branch + dev-runtime; inga parallella swarms. Aktiveras i coordinator-session, inte i denna fils detaljer.

---

## Merge queue (branch → master → deploy)

1. **Branch:** agent jobbar på `feat/*` eller `fix/*` från senaste `master`.
2. **G0 lokalt:** `npm run check:locales && npm run check && npm test` (+ `test:integration`, `test:e2e` vid behov).
3. **CI grön på branch** (valfritt push till branch för Actions, eller G0 räcker för små fix).
4. **Merge till `master`:** coordinator rebasar/mergar, pushar `origin master`.
5. **CI:** `gh run watch` tills **CI** workflow är grön för merge-SHA (~3–5 min).
6. **Deploy (manuellt):** Actions → **Deploy to production** (eller `gh workflow run deploy.yml`). Vänta tills quality + e2e + deploy är gröna.
7. **Agent smoke:** coordinator (eller e2e-agent) kör [`PROD_SMOKE.md`](./PROD_SMOKE.md) 5-punktslistan på prod efter deploy — **inte** användaren. Grön deploy-E2E täcker lokala resor; prod-check verifierar skarp Turnstile/push.
8. **Rapportera:** deploy-SHA (7 tecken) + smoke utförd — **inte** "deployed" / "prod är live" förrän steg 6–7 lyckats. Säg aldrig "testa på prod" till användaren som homework.

Se [`private/MERGE_QUEUE.md`](../private/MERGE_QUEUE.md) för live-kö när den finns lokalt.

---

## Spawn-proposal (obligatorisk före spawn)

Fyll **innan** ny agent skapas. Full tracking och veckosummering: `private/SPAWN_BUDGET.md` (lokal).

**Undantag utan proposal:** dev-runtime-underhåll; enstaka **P0** fix-agent när prod/CI är röd.

```markdown
### Spawn proposal — [uppgiftsnamn]

- **Expected outcome:** [mätbart, t.ex. "Turnstile smoke OK", "3 E2E gröna"]
- **Priority:** [P0 | P1 | P2]
- **Stop condition:** [när slotten avslutas, t.ex. "merge + G2 grön"]
- **Estimated duration:** [t.ex. 45–90 min]
- **Estimated cost category:** [S | M | L | XL]
- **Expected ROI:** [H | M | L]
- **Files affected:** [sökvägar eller hot zone]
- **Why existing agents cannot do it:** [WIP full / fel skill / blocker / endast dev-runtime]
```

### Kostnadskategorier (relativ storlek, pre-spawn)

| Kategori | Typiskt scope | Coordinator-default |
|----------|---------------|---------------------|
| **S** | En fil, en test, en route | P0-hotfix |
| **M** | En feature-slice, liten refaktor | Föredragen batch |
| **L** | Flera filer, avgränsad E2E-batch, migration | Kräver tydlig ROI + ledig WIP-slot |
| **XL** | Stor explore, parallella swarms, obunden E2E+samma dag | **Gated** — alla måste vara JA |

**XL-gate (alla JA):** affärsvärde (P0/P1/roadmap) · ingen befintlig agent kan göra det (WIP≤3, ownership) · högre prio än merge-kön · stop condition skriven. Annars: dela upp i M/L eller skjut till veckocheckpoint.

**Pausa spawns när:** ingen merge på ≥3 dagar med aktiva agenter · samma blocker ≥48 h utan framsteg · WIP>3 · (kostnadströsklar och OD-gränser — se `private/`, inte här).

Exakta dollar-gränser och vecko-CSV: [`private/ENGINEERING_INTELLIGENCE.md`](../private/ENGINEERING_INTELLIGENCE.md), [`private/SPAWN_BUDGET.md`](../private/SPAWN_BUDGET.md).

---

## Multitask och bakgrundsagenter

| Tillåtet | Förbjudet under WIP 3 |
|----------|------------------------|
| **dev-runtime** i bakgrund (`dev:watch`, `npm run dev:start:ai`) | Parallella implementation-spawns utan proposal |
| En **P0** fix-agent när prod/CI är röd | Multitask-bursts: flera `explore`/`shell`/`generalPurpose` samtidigt |
| En avgränsad agent med tydlig stop condition efter godkänd proposal | Bakgrunds-swarm för att "komma ikapp" samma hot zone |
| Read-only governance med tidsbox | XL explore + parallell feature på samma filer |

**Princip:** shipped value per insats, inte agent-aktivitet. Färre parallella agenter med tydligt utfall slår många halvfärdiga slots.

**Teststrategi:** Alla implementation-, E2E- och governance-agenter ska följa [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) (testing diamond). Feature-agenter äger unit/integration för sin zon; E2E-agenten äger kritiska resor och G2-täckning; integration-agenten verifierar täckning före merge; pipeline- och security-agenterna mappar testlager mot risk (G0–G3). Skapa inte pyramid-tester i blindo — integration är primärlagret, E2E sparsamt men djupt.

---

## Känslig styrning (`private/`)

Följande committas **aldrig** till GitHub. Vid ny Cursor-inlogg eller dator: **kopiera hela `private/` från backup**.

| Fil (exempel) | Innehåll |
|---------------|----------|
| `NEW_CURSOR_AGENT_START.md` | Startguide + första prompt |
| `ENGINEERING_INTELLIGENCE.md` | Hub, cost mode, alerts |
| `SPAWN_BUDGET.md` | Spawn-tracking, dollar-band |
| `AGENT_STATUS.md`, `MERGE_QUEUE.md`, `OWNERSHIP.md` | Live kö och zoner |
| `AI_COST_REPORT.md`, `AI_VALUE_DASHBOARD.md` | Kostnad och ROI |

Starta alltid med [`private/NEW_CURSOR_AGENT_START.md`](../private/NEW_CURSOR_AGENT_START.md) **plus** denna fil.

---

## Cursor-regler (filnamn)

Aktivera eller referera vid behov:

- `.cursor/rules/coordinator-planning.mdc`
- `.cursor/rules/coordinator-v2.mdc`
- `.cursor/rules/coordinator-personal-cost-mode.mdc`
- `.cursor/rules/coordinator-spawn-budget.mdc`
- `.cursor/rules/dev-server-auto-restart.mdc`
- `.cursor/rules/delivery-metrics.mdc`
- `.cursor/rules/security-agent.mdc`
- `.cursor/rules/pipeline-release-agent.mdc`
- `.cursor/rules/dependency-health-agent.mdc`
- `.cursor/rules/complexity-agent.mdc`

---

## Första meddelande till agent (klistra in)

```
Läs och följ:
1) docs/CURSOR_COORDINATOR.md (publik — coordinator, WIP, spawn)
2) private/NEW_CURSOR_AGENT_START.md (lokal — miljö, private/, första uppgifter)

Du är coordinator. Fråga innan commit, push eller spawn. WIP 3 aktiv: max 3 feature branches (feat/*, fix/*), master endast för deploy-merge, inga parallella explore/shell-bursts, E2E efter feature-freeze. Spawn-proposal före varje ny agent (utom dev-runtime / enstaka P0 vid röd CI-prod). Definition of done: grön Deploy to production för target-SHA + du kör PROD_SMOKE (agent post-deploy) — användaren gör inte smoke.
```

---

## Relaterad dokumentation

| Doc | När |
|-----|-----|
| [`CLOUD_AGENT_SETUP.md`](./CLOUD_AGENT_SETUP.md) | **Pausad** — Cloud bootstrap arkiverat; använd coordinator + lokala agenter |
| [`ONBOARDING_DEVELOPER.md`](./ONBOARDING_DEVELOPER.md) | Ny utvecklare (mänsklig) |
| [`CI_CD.md`](./CI_CD.md) | G0–G3, trunk på `master` |
| [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) | Testing diamond, risk, DoD |
| [`E2E.md`](./E2E.md) | Playwright-setup |
| [`PROD_SMOKE.md`](./PROD_SMOKE.md) | Agent post-deploy smoke efter grön Deploy to production (coordinator, inte användaren) |
| [`RELEASE_MODEL.md`](./RELEASE_MODEL.md) | master=truth, deploy=publish, kill switches only, no post-merge flag flip |
