---
name: skaffu-core-loop-change
description: Implements product changes aligned with Skaffu weekly shopping core loop (inkop, household, eat-first, onboarding). Use for hem, inkop, nav, onboarding, receipt-to-list flows.
---

# Core-loop product change

## Read first

[docs/CURRENT_REALITY.md](../../docs/CURRENT_REALITY.md) + [skaffu-core-loop.mdc](../../.cursor/rules/skaffu-core-loop.mdc)

## Checklist

- [ ] Stärker delad inköpslista + 2-medlems-handel?
- [ ] Default path = `/inkop` (inte scan/planer som hero)?
- [ ] Partner invite/share synlig på inkop (inte 3 modals på hem)?
- [ ] Eat-first/expiry → lista eller ät (inte parallell meal-AI)?
- [ ] Receipt/replenishment landar på inkop efter import?
- [ ] Uppdatera CURRENT_REALITY om nav/onboarding ändras
- [ ] Integration test för server actions; E2E endast om auth/nav P0

## Key files

- `src/lib/navigation/app-home.ts`, `nav-config.ts`
- `src/routes/inkop/`, `InkopHouseholdInviteBanner.svelte`, `ShoppingListPanel.svelte`
- `src/lib/components/organisms/HomeDashboard.svelte`, `OnboardingGuide.svelte`
- `src/lib/utils/onboarding.ts`, `post-register.ts`

## Anti-patterns

Ny bottom-tab för scan/ät · Wrapped hero på hem · SmartShoppingFill som primär lista-fill · Grannskafferiet i onboarding
