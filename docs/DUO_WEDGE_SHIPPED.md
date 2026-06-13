# Duo wedge — Veckans lista tillsammans

Post-merge / post-deploy sammanfattning för coordinator. Uppdatera rader markerade *(fyll vid deploy)*.

**Relaterat:** [`FOUNDER_SEED_PLAYBOOK.md`](./FOUNDER_SEED_PLAYBOOK.md) · [`PROD_SMOKE.md`](./PROD_SMOKE.md) · [`CURRENT_REALITY.md`](./CURRENT_REALITY.md)

---

## What shipped

*Baserat på master (`282a551f` och wedge-slice-arbete) — verifiera mot faktisk deploy-SHA.*

| Område | Status på master |
|--------|------------------|
| **Inkop-first default home** | `APP_HOME_PATH` → `/inkop`; post-register `freshAccount=1` på inkop |
| **Onboarding 3-steg** | `together` → `addItems` → `celebrate` ([`onboarding-steps.ts`](../src/lib/utils/onboarding-steps.ts)) |
| **Onboarding together-CTAs** | Dela länk / Bjud in / Jag handlar själv i [`OnboardingGuide.svelte`](../src/lib/components/organisms/OnboardingGuide.svelte) |
| **Post-onboarding share** | [`PostOnboardingSharePrompt`](../src/lib/components/organisms/PostOnboardingSharePrompt.svelte) på `/inkop` only |
| **Lista gästsida** | `/lista/[token]` read-only preview + join CTA ([`lista/[token]/+page.svelte`](../src/routes/lista/[token]/+page.svelte)) |
| **Hushållsinvite** | `/invite/[token]` → `partner_joined` |
| **Shared checkoff** | [`inkop/+page.server.ts`](../src/routes/inkop/+page.server.ts) → `shared_checkoff` när ≥2 medlemmar |
| **Share i inkop-panel** | [`ShoppingListPanel`](../src/lib/components/organisms/ShoppingListPanel.svelte) — `list_link_shared` |
| **Migration 0050** | Kommentar-dokumentation av wedge event-typer (ingen DDL) |

**Wedge-slice gaps (kan vara pending merge vid läsning):**

| Gap | Master vid Agent 6 QA |
|-----|------------------------|
| Onboarding title exakt *"Handlar du tillsammans med någon?"* | Nuvarande: *Handla tillsammans* |
| Duo action bar above fold på `/inkop` | Share/invite längst i panelen |
| `list_link_opened` / `list_join_cta_clicked` product events | Ej i allowlist ännu; acquisition-events används |
| Lista signup redirect → `/inkop` | Redirect → `/settings#household` |
| Lista CTA copy *Gå med i hushållets lista* | *Skapa konto och handla tillsammans* |

**Prod deploy:** *(fyll vid deploy)* — Prod SHA: ___ · Deploy-datum: ___ · Wedge smoke körd: ☐

---

## What is behind flag

| Flag | Var | Effekt när **on** |
|------|-----|-------------------|
| `PUBLIC_SHOPPING_LIST_SHARE_ENABLED` | `apphosting.yaml` (master: **true**) | Dela lista, `/lista/[token]`, export footer, onboarding/post-onboarding share CTAs |
| Prod idag (`3961184`) | Firebase runtime | Flag **off** — wedge-UI ej live på skaffu.com tills ny deploy |

**Rollback:** Sätt `PUBLIC_SHOPPING_LIST_SHARE_ENABLED=false` → redeploy. Dela-knappar och publik lista döljs; övrig inkop/onboarding fungerar utan share.

---

## Manual seed test path

7-stegs duo-loop — full tabell med URL:er och förväntade events:

→ [`FOUNDER_SEED_PLAYBOOK.md` — Manual seed test path](./FOUNDER_SEED_PLAYBOOK.md#manual-seed-test-path--veckans-lista-tillsammans-wedge)

Post-deploy smoke-checklistor (10 punkter):

→ [`PROD_SMOKE.md` — Wedge](./PROD_SMOKE.md#wedge--veckans-lista-tillsammans)

---

## Known risks

| Risk | Mitigering |
|------|------------|
| Prod kör `/hem`-nav tills wedge-SHA deployas | Coordinator deploy + PROD_SMOKE wedge-sektion |
| Lista redirect till settings i stället för inkop | Agent 4 lista-CTA; verifiera steg 6 i founder path |
| Share-knapp under fold på mobil | Agent 3 duo-bar; manuell 390px-check i smoke |
| Wedge-metrics ofullständiga utan `list_link_opened` / `list_join_cta_clicked` | Agent 5 events; tillfälligt `shopping_list_share_*` i analytics |
| Turnstile / e-postverify blockerar snabb duo-test | Använd två riktiga inboxar; admin bypass ej på prod |
| Ingen e2e för hela loopen | Manuell founder path tills Playwright-resa finns |

---

## Next smallest improvement

1. **Deploy master wedge-SHA** till prod med share-flag on — blocker för founder-seed-10.
2. **Kör wedge PROD_SMOKE** + en intern duo-test (A+B) på skaffu.com; logga top-1 friktion.
3. **Mät `shared_checkoff`** i admin/product events efter första riktiga seed-hushåll.
4. Stäng kvarvarande gaps (above-fold bar, lista redirect, wedge events, onboarding copy) om ej redan mergat.

---

*Agent 6 QA/smoke · jun 2026 · uppdatera efter deploy och första seed-familj.*
