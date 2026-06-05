# UX-coordinator backlog — svensk produkt (jun 2026)

*Batch från användarfeedback. P0 levereras i PR `fix/ux-p0-batch`. Planner-ID:n (F3–F5) mappar till tidigare scan/onboarding/inventory-vågor — inte ROADMAP Fas-nummer.*

## Vad som INTE ska claimas som klart efter P0-PR

| Område | Varför |
|--------|--------|
| Hel redesign scan-hub (beyond tabs bort) | Endast dubbel navigering borttagen på hub |
| Foto-runda utan platsval + AI-plats | Kräver flödes- och prompt-ändring |
| En CTA «Lägg till varor» på inventory | Levererat P1 — ej P2 |
| /inkop fill celebration + auto-scroll | Animation + layout, egen epic |
| Enhetlig toast-arkitektur överallt | Delvis P2 — se toast-rader nedan |

---

## Prioritering

| Prio | ID / epic | Scope (realistisk) | Filer / ankare | Status |
|------|-----------|-------------------|----------------|--------|
| **P0** | **F5-hub** | Ta bort `ScanModeTabs` på `/scan` hub; behåll tabs i underflöden (streckkod/kvitto/foto) | `src/routes/scan/+page.svelte`, `ScanModeHub.svelte`, `ScanModeTabs.svelte` | **Denna PR** |
| **P0** | **Toast** | Kontrast light/dark via `--toast-*`, 5s default, paus vid hover | `Toast.svelte`, `app.css`, `ActionToast.svelte` | **Denna PR** |
| **P0** | **Notiser** | SW-saknas i dev → tydligt fel, timeout på `ready`, toggle hänger inte | `push-notifications.ts`, `settings/+page.svelte`, i18n | **Denna PR** |
| **P1** | **F4-foto** | `?mode=photo`: AI infererar kyl/frys/skafferi; ta bort tvingande platssteg | `PhotoRoundFlow.svelte`, `scan-nav.ts`, ev. API prompt | Planerad |
| **P1** | **F3-inventory-CTA** | Primär «Lägg till varor» + sekundära metoder (foto/streckkod/manuellt) | `inventory/[location]/+page.svelte`, i18n | Planerad |
| **P1** | **Toast-unify** | En källa: `ActionToast` + `Toast`; 5s action / 8s undo; samma placering | `action-toast.ts`, `AppLayout.svelte`, paneler med lokal `Toast` | Audit i P1 |
| **P1** | **F2-inkop-magi** | Efter smart fill: loader, scroll till lista, firande (15 varor) | `SmartShoppingFill.svelte`, `ShoppingListPanel.svelte`, `inkop/+page.svelte` | Planerad |
| **P2** | **Inventory-tabell** | DataGrid-liknande: densitet, sortering, kolumner (namn, antal, utgång) | `InventoryDataTable.svelte`, `InventoryTableRow.svelte` | **PR feat/ux-p2** |
| **P2** | **Nav-Mer** | Professionell öppning/stängning av desktop «Mer»-flyout | `MainNavDesktop.svelte` | **PR feat/ux-p2** |
| **P2** | **F5-hub-v2** | Hub-polish: intro, «Fler sätt»-sektion (ej full hero-redesign) | `ScanModeHub.svelte` | **PR feat/ux-p2** (partial) |
| **P2** | **Toast-unify (partial)** | 5s + success på panel-toasts; `TOAST_UNDO_DURATION_MS` | `action-toast.ts`, EatFirst, Recipe, m.fl. | **Klart (feat/ux-p2)** |
| **P2** | **Track F — toast unify** | Full audit, wrappers enhetliga, `docs/TOAST.md` | `AppLayout`, `InventoryScanToast`, `GamificationToast`, `ClientToast` | **PR feat/track-f-toast-unify** |

---

## Toast-audit – Track F (feat/track-f-toast-unify)

Se **[docs/TOAST.md](./TOAST.md)** för canonical arkitektur.

| Källa | Status |
|-------|--------|
| `ClientToast` + `showClientToast` | Global via `AppLayout` (action, 5s, tap dismiss, paus hover) |
| `ActionToast` (`?actionToast=`) | URL-driven, action size, 5s |
| `InventoryScanToast` | URL `?scan=`, action size, 5s, success/info |
| `GamificationToast` | URL `?celebrate=`, action size, 5s, celebrate gradient |
| `EatFirstSection`, `RecipeAssistant`, `MealPlanIdeasPanel`, `ReceiptAutopilot`, `CalendarDaySheet` | `showClientToast` |
| `ShoppingListPanel` success | `showClientToast` |
| `ShoppingListPanel` undo | **Undantag:** lokal `Toast` + 8s + inline Ångra-knapp |
| `settings/+page.svelte` push/expiry | `showClientToast` |

## Toast-audit – efter ClientToast (feat/toast-unify-scan-hero)

| Källa | Status |
|-------|--------|
| `ClientToast` + `showClientToast` | Global via `AppLayout` (action size, 5s default, paus hover) |
| `EatFirstSection`, `RecipeAssistant`, `MealPlanIdeasPanel`, `ReceiptAutopilot`, `CalendarDaySheet` | Migrerade till `showClientToast` |
| `ShoppingListPanel` success | `showClientToast` |
| `ShoppingListPanel` undo | Lokal `Toast` + 8s `TOAST_UNDO_DURATION_MS` (inline undo) |
| `settings/+page.svelte` push/expiry | `showClientToast` |
| `ActionToast` (`?toast=`) | Oförändrad URL-driven toast |
| `GamificationToast`, `InventoryScanToast` | Egna wrappers – behåll |

## Toast-audit (P1 — historik)

| Källa | Placering | Duration idag | Rekommendation |
|-------|-----------|---------------|----------------|
| `ActionToast` (URL `?toast=`) | Global via `AppLayout` | 5s, paus hover | Behåll som canonical success/info |
| Lokala `Toast` i organism | Inline i panel | Varierar 4.5s | Migrera till global eller delad store |
| `ShoppingListPanel` undo | Lokal | 8s | Behåll längre för undo |
| Settings push toast | Lokal state | 4.5s default | Använd `ActionToast` eller 5s+ |

**Enhetligt mönster:** bottom center, `TOAST_DEFAULT_DURATION_MS` (5000), paus vid hover/fokus, `success`/`info`/`error` tokens, inga hårdkodade `#fff` på `var(--color-text)` bakgrund.

---

## Nästa agent — filreferenser

1. **Foto AI-plats:** `src/lib/components/organisms/PhotoRoundFlow.svelte`, `src/routes/scan/+page.svelte` (`mode=photo`)
2. **Inventory CTA:** `src/routes/inventory/[location]/+page.svelte`
3. **DataGrid:** inventeringslist-komponent(er) som renderar kort idag (sök `inventory` i `src/lib/components`)
4. **Inköp celebration:** `src/lib/components/organisms/SmartShoppingFill.svelte`, `src/lib/components/organisms/ShoppingListPanel.svelte`, `src/routes/inkop/+page.svelte`
5. **Mer-meny:** `src/lib/components/organisms/MainNavDesktop.svelte`
6. **Toast migrate:** `grep -r "Toast" src/lib/components src/routes`
