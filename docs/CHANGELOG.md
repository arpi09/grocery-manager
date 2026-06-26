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
- feat(brain): full integration — scan hub, shelf-life parity, V2 surfaces ([#141](https://github.com/arpi09/grocery-manager/pull/141)) — Restore scan hub navigation and align shelf-life inference (`inferShelfLifeWithRefinement`) with golden tests and adapter parity

### Fixed
- fix(hem): remove brain and waste cards above greeting ([#126](https://github.com/arpi09/grocery-manager/pull/126)) — Remove BrainHomeCard and WastePreventedCard from HomeV2 above the briefing greeting on `/hem`.
- fix(inventory): POST bulk infer expiry on /inventory/all ([#127](https://github.com/arpi09/grocery-manager/pull/127)) — Add `bulkInferMissingExpiryAllLocations` server helper and `bulkInferExpiry` POST action on `/inventory/all`.
- fix(inventory): dedupe insights each keys and harden expiry cron ([#138](https://github.com/arpi09/grocery-manager/pull/138)) — Fix recurring prod client crash \https://svelte.dev/e/each_key_duplicate\ on \/inventory\ when multiple brain insights share the same action + date.
- fix(ux): CTA declutter across hem, planer, scan, and statistik ([#140](https://github.com/arpi09/grocery-manager/pull/140)) — Reduce competing CTAs on hem (briefing hub), veckoplan/planer, inventory add, and scan hub (last-used scan mode as default).
- fix(e2e): scan hub, planer calendar, inventory add sheet + design kit ([#142](https://github.com/arpi09/grocery-manager/pull/142)) — Redirect bare `/scan` to canonical hub URL with `mode=hub` so E2E and nav agree
- fix(deploy): retry Firebase IAM 409 and stabilize mobile filter E2E ([#143](https://github.com/arpi09/grocery-manager/pull/143)) — Add `scripts/firebase-deploy-apphosting.sh` with exponential backoff (up to 4 attempts) for transient Firebase IAM 409 / concurrent setIamPolicy errors during App Hosting deploy
- fix(deploy): harden IAM 409 retries and add service account auth ([#144](https://github.com/arpi09/grocery-manager/pull/144)) — Increase Firebase deploy IAM 409 retries to 8 attempts with exponential backoff + jitter (45s base)
- fix(deploy): IAM audit — pintags off, grant script, SA auth docs ([#145](https://github.com/arpi09/grocery-manager/pull/145)) — Audit Firebase App Hosting IAM/deploy chain; document runtime vs CI service accounts and Secret Manager bindings.
- fix(deploy): require FIREBASE_SERVICE_ACCOUNT — remove FIREBASE_TOKEN fallback from deploy.yml; fail fast without GCP SA secret; add `scripts/setup-firebase-deploy-sa.sh`; CI deploy uses ADC only.
- fix(deploy): require FIREBASE_SERVICE_ACCOUNT for CI deploy ([#146](https://github.com/arpi09/grocery-manager/pull/146)) — **Root cause:** PR #145 added SA-first auth with `FIREBASE_TOKEN` fallback, but `FIREBASE_SERVICE_ACCOUNT` was never added to GitHub Secrets — only `FIREBASE_TOKEN` exists — so deploy kept using the deprecated CI token (IAM 409 retries).
- fix(deploy): extend deploy job timeout to 120m ([#147](https://github.com/arpi09/grocery-manager/pull/147)) — Raise deploy job `timeout-minutes` from 60 to 120 so Firebase IAM 409 retries can reach attempt 8 (backoff sum ~95min plus deploy attempts).

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
