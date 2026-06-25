# Changelog

All notable changes merged to `master` are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

CalVer GitHub Releases (`YYYY.M.D`) are created **after successful deploy**, not on merge. See [RELEASES.md](./RELEASES.md).

## [Unreleased]

### Added
- feat(ci): PR-first workflow, CHANGELOG bot, CalVer releases ([#125](https://github.com/arpi09/grocery-manager/pull/125)) — Add PR template, agent rule (pr-workflow.mdc), and docs updates for PR-first shipping (not trunk-only).
- feat(brand): palette tokens and local preview (Fas 1) ([#128](https://github.com/arpi09/grocery-manager/pull/128)) — Expand `brand-colors.ts` with locked logo core, four palette tracks (heritage/fresh/warm/crisp), and CSS var mapping helpers.
- feat(brand): Fas 2 fresh palette rollout ([#129](https://github.com/arpi09/grocery-manager/pull/129)) — **CSS pipeline:** `generate-brand-css.mts` reads `BRAND_PALETTE` (default `fresh`), emits `brand-colors.generated.css` + SCSS; `predev`/`prebuild` hooks; `apphosting.yaml` sets `BRAND_PALETTE: fresh`.
- feat(nav): unified back navigation with smart fallback ([#136](https://github.com/arpi09/grocery-manager/pull/136)) — Add \BackLink\ atom and \
- feat(onboarding): LearningAiBadge and fresh onboarding UX ([#137](https://github.com/arpi09/grocery-manager/pull/137)) — LearningAiBadge with learning-AI gradient on activation surfaces
- feat(shelf-life): prompt-first quality — GPT refinement, UI transparency, proportional grace ([#139](https://github.com/arpi09/grocery-manager/pull/139)) — **AI / shelf-life:** Wire GPT refinement, shelf-life prompt v5, and golden tests so receipt/scan predictions are regression-guarded and iteratively improved.

### Fixed
- fix(hem): remove brain and waste cards above greeting ([#126](https://github.com/arpi09/grocery-manager/pull/126)) — Remove BrainHomeCard and WastePreventedCard from HomeV2 above the briefing greeting on `/hem`.
- fix(inventory): POST bulk infer expiry on /inventory/all ([#127](https://github.com/arpi09/grocery-manager/pull/127)) — Add `bulkInferMissingExpiryAllLocations` server helper and `bulkInferExpiry` POST action on `/inventory/all`.
- fix(inventory): dedupe insights each keys and harden expiry cron ([#138](https://github.com/arpi09/grocery-manager/pull/138)) — Fix recurring prod client crash \https://svelte.dev/e/each_key_duplicate\ on \/inventory\ when multiple brain insights share the same action + date.

### Changed

## [2026.6.24] - 2026-06-24

Prod deploy @ `a9ddaabca` — Fas A.
- chore(ci): Dependabot PR metadata, auto-merge, monthly deps CHANGELOG ([#131](https://github.com/arpi09/grocery-manager/pull/131)) — Extend `dependabot.yml` with labels, assignee (`arpi09`), and per-group labels for production/dev minor/patch groups
- docs: professional public README polish ([#134](https://github.com/arpi09/grocery-manager/pull/134)) — Rewrite `README.md` with Skaffu logo, public-facing structure, doc links instead of long feature walkthrough; remove `git init` section and personal emails
- chore(ci): error-export workflow_dispatch for prod logs ([#135](https://github.com/arpi09/grocery-manager/pull/135)) — Add manual workflow_dispatch for error-export so agents can pull prod error logs without ad-hoc scripts.

### Added

- Activation funnel improvements (onboarding → inköp core loop).
- Receipt wow flow and overlay coordinator.

### Changed

- Deploy-critical E2E coverage validated on prod SHA.
