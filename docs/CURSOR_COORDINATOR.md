# Cursor — koordinator och agenter (Home Pantry)

*Publik guide för nya Cursor-inloggningar och coordinator-agenter. Senast: 2026-05-31.*

Denna fil finns i git. Operativ status, kostnadssiffror och spawn-logg ligger i gitignorerad [`private/`](../private/) — kopiera från backup vid ny maskin (finns inte på GitHub).

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
| **master = deploy** | Endast `master` pushar till prod via Release. Agenter kodar på `feat/*` / `fix/*`, mergar när CI är grön |
| **Parallella branches** | Upp till 3 aktiva feature/fix-branches; en agent per branch, en hot zone per agent |
| **Inga parallella bursts** | Inte flera `explore`/`shell`/`generalPurpose` samtidigt på samma uppgift eller hot zone |
| **En hot zone = en agent** | t.ex. `src/lib/i18n/`, settings-UI/API, `di.ts`, `db/migrations/` + `init.ts`, `hooks.server.ts`, delad auth/layout |
| **E2E efter freeze** | En avgränsad E2E-batch per vecka när feature-arbetet är fryst — inte XL E2E mitt i sprint |
| **Finish before starting** | Stäng/merge öppet arbete innan ny P1-feature-spawn |
| **Coordinator-only spawn** | Implementation-agenter spawnar inte peers |
| **G0 före push** | `npm run check:locales && npm run check && npm test` (E2E om auth/UI berörts) — se [`CI_CD.md`](./CI_CD.md), [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) |
| **Security före deploy** | Security-agent → `private/SECURITY_REPORT.md` måste vara grön nog för G3 |
| **Definition of done** | Ingen "deployed" utan **lyckad Release** för merge-SHA + [`PROD_SMOKE.md`](./PROD_SMOKE.md) (5 punkter) |

**Parallell dev:** implementation på feature-branch i huvud-worktree; **dev-runtime** kör `dev:watch` i worktree `home-pantry-dev` (`npm run dev:start:ai`) så två agenter kan utveckla utan port-krock.

Övriga WIP-slots (när coordinator använder dem): 1 planner (read-only explore), 1 integration (merge/konflikt), 1 governance-skannning — se koordinatorregler; detaljer och experimentlogg i `private/WIP1_TEST_LOG.md`.

**Survival mode (WIP=1):** vid mycket tight budget — max 1 feature-branch + dev-runtime; inga parallella swarms. Aktiveras i coordinator-session, inte i denna fils detaljer.

---

## Merge queue (branch → master → Release)

1. **Branch:** agent jobbar på `feat/*` eller `fix/*` från senaste `master`.
2. **G0 lokalt:** `npm run check:locales && npm run check && npm test` (+ `test:integration`, `test:e2e` vid behov).
3. **CI grön på branch** (valfritt push till branch för Actions, eller G0 räcker för små fix).
4. **Merge till `master`:** coordinator rebasar/mergar, pushar `origin master`.
5. **Release:** `gh run watch` tills **Release** workflow är grön för merge-SHA.
6. **Rapportera:** merge-SHA (7 tecken) + [`PROD_SMOKE.md`](./PROD_SMOKE.md) checklista — **inte** "deployed" förrän steg 5 lyckats.

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

Du är coordinator. Fråga innan commit, push eller spawn. WIP 3 aktiv: max 3 feature branches (feat/*, fix/*), master endast för deploy-merge, inga parallella explore/shell-bursts, E2E efter feature-freeze. Spawn-proposal före varje ny agent (utom dev-runtime / enstaka P0 vid röd CI-prod). Definition of done: grön Release för merge-SHA + PROD_SMOKE.md.
```

---

## Relaterad dokumentation

| Doc | När |
|-----|-----|
| [`ONBOARDING_DEVELOPER.md`](./ONBOARDING_DEVELOPER.md) | Ny utvecklare (mänsklig) |
| [`CI_CD.md`](./CI_CD.md) | G0–G3, trunk på `master` |
| [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) | Testing diamond, risk, DoD |
| [`E2E.md`](./E2E.md) | Playwright-setup |
| [`PROD_SMOKE.md`](./PROD_SMOKE.md) | Post-deploy smoke (sv) efter grön Release |
