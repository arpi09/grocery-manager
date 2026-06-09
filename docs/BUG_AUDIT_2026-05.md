# Bug audit — May 2026 (post-unified nav)

Systematic product bug audit per [full product bug audit plan](https://github.com/arpi09/grocery-manager). **Audit only** — no P0 fixes in this pass. Prod baseline SHA: **`86d1d97d`** (scan photo-first + unified nav). Prior subagent `e3c4b87f` was interrupted after safe reset (only read plan/PROD_SMOKE); this report completes the plan.

**Related:** [`UX_AUDIT_2026-05.md`](./UX_AUDIT_2026-05.md) (UX friction, separate triage) · [`MOBILE_AUDIT.md`](./MOBILE_AUDIT.md) · [`E2E.md`](./E2E.md)

---

## Executive summary

| Metric | Value |
|--------|-------|
| **P0 open (product)** | **0** |
| P1 open | 2 (BUG-001, BUG-003 UX backlog) |
| P2 open | 3 |
| Test / infra (not product) | 3 |
| E2E baseline | 88 passed · 2 failed · 1 skipped (91 total) |
| Prod browser smoke | Verified on `https://skaffu.com` (engaged admin account) |

No crashes, 500s, or data-loss flows found on prod or in automated baseline.

---

## Baseline (2026-06-09, SHA `86d1d97d`)

| Command | Result |
|---------|--------|
| `npm run check` | **Pass** — 0 errors, 70 warnings (existing Svelte a11y/state warnings) |
| `npm test` | **Pass** — 801 passed, 5 skipped (160 files) |
| `npm run test:e2e` (`USE_PGLITE=true`, `PLAYWRIGHT_PORT=5191`) | **88/91 pass** — see failures below |

### E2E failures (test stability — not filed as product P0)

| Spec | Failure | Likely cause |
|------|---------|--------------|
| `e2e/shopping.spec.ts` — add line and check off item | Toast `.toast-message` with `{name} avbockad` not found | **Fixed** — `getByRole('status')`, dismiss pantry sheet when `ask` mode |
| `e2e/weekly-ritual.spec.ts` — generate shows meal suggestions | `waitForResponse` `/api/eat-first` timeout | **Fixed** — seed item med `expiresOn`, `waitForURL` efter create, längre eat-first timeout |

**Skipped:** `inventory-synk` confirm-and-undo (no batch data in seed).

**Note:** First local E2E attempt failed — port `5190` already in use by dev-runtime. Use `PLAYWRIGHT_PORT=5191` or stop conflicting server. CI uses fresh port.

### Axe / mobile-visual

All P0 routes in `e2e/accessibility.spec.ts` and `e2e/mobile-visual.spec.ts` **green** (no critical/serious axe on audited routes).

---

## Prod browser audit (`https://skaffu.com`)

Session already authenticated; no prod login blocker.

| Check | Result |
|-------|--------|
| Login → `/hem` | Pass — no 500 |
| Bottom nav: Hem, Skanna, Lager, Äta | Pass |
| Header: Shopping (cart), Mer, account | Pass |
| `/scan` | Pass — **photo-first** (`Add with photos`), not 4-choice hub |
| `/planer` — Generate meal idea | Pass — assistant sheet opens |
| `/settings` | Pass — notification toggles visible |
| `/inventory/merge` | Pass — empty state (no duplicate rows in test pantry) |
| Desktop double-nav | Not re-tested at 1280px this pass |

**Prod-only friction (not P0):** PMF survey + invite overlays on `/hem` and `/merge` can block coordinator smoke until dismissed (`PUBLIC_E2E_DISABLE_POST_SURVEY` only applies in E2E).

---

## Exploratory coverage gaps (weak routes)

Routes visited manually or via E2E load only; **interaction depth limited**:

| Route | Coverage | Gap |
|-------|----------|-----|
| `/inventory/merge` | HTTP + empty state (prod + E2E) | No E2E with duplicate seed / merge action |
| `/planer` calendar expand/collapse | Prod: calendar open with 10 meals | Collapsed-empty variant not exercised |
| `/settings` toggles | E2E save expiry reminders **pass** | Push toggle on prod not clicked |
| `/item/[id]/edit` | mobile-visual axe **pass** | Nested-form SSR warning (see BUG-002) |
| `/hem` — "Mer på hem" | Prod: button present | Disclosure expand/collapse not scripted |
| `/statistik`, `/profile`, `/nyheter`, `/husdjur` | HTTP / axe only | No interactive E2E |
| Viewer/read-only role | Not tested | No viewer test account in prod smoke |

---

## Findings

Severity per audit plan: **P0** = crash/500/data loss · **P1** = blocked core flow · **P2** = polish/copy.

### P0 — none open

No reproducible P0 product bugs in this pass.

---

### P1

| ID | Route | Variant | Repro | Expected / Actual | Miljö | Fix-förslag |
|----|-------|---------|-------|-------------------|-------|-------------|
| BUG-001 | `/hem` | Engagerat konto, mobil | Logga in → `/hem` | **Förväntat:** en tydlig nästa handling · **Faktiskt:** flera likvärdiga block (Vecka fixad, Din vecka, aktivitet, rapport, kvitto…) trots holistisk UX | prod | `HomeNextAction` / progressive disclosure — se UX audit; E2E `at most one primary CTA` passar PGlite-seed, prod-konto rikare |
| BUG-002 | `/item/[id]/edit` | Alla | Öppna redigera post → devtools console | **Förväntat:** ren hydration · **Faktiskt:** `node_invalid_placement_ssr`: `<form>` inuti `AddItemForm` (`ConsumeItemPanel`, `DeleteConfirmButton`) → `HierarchyRequestError` vid hydrate | local E2E | **Fixed** — consume/delete flyttade utanför save-`<form>` i `AddItemForm.svelte` |
| BUG-003 | `/hem`, `/planer` | Engagerat | Jämför hero på hem vs Äta | **Förväntat:** ett recept-ingång · **Faktiskt:** "Generate dinner" på hem + EatHubHero på planer | prod | Konsolidera till Äta-fliken (UX backlog) |
| BUG-004 | Overlays | Returning user | Besök `/hem` efter deploy | **Förväntat:** max ett modal · **Faktiskt:** PMF-enkät + invite kan staplas med receipt-autopilot | prod | **Fixed** — `overlay-stack.ts` + `registerBlockingOverlay`; PMF deferrar tills högre prioritet stängs |

---

### P2

| ID | Route | Variant | Repro | Expected / Actual | Miljö | Fix-förslag |
|----|-------|---------|-------|-------------------|-------|-------------|
| BUG-005 | `/inventory/*` | Mobil swipe | Swipe rad i listan | **Förväntat:** tyst swipe · **Faktiskt:** intermittent `setPointerCapture` NotFoundError i console (E2E swipe tests **pass**) | local | **Fixed** — try/catch runt `setPointerCapture` i `InventoryCompactRow.svelte` |
| BUG-006 | `/inventory/synk` | Copy | Läs sidtitel | "Synk" kan tolkas som moln-sync | — | Copy redan förbättrad; ev. "Bekräfta lager" i hint |
| BUG-007 | `/inkop` | Smart fill | Fyll lista med AI | **Förväntat:** scroll + tydlig feedback · **Faktiskt:** listan fylls utan celebration/scroll (UX) | prod/local | Post-fill scroll + toast (UX backlog) |

---

## Verified fixed (regression notes)

| Area | Was | Now (86d1d97d) |
|------|-----|----------------|
| Scan tab default | Hub med 4 val | Photo-first på `/scan` — E2E `scan tab opens photo mode` **pass**, prod **pass** |
| Header receptknapp | Modal från header | Borttagen — recept via **Äta** → `/planer` |
| Mobile nav inköp | Okänd | Header cart → `/inkop` — E2E **pass** |
| Synk E2E timeout | Fail on older run (overlay dismiss loop) | **Pass** on current SHA |

---

## Follow-up (out of scope for audit pass)

1. **P0 fix PR** — none required from this audit.
2. **P1 UX backlog:** BUG-001/BUG-003 (hem/planer CTA consolidation — coordinate with UX).
3. **Test hygiene:** document `PLAYWRIGHT_PORT` when dev-runtime occupies 5190.
4. **E2E coverage:** merge with duplicates, planer collapsed calendar, viewer role, `/profile` interactive.

---

## Governance note

`private/` directory (e.g. `OWNERSHIP`, governance reports) **not present** in workspace — do not invent; human should restore from backup or template if agents rely on those files.
