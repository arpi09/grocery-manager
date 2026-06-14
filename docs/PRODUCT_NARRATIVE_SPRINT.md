# Product Narrative Implementation Sprint

**Sprint goal:** Ship the smallest strong narrative slice today — lista-first first 60s, briefing home, kvitto-primary scan, clearer nav — without new Brain models, migrations, or ML.

**Baseline master:** after #57 + #69 merge. **Execution:** parallel agent branches, merge separately, deploy once at end.

---

## Sprint Goal

A new user understands Skaffu in 60 seconds as **delad veckolista + hushållsminne**; home shows **one next action** (not three empty sections); scan leads with **kvitto**; mobile nav surfaces **Inköp + Skanna** without header-only scan.

---

## Implementation Slices

### S1 — First 60 Seconds + Onboarding (`feat/narrative-onboarding-v1`)

| | |
|---|---|
| **Mode** | COORDINATOR_AGENT |
| **Files** | `OnboardingGuide.svelte`, `onboarding-steps.ts`, `onboarding.ts` (copy only if needed), `sv.json` / `en.json`, `ActivationCelebration.svelte` (secondary CTA) |
| **Changes** | Welcome: **lista primär** — body explains veckohandel; primary CTA → `/inkop?quick=1` or inline 3 chip quick-add; secondary collapsed *Fyll skafferi* links (kvitto · foto · streckkod · manuellt). One-liner Brain: *Skaffu lär sig när du använder appen*. Remove photo-as-primary on welcome. Path guide defaults to `shopping`. Celebrate copy lista-first. |
| **Tests** | `onboarding.test.ts`, `e2e/critical-flows.spec.ts` (register → hem → lista path) |
| **Risk** | Low — UI/copy + navigation only |
| **Rollback** | Revert branch |
| **DoD** | E2E: new user completes activation via 3 list items without foto CTA as primary |

### S2 — Home V4 (`feat/narrative-home-v4`)

| | |
|---|---|
| **Mode** | COORDINATOR_AGENT |
| **Files** | `HomeDashboard.svelte`, `hem/+page.server.ts` (optional `homeState` field), `sv.json` / `en.json` |
| **Changes** | Derive `homeState`: `cold` \| `lista_ready` \| `expiry` \| `steady`. **Cold:** single hero card (skapa veckans lista), **hide** empty §2+§3 blocks (not three empty headings). Engaged: max 3 sections — (1) denna vecka hero CTA, (2) rekommenderar max 2 rows, (3) hushållet one-line summary + link. Remove foto-primary from `EmptyState` primary CTA → lista quick-add. Tagline engaged only when `steady`. |
| **Tests** | `e2e/home` or critical-flows hem empty state |
| **Risk** | Medium — touches `HomeDashboard` (conflict rule: one PR only) |
| **Rollback** | Revert branch |
| **DoD** | Cold pantry: one CTA visible, no triple empty sections |

### S3 — Scan V2 (`feat/narrative-scan-v2`)

| | |
|---|---|
| **Mode** | COORDINATOR_AGENT |
| **Files** | `ScanModeHub.svelte`, `ScanModeTabs.svelte`, `last-scan-defaults.ts`, `sv.json` / `en.json` |
| **Changes** | Hub hero = **kvitto** (shorter title + CTA). Secondary row: foto · streckkod · manuellt. Tabs order: Kvitto · Foto · Streckkod · Manuellt. Default last mode `receipt` for users with no inventory history (keep photo for returning). Less subtitle text. |
| **Tests** | `e2e/scan` or navigation scan specs |
| **Risk** | Low |
| **Rollback** | Revert branch |
| **DoD** | `/scan` hub testid shows receipt hero first; tabs receipt first |

### S4 — Navigation V2 (`feat/narrative-nav-v2`)

| | |
|---|---|
| **Mode** | COORDINATOR_AGENT |
| **Files** | `nav-config.ts`, `MainNavMobile.svelte`, `MainNav.svelte`, `NavMoreSheet.svelte`, `e2e/navigation.spec.ts` |
| **Changes** | Mobile bottom **4 tabs:** Hem · Inköp · Skanna · Mer. Move **Lager** to Mer sheet (stale badge on Lager row). Remove Skanna from header utility on mobile (now bottom). Desktop: keep Lager visible in top row. |
| **Risk** | Medium — E2E nav tests must update |
| **Rollback** | Revert branch |
| **DoD** | E2E: 4 bottom tabs; scan reachable without header icon |

### S5 — Brand micro + Vision anchor (`feat/narrative-brand-vision`)

| | |
|---|---|
| **Mode** | COORDINATOR_AGENT |
| **Files** | `AppLogo.svelte` (shelf stroke +0.15 opacity), `docs/SKAFFU_2026_VISION.md`, `docs/BRAND_REFRESH_BRIEF.md`, `register` i18n subtitle fix |
| **Changes** | Vision one-liner + main loop doc. Brand brief: evolution not rebrand. Register meta lista-first not pantry-scanner. Optional logo shelf line weight tweak only. |
| **Tests** | Docs only + visual |
| **Risk** | Low |
| **DoD** | `SKAFFU_2026_VISION.md` exists; register copy aligned |

### S6 — Deploy (`COORDINATOR_AGENT` after merges)

| | |
|---|---|
| **Files** | `docs/CURRENT_REALITY.md` |
| **DoD** | `quality / quality` green on master tip; `deploy.yml` success; prod SHA updated |

---

## Agent Assignments

| Agent | Slice | Branch |
|-------|-------|--------|
| A | S1 Onboarding | `feat/narrative-onboarding-v1` |
| B | S2 Home V4 | `feat/narrative-home-v4` |
| C | S3 Scan V2 | `feat/narrative-scan-v2` |
| D | S4 Nav V2 | `feat/narrative-nav-v2` |
| E | S5 Brand + Vision | `feat/narrative-brand-vision` |
| F | Merge + Deploy | after CI green |

---

## Merge Order

1. `feat/narrative-brand-vision` (docs only, no code conflict)
2. `feat/narrative-scan-v2` (isolated)
3. `feat/narrative-onboarding-v1`
4. `feat/narrative-home-v4` (rebase on master if onboarding merged)
5. `feat/narrative-nav-v2` (rebase last — E2E touch many files)
6. Open queue: **#73** inkop slice 3 → **#74** inventory slice 1 → **#55** stripe yaml
7. Deploy + `CURRENT_REALITY`

**Conflict rule:** Only one PR on `HomeDashboard`, `ShoppingListPanel` at a time. Narrative home before merging #73 if both touch inkop CTAs.

---

## Deploy Plan

- Merge narrative branches sequentially when each `quality / quality` green
- Single `gh workflow run deploy.yml` on final master tip
- Update `CURRENT_REALITY.md` with prod SHA + narrative sprint summary

---

## What Will Be Live Today (target)

- Lista-first onboarding + Brain learning one-liner
- Home cold start without triple empty dashboard
- Scan hub kvitto-primary
- Mobile nav: Inköp + Skanna in bottom bar
- Vision doc + register copy alignment
- Plus already-merged #69 photo activation

---

## What Is Explicitly Not Included

- New Brain predictors / models / ML
- Migrations
- V2.2 cadence one-liner (visibility slice — separate tiny PR if time)
- Full inventory Product Row (#74) — parallel queue, not narrative blocker
- Grannskafferiet promotion
- App Store / Stripe launch
- Full logo rebrand
- Home V4 server-side cadence aggregates (read-model only if zero-risk)

---

## Execution Modes Legend

| Mode | Meaning |
|------|---------|
| COORDINATOR_AGENT | Agent implements branch + PR |
| COORDINATOR_LOCAL | Shell merge/deploy |
| USER_LOCAL | PO smoke on prod after deploy |
| BLOCKED | Conflict or CI red |
