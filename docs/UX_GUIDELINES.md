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

### Success

- Brief confirmation (toast or banner); auto-dismiss for non-critical actions.
- Don’t stack multiple success toasts for one gesture.

### Mobile

- Minimum touch target **2.75rem** (44px) for primary controls — see `Button` and `.text-action` in `app.css`.
- Prefer full-width **primary** only when it is the main action for the section.
- Bottom-fixed UI must clear `--content-bottom-safe`.

### Accessibility

- One `<h1>` per page (usually via `AppHeader`).
- Section headings for screen readers when layout is card-based.
- `details`/`summary` allowed for progressive disclosure if the summary text is clear.

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
| `/inventory/foto` | Capture / review | Secondary buttons styled as primary |
| `/inkop` | Add item / smart fill | Export + add + clear as identical buttons |
| `/statistik` | View insight (passive) | Extra CTAs when empty already guides scan |
| `/settings` | Toggles + row navigation | Button per row instead of toggle + link |
| Scan flows | Camera / continue | Cancel vs submit same weight |

## Coordinator integration

- UX Review Agent runs **before** feature implementation (design check) and **before release** (checklist above).
- Findings go to the coordinator queue; implementation is a separate assigned task unless bundled in a UX audit ticket.
- Update this file when new patterns are introduced (document the pattern, not every page).

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial guidelines + button hierarchy; audit of hem, inventory, inköp, settings, statistik |
| 2026-06-02 | Partial consumption (lite/halv/egen mängd); Planer banner tied to hem/expiry |
| 2026-06-02 | Kvitto-autopilot v1: one primary "Lägg till i lager" per suggestion; dismiss as text link |
