# UX Guidelines — Skaffu (home-pantry)

Living reference for product UX. The **UX Review Agent** maintains this document and reviews features against it before implementation and release.

## UX Review Agent — purpose and responsibilities

The UX Review Agent is a **read-only reviewer by default**. It evaluates flows against this document and reports gaps; it does **not** implement UI unless the coordinator or user explicitly assigns implementation.

Each review should cover:

| Area | Focus |
|------|--------|
| **Flows** | Can the user reach their goal in minimal steps? Dead ends, loops, redundant confirmations |
| **Information architecture** | Clear page purpose, nav labels, where the user is |
| **Visual hierarchy** | One obvious primary action per section; secondary/tertiary de-emphasized |
| **Usability** | Labels, affordances, feedback, undo where destructive |
| **Accessibility** | Focus order, labels, contrast, touch targets (≥44px), screen reader names |
| **Onboarding** | First-run clarity without blocking power users |
| **Empty / loading / error / success** | Every async or list surface has appropriate states |
| **Mobile** | One-handed use, thumb zones, no tiny controls |
| **Consistency** | Same patterns for add, delete, settings, scan across routes |

Output: concise findings (severity + page + suggested fix). Reference this file by path in agent rules.

## Pre-implementation checklist

Before building or extending a screen:

- [ ] **User goal** is stated in one sentence (e.g. “add item to shopping list”).
- [ ] **Next action** is obvious without reading body copy.
- [ ] **Steps** — no unnecessary screens, modals, or duplicate CTAs.
- [ ] **Terminology** matches existing i18n (Swedish/English), not ad-hoc labels.
- [ ] **Mobile** — primary action reachable; forms work on narrow viewports.
- [ ] **Edge cases** — empty list, read-only member, plan limits, network failure.

## Pre-release checklist

Before merge / release:

- [ ] **Loading** — buttons show busy state; lists don’t flash empty-then-full without skeleton or copy.
- [ ] **Error** — user-visible message + recovery (retry, edit, go back).
- [ ] **Empty** — explains why empty and offers one primary next step.
- [ ] **Success** — toast or inline confirmation; destructive actions support undo when feasible.
- [ ] **Accessibility** — interactive elements named; `focus-visible` visible; no icon-only without `aria-label`.
- [ ] **WCAG 2.2 AA (axe)** — `npm run test:e2e -- e2e/accessibility.spec.ts` green for touched P0 routes; see [ACCESSIBILITY.md](./ACCESSIBILITY.md).
- [ ] **Responsiveness** — tested at ~360px width; bottom nav safe area respected (`--content-bottom-safe`).

## UX rules

### Empty states

- Use `EmptyState` (or equivalent): title, short description, **one primary** action (link or button).
- Secondary path (e.g. alternate scan mode) as **text link**, not a second full button.
- Read-only users get explanation, not disabled primary buttons.

### Loading

- Prefer inline loading on the control that triggered the action (`aria-busy`, spinner in button).
- Avoid duplicate loading indicators on the same action.

### Error

- `FeedbackBanner` or field-level errors; never silent failure.
- Copy: what happened + what to do next.
- **Inventory actions** (consume, one-tap finish, staleness batch, bulk clear): failed POST/fetch must show a toast or banner — never fail silently.

### Success

- Brief confirmation (toast or banner); auto-dismiss for non-critical actions.
- Don’t stack multiple success toasts for one gesture.

### Mobile

- Minimum touch target **2.75rem** (44px) for primary controls — see `Button` and `.text-action` in `app.css`.
- Prefer full-width **primary** only when it is the main action for the section.
- Bottom-fixed UI must clear `--content-bottom-safe`.
- **Sticky below header** — app-internal sticky chrome (inventory tabs, filters, settings section nav) uses `top: var(--sticky-below-header)` and a z-index below the header (`--nav-height` + safe-area). Do not use `top: 0` on logged-in scroll surfaces.
- **Undo toast** — when an inline **Ångra** button sits beside the toast (inventory consume, shopping clear, staleness batch), wrap both in `.undo-toast-wrap` and pass `portal={false}` on `Toast` so flex layout stays intact. See [TOAST.md](./TOAST.md).

### Accessibility

- One `<h1>` per page (usually via `AppHeader`).
- Section headings for screen readers when layout is card-based.
- `details`/`summary` allowed for progressive disclosure if the summary text is clear.
- Skip link to `#main-content` on app, marketing, and auth shells.
- Page language matches content (`html lang` via layout load).

### WCAG 2.2 AA checklist (per release)

Reference: [ACCESSIBILITY.md](./ACCESSIBILITY.md). Block merge if P0 axe reports **critical** or **serious** violations.

- [ ] One `h1` per route; landmarks (`header`, `nav`, `main`) consistent
- [ ] Focus visible and not permanently hidden by fixed chrome (bottom nav, cookie bar, toasts)
- [ ] Form errors tied to fields (`aria-describedby`, `aria-invalid`)
- [ ] Links in body text distinguishable without color alone (underline or icon)
- [ ] Icon-only buttons have `aria-label`
- [ ] `prefers-reduced-motion` respected for marketing scroll reveals and motion utilities
- [ ] New or changed **P0 route** includes or updates `e2e/accessibility.spec.ts` coverage
- [ ] Contrast: muted text uses `--color-text-muted`; no opacity-only disabled labels

### Simplicity

- **One primary CTA per screen section** (filled green `Button` / primary link).
- **Secondary** — outline or muted surface (`variant="secondary"`).
- **Tertiary** — ghost button or `.text-action` (text link style); not another filled button.
- **Destructive** — `variant="danger"` or delete flow with confirm tier; never styled like primary.
- Consolidate rare actions into **menus, `details`, or text links** — do not hide **core** tasks (add item, scan, save).

## App UX principles (Skaffu)

1. **Speed** — Fewest taps to log consumption, add to list, or scan.
2. **Minimal typing** — Defaults, scan-first, smart fill; optional fields collapsed.
3. **One-handed mobile** — Primary actions in lower half when possible; large tap targets.
4. **Fast item entry & consumption** — Scan card on home; checkbox-first shopping list.
5. **Understand inventory** — Location tabs, counts, expiry visible without drilling into settings.

**Prioritize:** simplicity, clarity, speed, consistency — over visual complexity, extra buttons, or decorative chrome.

## Button hierarchy (implementation)

| Level | Component / class | When |
|-------|-------------------|------|
| Primary | `Button` default / `.action-primary` / scan-primary links | Main goal of the section |
| Secondary | `Button variant="secondary"` / outline links | Alternate path, cancel in modals |
| Tertiary | `Button variant="ghost"` / `.text-action` | Optional, rare, export, copy list |
| Destructive | `Button variant="danger"` / `DeleteConfirmButton` | Remove, clear, leave household |

Shared tokens: `--page-padding-x`, `--page-section-gap`, `--color-primary` — see `src/app.css` and UX refresh commit `7261e80`.

## High-traffic routes (audit focus)

| Route | Primary action | Common mistakes to avoid |
|-------|----------------|---------------------------|
| `/hem` | Scan barcode | Too many equal chips; duplicate recipe CTAs |
| `/inventory/[location]` | Scan item | Three competing full-width buttons |
| `/inventory/synk` | Finish batch review | Duplicate page title; undo toast under nav |
| `/inventory/foto` | Capture / review | Secondary buttons styled as primary |
| `/inkop` | Add item / smart fill | Export + add + clear as identical buttons |
| `/statistik` | View insight (passive) | Extra CTAs when empty already guides scan |
| `/settings` | Toggles + row navigation | Button per row instead of toggle + link |
| `/recept/[id]` | Börja laga | Hiding steps in accordion/scrollbox; duplicate generator UI |
| `/recept/[id]/laga` | Nästa steg | Bottom nav visible; tiny prev/next; step text below fold |
| Scan flows | Camera / continue | Cancel vs submit same weight |

### Recipe detail and cook mode

- **Generator modal** — settings + compact result list with links; full recipe lives on `/recept/[id]`.
- **Detail page** — all steps visible in a timeline (no `max-height` scroll trap); primary CTA **Börja laga**.
- **Cook mode** — fullscreen, no bottom nav; one step at a time; prev/next ≥44px; safe-area on footer; `aria-live` on step change.
- **Ingredient checklist** — cosmetic localStorage only (v1); do not imply inventory sync.

## Coordinator integration

- UX Review Agent runs **before** feature implementation (design check) and **before release** (checklist above).
- Findings go to the coordinator queue; implementation is a separate assigned task unless bundled in a UX audit ticket.
- Update this file when new patterns are introduced (document the pattern, not every page).

## Post-unified-nav rules (2026-06)

After the four-tab bottom nav (Hem · Skanna · Lager · Äta) + header cart, **in-screen hierarchy** matters more than chrome.

### `/hem` — situationsmedveten hub

1. **Max 3 content blocks** above the fold on mobile (before scroll): status hero, one primary CTA, one compact shortcut row (e.g. inköp-teaser).
2. **Max 1 primary green CTA** per viewport — implemented via `HomeNextAction.svelte` (tom → foto, stale → bekräfta, expiring → generera middag, all good → fotorunda).
3. **Progressive disclosure** — `EngagementStrip`, `HouseholdActivityFeed`, `SkafferapportWidget`, `HomeQuickAdd`, and contextual `MealTimeSuggestions` live behind **“Mer på hem”** (`details`) unless a P0 data trigger requires prominence.
4. **Maintenance is quiet** — merge link and duplicate nudge **only** when `duplicateGroups.length > 0`; pantry status merged into `WeeklyRitualHero` (one synk entry, not hero + status card).
5. **Recipe entry dedup** — `MealTimeSuggestions` on hem only when expiring items **or** active meal slot; not when `WeeklyRitualHero` already surfaces the recipe/plan path.

### Scan & inventory add

6. **Default beats menu** — bottom **Skanna** → last-used scan mode (default photo), not the four-choice hub. Hub via **“Fler sätt”** / `?mode=hub` only.
7. **Foto** — no forced location step; AI infers zone with optional override (`details`).
8. **Inventory location** — one primary **Lägg till varor**; barcode and manual as text links / collapsed **Andra sätt**.

### Planer & inköp

9. **Äta-fliken** owns generera maträtt as primary; hem shows recipe CTA only in expiring/meal-slot context.
10. **Planer calendar** — collapsed by default until `plannedMealCount ≥ 1` or user expands.
11. **Smart fill** — after fill: scroll to list + success feedback (celebration when ≥15 items).

### Overlays

12. **Max one modal overlay** at a time — onboarding guide, page hints, and activation celebration are mutually exclusive; embedded onboarding scan replaces the guide sheet (not stacked). **Session mutex:** at most one promotional overlay per tab (priority: onboarding → receipt-success → share → survey → celebration → hint → invite). Household invite: global modal **or** inköp banner per day, never both.

See [`UX_AUDIT_2026-05.md`](./UX_AUDIT_2026-05.md) for route-by-route findings.

## Changelog

| Date | Change |
|------|--------|
| 2026-06-25 | CTA declutter pass: overlay session mutex, invite dedup, planer/hem/lager/scan hierarchy; Skafferapport home on `/statistik` |
| 2026-06-08 | Post-unified-nav hem/planer/scan rules; UX audit reference |
| 2026-06-02 | Initial guidelines + button hierarchy; audit of hem, inventory, inköp, settings, statistik |
| 2026-06-02 | Partial consumption (lite/halv/egen mängd); Planer banner tied to hem/expiry |
| 2026-06-02 | Kvitto-autopilot v1: one primary "Lägg till i lager" per suggestion; dismiss as text link |
| 2026-06-05 | WCAG 2.2 AA checklist + axe P0 gate; see ACCESSIBILITY.md |
| 2026-06-06 | Recipe detail `/recept/[id]` + cook mode `/recept/[id]/laga` patterns |
| 2026-06-08 | Sticky-below-header token + undo-toast `portal={false}` pattern |
