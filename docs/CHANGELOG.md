# Changelog

All notable changes merged to `master` are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

CalVer GitHub Releases (`YYYY.M.D`) are created **after successful deploy**, not on merge. See [RELEASES.md](./RELEASES.md).

## [Unreleased]

### Added
- feat(ci): PR-first workflow, CHANGELOG bot, CalVer releases ([#125](https://github.com/arpi09/grocery-manager/pull/125)) — Add PR template, agent rule (pr-workflow.mdc), and docs updates for PR-first shipping (not trunk-only).

### Fixed
- fix(hem): remove brain and waste cards above greeting ([#126](https://github.com/arpi09/grocery-manager/pull/126)) — Remove BrainHomeCard and WastePreventedCard from HomeV2 above the briefing greeting on `/hem`.
- fix(inventory): POST bulk infer expiry on /inventory/all ([#127](https://github.com/arpi09/grocery-manager/pull/127)) — Add `bulkInferMissingExpiryAllLocations` server helper and `bulkInferExpiry` POST action on `/inventory/all`.

### Changed

## [2026.6.24] - 2026-06-24

Prod deploy @ `a9ddaabca` — Fas A.

### Added

- Activation funnel improvements (onboarding → inköp core loop).
- Receipt wow flow and overlay coordinator.

### Changed

- Deploy-critical E2E coverage validated on prod SHA.
