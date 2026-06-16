# DESIGN_SYSTEM_V2

Mobile UX recovery sprint — enforcement reference (2026-06).

## Spacing

Use `--space-xs` through `--space-xl` only. No hardcoded `0.45rem` / arbitrary padding in product surfaces.

## Touch targets

Minimum `--touch-target-min` (44px) for all interactive controls: buttons, checkboxes, row actions, chips.

## Button hierarchy

| Variant | Use |
|---------|-----|
| **primary** (`btn-primary`) | One green action per surface — checkoff CTA, add to list, scan receipt |
| **secondary** | Alternate confirm paths |
| **ghost** | Tertiary / cancel / overflow |

`EmptyState` uses `btn-primary` / `btn-ghost` anchor classes aligned with `Button.svelte`.

## Badges

Tones: `default` | `warning` | `location`. Max **2** per inventory row; expiry prefers **text meta** on secondary line.

## List hierarchy

Shared `.product-row` rhythm:

- Title: 0.875rem semibold
- Meta: 0.75rem muted
- Padding: `var(--space-sm) var(--space-md)`

**Lists and tables:** use `SkaffuList` / `SkaffuListItem` for row lists and `SkaffuDataTable` for tabular inventory — not raw `<ul>` stacks or hand-rolled card tables. SMUI theme tokens live in `src/theme/` and `src/lib/design/skaffu-smui-theme.ts`.

**List panel shell:** mobile/desktop list surfaces use `SkaffuListPanel` (shared border, radius, padding). Inventory and shopping compose rows inside the panel; inventory keeps `LocationTab` in sticky chrome above the panel.

**Filter header:** `SkaffuFilterBar` wraps search + expiry/section chips inside the panel header (inventory mobile); desktop inventory may keep toolbar in sticky chrome.

**Settings (iOS hub):** `/settings` hub uses `SkaffuSettingsGroup`, `SkaffuSettingsLinkRow`, and drill-down pages via `SettingsDrilldownLayout`. Toggle rows inside panels use `SkaffuSettingsToggleRow` (title left, switch right on all breakpoints). Prefer route paths over `#hash` anchors.

## Dashboard cards

Home (`/hem`) uses `SkaffuCard.svelte` (`@smui/card` + `skaffu-card` overrides) composed via `HomeDashboardCard` and domain cards (`HomePantryCard`, `HomeShoppingCard`, `HomeExpiringCard`, `HomeAttentionCard`):

- Padding: `var(--space-md)`
- Border-radius: `var(--radius-lg)`
- Border: `1px solid var(--color-border)` — no heavy shadow
- Tones: `default` | `attention`
- Clickable cards: hover/focus ring via `--focus-ring-color`

**Priority layout:** `HomeDashboardCard` accepts `size: 'hero' | 'default' | 'compact'` plus optional icon snippet. `HomeDashboard` drives card order and size from `homeState` — expiring hero spans full width when `homeState === 'expiry'`; shopping hero when `lista_ready`; pantry/shopping compact when expiry or cold.

## Sheets

Filter/add sheets use `Modal variant="sheet"` and `--z-sheet` stacking above bottom nav.

## News page

`/nyheter` lists **major product milestones** only (launch, Brain, Pro, etc.) — not every UI sprint. Add a new entry only when PO approves.

**Illustration ids:** set `illustration` in `app-news.ts` (`NewsIllustrationId`: `launch`, `brain`, `scan`, `onboarding`, `recipe`, `push`, `inventory-table`). Each id maps to a distinct SVG in `NewsPathIllustration.svelte`. Scroll reveal stagger uses illustration id, not list index (`NewsMilestoneCard`).

## Scan hub

Scan mode choice (`ScanModeHub`) uses compact animated SVGs via `ScanHubIllustration.svelte` (`receipt` | `photo` | `barcode`) inside the icon wrap. Motion respects `prefers-reduced-motion: reduce` (static SVG fallback).
