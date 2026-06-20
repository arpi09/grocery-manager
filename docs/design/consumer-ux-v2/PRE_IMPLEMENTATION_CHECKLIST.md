# Pre-implementation checklist

Complete before opening the Shopping V2 implementation PR(s).  
Design illustrations are **locked** — no new variants.

## Copy gate

- [ ] **Copy approved (SV)** — [`copy/shopping-v2.sv.md`](copy/shopping-v2.sv.md) (+ home/pantry SV if reviewed early)
- [ ] **Copy approved (EN)** — [`copy/shopping-v2.en.md`](copy/shopping-v2.en.md)

## Device review

- [ ] **Real-device review on phone (390×844)** — open [`screens/shopping-plan.html`](screens/shopping-plan.html) and [`screens/shopping-trip.html`](screens/shopping-trip.html) via [`index.html`](index.html), or local dev build after flag on
- [ ] **Mobile-first spacing pass** — thumb reach on Shop CTA, mode toggle, bottom nav clearance
- [ ] **Scroll-depth pass** — Plan: memory + summary + CTA without scroll for typical ≤9-item list; Home mockup: greeting + status + För dig + CTA + chips above fold (see [`screens/home.html`](screens/home.html))

## USER_LOCAL

- [ ] **USER_LOCAL yes on Shopping Plan screen**
- [ ] **USER_LOCAL yes on Shopping Trip screen**
- [ ] **USER_LOCAL yes on Home screen** (for later Home phase; optional now)
- [ ] **USER_LOCAL yes on Pantry screen** (for later Pantry phase; optional now)

## Engineering readiness

- [ ] [`SHOPPING_V2_IMPLEMENTATION_PLAN.md`](SHOPPING_V2_IMPLEMENTATION_PLAN.md) reviewed — open decisions §14 resolved
- [ ] [`LOCK.md`](LOCK.md) implementation order acknowledged: Shopping → Pantry → Home

## Sign-off

| Role | Name | Date |
|------|------|------|
| Product / PO | | |
| Copy (SV) | | |
| Copy (EN) | | |
