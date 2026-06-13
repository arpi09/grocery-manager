# Duo wedge deploy — Veckans lista tillsammans

Coordinator checklist för att släppa **inkop-first + delad lista (W1)** till produktion så founder-seed kan köra hela duo-loopen på skaffu.com.

**Relaterat:** [DEPLOY.md](./DEPLOY.md) · [PROD_SMOKE.md](./PROD_SMOKE.md#wedge--veckans-lista-tillsammans) · [FOUNDER_SEED_PLAYBOOK.md](./FOUNDER_SEED_PLAYBOOK.md#manual-seed-test-path--veckans-lista-tillsammans-wedge) · [CURRENT_REALITY.md](./CURRENT_REALITY.md) · [DUO_WEDGE_SHIPPED.md](./DUO_WEDGE_SHIPPED.md)

---

## Varför denna deploy

Prod kör idag en äldre SHA med `/hem`-nav och share-flag **off** i runtime. Master har redan inkop-first, onboarding tillsammans, `/lista/[token]` och `PUBLIC_SHOPPING_LIST_SHARE_ENABLED=true` i `apphosting.yaml` — men **flags och nav når prod först vid Firebase deploy**.

**Mål efter deploy:** Seed-familj kan registrera → `/inkop` → dela lista → partner öppnar `/lista/[token]` → join → gemensam checkoff.

---

## Pre-deploy checklist (coordinator)

Kör i ordning. Säg inte "deployed" förrän **Deploy to production** är grön inkl. `verify release completed` **och** wedge-smoke i [PROD_SMOKE.md](./PROD_SMOKE.md#wedge--veckans-lista-tillsammans).

### G0 — lokalt (agenter, före merge)

```bash
npm run quality:ci
```

Motsvarar full CI-kedja: lint, locales, server-imports, check, unit + integration + receipt fixtures, build, client-bundle. Se [CI_CD.md](./CI_CD.md#översikt) gate-tabell.

- [ ] `npm run quality:ci` grön på merge-commit
- [ ] Inga blockerande ocommittade migrationer utan journal-entry (`drizzle/meta/_journal.json`)
- [ ] Wedge-slice PR:er mergade till `master` (events, inkop duo-bar, lista CTA, onboarding copy — se build plan)

### G1 — CI på target SHA

```bash
gh run list --workflow=ci.yml --branch=master --limit=3
```

- [ ] Senaste push till `master` har **`quality / quality`** = `success` på **exakt samma SHA** som ska deployas
- [ ] Notera kort SHA: `git rev-parse --short HEAD`

**G1b:** Deploy-workflowen verifierar detta automatiskt. Deploy som startar före CI är klar failar (t.ex. G1b "Verify green CI quality on same SHA").

### Target SHA

- [ ] Bekräfta att target-SHA inkluderar `integrate/seed-and-share`-merge (`282a551f` eller senare) **plus** eventuella wedge-gap-fixar från parallella agenter
- [ ] Jämför med prod: `gh run list --workflow=deploy.yml --limit=1` — prod SHA ska uppdateras från nuvarande

### Feature flag — W1 share (obligatorisk)

Bekräfta i [`apphosting.yaml`](../apphosting.yaml) **före deploy**:

```yaml
- variable: PUBLIC_SHOPPING_LIST_SHARE_ENABLED
  value: "true"
  availability:
    - BUILD
    - RUNTIME
```

- [ ] `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` = `"true"`
- [ ] `availability` inkluderar **BUILD** och **RUNTIME** (SvelteKit `$env/static/public` + server-side gating)
- [ ] Reader: [`shopping-list-share-flag.ts`](../src/lib/server/shopping-list-share-flag.ts)

**Effekt när deployad:** Dela lista på `/inkop`, publik `/lista/[token]`, export-footer register-URL, onboarding "Dela länk" (gated).

**Prod idag:** flag **off** i runtime tills denna deploy lyckas — yaml i repo räcker inte utan Firebase deploy.

### Övriga flags (seed cohort — redan i yaml)

Master sätter även Brain V1 flags till `true` i samma fil. Ingen extra åtgärd för wedge-deploy, men dokumentera vid rollback:

| Flag | Wedge-kritisk? |
|------|----------------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | **Ja** |
| `SHELF_LIFE_LEARNING_ENABLED` | Nej (seed cohort) |
| `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` | Nej |
| `LOCATION_LEARNING_ENABLED` | Nej |
| `REPLENISHMENT_LEARNING_ENABLED` | Nej |

### Deploy start

- [ ] Be coordinator i chatten (`deploy` / `kör deploy`) **eller** Actions → **Deploy to production** → Run workflow
- [ ] Inputs: `ref=master`, `sha` tom (eller explicit SHA), `skip_e2e=false`
- [ ] Följ tills alla jobb gröna: `quality`, `e2e (1/3)(2/3)(3/3)`, `deploy`, `post-deploy smoke`, **`verify release completed`**

Se [DEPLOY.md](./DEPLOY.md) för SLO (~12–25 min) och hotfix-undantag.

---

## Kända blockers (pre-deploy snapshot)

| Blocker | Status | Åtgärd |
|---------|--------|--------|
| Prod SHA ≠ master | **Aktiv** — prod `c9bdb2cf`, master `c7a29c35+` | Kör full deploy när wedge-kod + CI grön |
| Share flag off i prod runtime | **Aktiv** | Deploy med yaml ovan |
| `/hem`-nav live | **Aktiv** tills inkop-first deployas | Förväntat fix efter deploy |
| Wedge-gap PR:er (events, duo-bar, lista redirect, copy) | Kan vara **in flight** | Vänta merge + grön `quality:ci` |
| Deploy `c7a29c35` misslyckades 2026-06-13 | G1b SHA-gate | Deploy om efter CI grön på samma SHA |

---

## Flag rollback

Använd när delad lista orsakar incident eller ska pausas utan kodrevert.

### Steg

1. I [`apphosting.yaml`](../apphosting.yaml), sätt:
   ```yaml
   - variable: PUBLIC_SHOPPING_LIST_SHARE_ENABLED
     value: "false"
     availability:
       - BUILD
       - RUNTIME
   ```
2. Commit till `master`, vänta grön CI.
3. Kör **Deploy to production** (samma gates — ingen `skip_e2e` utom dokumenterad hotfix).
4. Post-deploy: kör **Flag rollback smoke** i [PROD_SMOKE wedge-sektion](./PROD_SMOKE.md#wedge--veckans-lista-tillsammans) — inga dela-knappar på inkop; publik lista gated/404; registrering trasig **inte**.

### Vad rollback *inte* gör

- Raderar inte befintliga share tokens eller hushållsdata
- Påverkar inte Brain learning flags (separata variabler)
- Kräver **inte** DB-migration rollback (`0050_duo_wedge_events.sql` är kommentar-only)

### Snabb paus vs full revert

| Scenario | Åtgärd |
|----------|--------|
| Pausa dela-länk UI | Flag `false` + redeploy |
| Revert inkop-first nav | Kodrevert + deploy (tyngre — undvik om flag räcker) |

---

## Post-deploy (obligatoriskt)

1. **Uppdatera** [CURRENT_REALITY.md](./CURRENT_REALITY.md) — prod SHA, flag-tabell, nav-rader.
2. **Kör** generell prod-smoke: [PROD_SMOKE.md](./PROD_SMOKE.md) (5-punktslistan + browser på `/`).
3. **Kör** wedge-smoke: [PROD_SMOKE.md § Wedge](./PROD_SMOKE.md#wedge--veckans-lista-tillsammans) (10 checkboxes).
4. **Kör** manuell 7-stegs path: [FOUNDER_SEED_PLAYBOOK.md](./FOUNDER_SEED_PLAYBOOK.md#manual-seed-test-path--veckans-lista-tillsammans-wedge).
5. **Fyll** [DUO_WEDGE_SHIPPED.md](./DUO_WEDGE_SHIPPED.md) — what shipped / risks / next step.

**Minst en intern duo-test** ska slutföra hela loopen på prod innan seed-DM skickas.

---

## Snabbreferens

| Kommando | Syfte |
|----------|--------|
| `npm run quality:ci` | G0 före merge |
| `gh run list --workflow=ci.yml --branch=master --limit=1` | G1 status |
| `gh workflow run deploy.yml` | Starta deploy (coordinator) |
| `gh run list --workflow=deploy.yml --limit=1` | Senaste prod SHA |

---

*Ops doc · Veckans lista wedge · jun 2026*
