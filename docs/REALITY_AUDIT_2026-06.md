# Reality Audit — June 2026

> **Canonical audit** (2026-06-15). Prod vs master vs plan narrative. R17–R29 are **planned slices**, not implemented in this doc pass.

## Executive summary

A large share of “sprint failed” is **deploy / verification gap**, not missing code on master. Prod lagged master by Bundle C (R12–R16) and CI/CD v2 until **Deploy 0** (2026-06-15). PO **USER_LOCAL Gate 0** must run on the new prod SHA before prioritising R17–R29.

---

## Reality Gaps (plan vs actual)

| Sanning | Vad docs/sprint säger | Vad faktiskt gäller |
|---------|----------------------|---------------------|
| **Prod SHA** | Narrative sprint + Home V4 + Scan V2 “deployed” @ `f70c2c9c` i gamla docs | **Prod = `94c95b4d`** (Bundle A+B) — deploy [27533104716](https://github.com/arpi09/grocery-manager/actions/runs/27533104716) — [CURRENT_REALITY.md](./CURRENT_REALITY.md) delvis stale |
| **Master SHA** | CURRENT_REALITY säger `94c95b4d` | **Master = `eb8bd485`** — Bundle C (#90–#94) + CI/CD v2 (#95) |
| **Deploy gap** | “Merge = publish” | **~10+ commits ej i prod** före Deploy 0 — PO testade prod medan fixar satt på master |
| **R1–R11** | PRODUCT_AUDIT “Ready Now” | **På prod** (Bundle A+B) |
| **R12–R16** | Bundle C plan | **På master, ej prod** före Deploy 0 — onboarding v2, landing copy, design system doc, grannskafferiet gate |
| **CI/CD v2** | Pending | **Merged #95** @ `eb8bd485` — tiered gates, `deploy_tier` lanes |
| **USER_LOCAL** | Pending | **Aldrig PO-signerad** @ prod — agents kan inte substituera |

---

## Deploy 0 status

| Field | Value |
|-------|--------|
| **Target master SHA** | `eb8bd485` (merge #95 CI/CD v2 onto Bundle C master) |
| **Prior prod SHA** | `94c95b4d` |
| **Deploy tier** | `full` (first validation of Bundle C + CI v2) |
| **Deploy run** | [27541222554](https://github.com/arpi09/grocery-manager/actions/runs/27541222554) — **FAILED** (e2e 1/3 onboarding tests; prod unchanged @ `94c95b4d`) |
| **PR #95** | **Merged** @ `eb8bd485` — rebased `chore/ci-test-tiers`, conflicts in `package.json` |

---

## 14 critical observations — verification

| # | Observation | Prod `94c95b4d` | Master `eb8bd485` | Kvar efter Deploy 0? |
|---|-------------|-----------------|-------------------|----------------------|
| 1 | Inventory = adminpanel | Desktop **datagrid** ([`InventoryDataTable.svelte`](../src/lib/components/molecules/InventoryDataTable.svelte)) | R11 polish rows, **table chrome kvar** | **Ja** → R18 |
| 2 | Mobile filter chrome | R9 collapsed filter chip | [`ListToolbar.svelte`](../src/lib/components/molecules/ListToolbar.svelte) `collapseFilters` | **Delvis** — sticky band + location tabs kvar → R25 |
| 3 | Estimated expiry inkonsekvent | Badge endast om `isEstimatedExpirySource` + subline | Samma — [`InventoryCompactRow.svelte`](../src/lib/components/molecules/InventoryCompactRow.svelte) | **Ja** → R20 |
| 4 | Brain osynligt | R1+R2+R6+R7 på prod | + R14 onboarding Brain beats | **Delvis** — learning tyst utom toast/kvitto |
| 5 | Scan förvirrande | R3: `/scan` → hub om ingen mode ([`scan-nav.ts`](../src/lib/utils/scan-nav.ts)) | Samma + R14 copy | **Mild** |
| 6 | Manual add har scan | R4: scan i `<details>` ([`AddItemForm.svelte`](../src/lib/components/organisms/AddItemForm.svelte)) | Samma | **Ja** → R21 |
| 7 | Onboarding lär inte | Lista-first modal, gammal path art | R14: 3 beats vad/loop/hur, lista SVG welcome | **Deploy Bundle C** fixar i prod |
| 8 | Slumpmässiga animationer | `CelebrationBurst`, onboarding sparkles | Samma komponenter | **Ja** → R22 |
| 9 | Home rörig | R5: taglines `lista_ready`/`expiry` | Taglines wired; **inga dedikerade heroes** | **Ja** → R17 |
| 10 | News ≠ Brain | R7 `brain-v1` i [`app-news.ts`](../src/lib/data/app-news.ts) | Samma | **På prod** om entry synlig |
| 11 | Shopping→inventory oklar | R10 pantry bridge copy | Samma | **På prod** |
| 12 | Spacing inkonsekvent | R15 doc only | [`DESIGN_SYSTEM_V1.md`](./DESIGN_SYSTEM_V1.md) — **ingen fleet-wide pass** | **Ja** → R27 |
| 13 | Inte premium / design system | Partial tokens | Doc + badge line-height i R15 | **Ja** |
| 14 | Mobile-first brutet | Lager i Mer, inte tab | Samma [`nav-config.ts`](../src/lib/navigation/nav-config.ts) | **Ja** — medveten IA |

---

## UX/UI failures — R17–R29 slices (Ready Now, **not implemented**)

Implementation owned by separate agent streams. **Do not merge before USER_LOCAL Gate 0** if PO ska godkänna prioritering.

### UX Failures

| ID | Problem | Lösning | Filer | Test |
|----|---------|---------|-------|------|
| **R17** | `lista_ready`/`expiry` = tagline only | Primär hero per state: lista CTA vs eat-first strip | [`HomeDashboard.svelte`](../src/lib/components/organisms/HomeDashboard.svelte), `sv.json`/`en.json` | home e2e, cold/lista states |
| **R18** | Desktop inventory datagrid | Ersätt `<table>` med card stack; dölj sort headers | [`InventoryDataTable.svelte`](../src/lib/components/molecules/InventoryDataTable.svelte), [`InventoryTableRow.svelte`](../src/lib/components/molecules/InventoryTableRow.svelte) | inventory e2e desktop |
| **R19** | Mobile row: Slut + swipe + overflow | Ta bort synlig `Slut`-knapp; swipe + overflow only | [`InventoryCompactRow.svelte`](../src/lib/components/molecules/InventoryCompactRow.svelte) | inventory-mobile e2e |
| **R20** | Uppskattat gömt i subline | Flytta `EstimatedBadge` till main-line; “Saknar datum” hint | [`InventoryCompactRow.svelte`](../src/lib/components/molecules/InventoryCompactRow.svelte), [`InventoryTableRow.svelte`](../src/lib/components/molecules/InventoryTableRow.svelte) | unit + inventory-mobile |
| **R21** | Manual add: scan-instead details | Ersätt details med länk “Skanna istället →” till `scanHubHref` | [`AddItemForm.svelte`](../src/lib/components/organisms/AddItemForm.svelte) | item/new e2e |
| **R22** | Onboarding animation noise | Minska `CelebrationBurst`; ta bort camera flash på welcome | [`OnboardingGuide.svelte`](../src/lib/components/organisms/OnboardingGuide.svelte), [`CelebrationBurst.svelte`](../src/lib/components/atoms/CelebrationBurst.svelte) | onboarding e2e |
| **R23** | Home engaged = alla sektioner | Dölj tomma `home-v3-section` | [`HomeDashboard.svelte`](../src/lib/components/organisms/HomeDashboard.svelte) | home e2e |
| **R24** | Pantry bridge första gång | One-shot coachmark/toast på första checkoff | [`ShoppingToPantrySheet.svelte`](../src/lib/components/molecules/ShoppingToPantrySheet.svelte), localStorage flag | shopping e2e |

### UI Failures

| ID | Problem | Lösning | Filer |
|----|---------|---------|-------|
| **R25** | Dubbla chip-system inventory sticky | En chip-rad: filter+sort; location tabs scroll horizontal | [`InventoryList.svelte`](../src/lib/components/organisms/InventoryList.svelte), [`ListToolbar.svelte`](../src/lib/components/molecules/ListToolbar.svelte) |
| **R26** | “Slut” / systemjargong | i18n: “Ätit upp” / “Klart” | `sv.json`, `en.json` |
| **R27** | Design tokens inte enforced | Apply `DESIGN_SYSTEM_V1` spacing på EmptyState, Card, Product Row | [`EmptyState.svelte`](../src/lib/components/molecules/EmptyState.svelte), [`Card.svelte`](../src/lib/components/atoms/Card.svelte), inventory row CSS |
| **R28** | Receipt upload heavy | Collapse guide; en picker | [`ReceiptBulkAddFlow.svelte`](../src/lib/components/organisms/ReceiptBulkAddFlow.svelte) |

### Brain visibility (R29)

| Gap | Fix | Filer |
|-----|-----|-------|
| Vocabulary split | En term “Uppskattat” — grep `AI-gissning`, `Estimated` i i18n | `sv.json`, `en.json` |

**Förbjudet:** nya predictors, nya learning tables, Brain V2.

---

## Deploy bundles (post Deploy 0)

| Bundle | Innehåll | Deploy tier | Notes |
|--------|----------|-------------|-------|
| **Deploy 0** | Master `eb8bd485` + #95 CI | `full` | Bundle C + CI v2 — [run 27541222554](https://github.com/arpi09/grocery-manager/actions/runs/27541222554) |
| **Deploy D1** | R21, R22, R26, R29 | `fast` | Copy + onboarding + i18n |
| **Deploy D2** | R17, R23 | `fast` | Home hierarchy — serial on `HomeDashboard.svelte` |
| **Deploy D3** | R19, R20, R25 | `fast` | Mobile inventory — serial on compact row / list |
| **Deploy D4** | R18, R27 | `fast` | Desktop inventory premium |
| **Deploy D5** | R24, R28 | `fast` | Shopping/receipt loop |

**Recommended merge order:** D1 → D2 (R17 then R23) → D3 (R20→R19→R25) → D4 (R18→R27) → D5 (R24, R28 parallel).

---

## USER_LOCAL verification

### Gate 0 — efter Deploy 0 (master → prod)

**Status:** Documented 2026-06-15. **PO verification pending** — agents must not claim this pass.

Baseline checklist (test on **new prod SHA**, not `94c95b4d`):

- [ ] Ny registrering: onboarding 3 beats (vad/loop/hur), lista-default
- [ ] `/scan` utan mode → hub kvitto-first
- [ ] Manual add: scan under details (baseline före R21)
- [ ] Mobil lager: tap Uppskattat → explain
- [ ] Nyheter: Brain V1-post
- [ ] Grannskafferiet **ej** i Mer (R16)
- [ ] Accept replenishment → toast

**Pass criteria:** *"Skaffu håller vår veckolista och jag ser när den uppskattar datum — inte en skanner-app."*

### Gate D1–D5 — efter respektive deploy

- [ ] R21: manual = formulär, scan via länk
- [ ] R17: lista_ready visar tydlig primär lista-CTA
- [ ] R19/R20: lager mobile = mer rader synliga, Uppskattat på namnrad
- [ ] R18: desktop lager = cards, inte Excel
- [ ] R24: första checkoff förklarar skafferi-uppdatering

---

## Coordinator actions completed (Fas 0)

1. Rebased + merged **PR #95** (CI/CD v2) — conflicts: `package.json` duplicate scripts; onboarding fix commit skipped (already on master)
2. Triggered **Deploy 0** — `deploy_tier=full` on master `eb8bd485` — **failed** E2E shard 1/3 (onboarding heading / post-register nav)
3. This audit doc + CURRENT_REALITY update (prod SHA when deploy green)
4. **user-local-0:** documented above — **PO must run Gate 0 on device**

**Next (Fas 1):** Fix Deploy 0 E2E blockers (onboarding e2e vs R14 copy) → re-run deploy → PO USER_LOCAL Gate 0 → D1–D5.
