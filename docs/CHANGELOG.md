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
- feat(mobile): store beta blockers for TestFlight/Play internal ([#156](https://github.com/arpi09/grocery-manager/pull/156)) — **iOS:** `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` (SV) for scan/receipt flows
- feat(inventory): shelf tiles, consume sheet, and insights CTAs ([#165](https://github.com/arpi09/grocery-manager/pull/165)) — Dense ProductTile with Använd action and zone grid polish
- feat(inventory): list row actions and mobile data grid polish ([#166](https://github.com/arpi09/grocery-manager/pull/166)) — InventoryListRowActions with Använd and row menu on location list grid
- feat(inkop): compact share menu and shopping layout polish ([#167](https://github.com/arpi09/grocery-manager/pull/167)) — ShoppingListShareMenu portal/compact header and overlap fixes
- feat(planer): progressive disclosure on Eat page ([#171](https://github.com/arpi09/grocery-manager/pull/171)) — Add reusable \ExpandableCopy\ molecule with keyboard-accessible Read more / Läs mer toggles (\ria-expanded\, \ria-controls\)
- feat(ai): Claude Code parity with Cursor agent setup ([#172](https://github.com/arpi09/grocery-manager/pull/172)) — Add \CLAUDE.md\ and \docs/AI_TOOLING.md\ for unified Cursor + Claude Code onboarding
- feat(ai-tooling): governance dispatch roster for Claude Code ([#175](https://github.com/arpi09/grocery-manager/pull/175)) — Definierade i `.cursor/agents/` (source of truth) → genereras till `.claude/agents/` av `sync:ai-tooling`.
- feat(ux): first-run empty states for skafferi + inkopslista ([#191](https://github.com/arpi09/grocery-manager/pull/191)) — **Ny molekyl `FirstRunEmptyState`** — ikon-platta 60×60, tvåradig display-rubrik (2rem/1.12/−0.03em), brödtext (32ch), fullbredds-CTA (52px, primary, mjuk skugga, +-glyf `aria-hidden`), helper-rad med ↺-chip. Rise-in-animation, avstängd under `prefers-reduced-motion`. Fokusring 3px `--color-text`.
- feat(hem): Hushållspuls-kort ersätter För dig-expiring + pulsraden ([#193](https://github.com/arpi09/grocery-manager/pull/193)) — Nytt konsoliderat **Hushållspuls**-kort högst upp i home v2-briefingen (design handoff variant 2a): Går ut snart (med quick-add till delade inköpslistan), Inköpslistan (antal + Öppna → /inkop), Senaste aktivitet samt medlemsavatarer.
- feat(inventory): swipe-to-use rows with slim resting state ([#197](https://github.com/arpi09/grocery-manager/pull/197))
- feat(inkop): butikssäkert Handla-läge — ångra, fanns inte, live-total, peek-plock ([#203](https://github.com/arpi09/grocery-manager/pull/203)) — **Ångra senaste plock** — textknapp under fokus-kortet och på klarkortet (i18n-nycklarna `undoCta/undoAria` fanns redan men renderades aldrig). Feltap i butik är inte längre permanent.
- feat(inkop): Packa upp — batch-brygga checkoff→skafferi vid trip complete ([#205](https://github.com/arpi09/grocery-manager/pull/205)) — **Ingen modal per plock i butiken** — shop-läget skickar `bridge=defer` på toggle; ask-läget lever kvar endast i checklist-vyn. (Detta är den A-punkt som medvetet väntade på B för atomiskt byte.)
- feat(lista): gäst-checkoff på delad lista — handla ihop utan konto ([#206](https://github.com/arpi09/grocery-manager/pull/206)) — **Live gästlista** — `/lista/[token]` visar hushållets faktiska lista (obockade rader med checkbox + "Plockade (N)"-sektion med strykning) i stället för den frusna snapshoten. Snapshot-vyn ligger kvar som fallback om live-upplösningen fallerar.
- feat(onboarding): v8 server-prep — starter-bulkflow, telemetrityper, share-invite-util ([#207](https://github.com/arpi09/grocery-manager/pull/207)) — Del 1/3 av onboarding v8 (Flödet — 4 skärmar, 4 tap, wow-öppning). **Ingen synlig ändring** — ren serverförberedelse.
- feat(ai): uppgradera OpenAI-modeller till gpt-5.4-mini/nano ([#208](https://github.com/arpi09/grocery-manager/pull/208)) — Byter modelldefaults i `src/lib/server/openai.ts`: `gpt-4.1-mini` → **gpt-5.4-mini**, `gpt-4.1-nano` → **gpt-5.4-nano**. gpt-4.1-familjen är avlistad från OpenAI:s prissida; vi körde på en förra generationens modell.

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
- fix(deploy): correct IAM 409 detection, fail fast on 403 ([#150](https://github.com/arpi09/grocery-manager/pull/150)) — Fix \is_iam_409\: remove broad \setIamPolicy\ match that retried HTTP 403 as 409 for hours
- fix(stripe): align API version with Stripe SDK types ([#152](https://github.com/arpi09/grocery-manager/pull/152)) — Update Stripe `apiVersion` to `2026-06-24.dahlia` so `svelte-check` passes on master and open PRs.
- fix(hem): remove brain score percent and fix card spacing ([#151](https://github.com/arpi09/grocery-manager/pull/151)) — Remove Hushållsminne · X% from BrainHomeCard (rest of card unchanged)
- fix(deploy): queue production deploy attempts ([#153](https://github.com/arpi09/grocery-manager/pull/153)) — Queue production deploy workflow runs instead of cancelling in-progress Firebase App Hosting deploys.
- fix(deploy): fail fast on IAM 409 with capped retries ([#154](https://github.com/arpi09/grocery-manager/pull/154)) — Reduce Firebase deploy IAM 409 retries from 8× (~2h backoff) to 3× with 30s base delay and 5min total retry cap
- fix(ci): repair invalid UTF-8 in deploy workflow ([#155](https://github.com/arpi09/grocery-manager/pull/155)) — Replace three invalid UTF-8 bytes (0x9D) in `deploy.yml` that caused GitHub to reject the workflow (0 jobs, no `workflow_dispatch`).
- fix(deploy): pin firebase-tools 14.9.0 to skip per-deploy project IAM ([#157](https://github.com/arpi09/grocery-manager/pull/157)) — Pin `firebase-tools@14.9.0` in deploy/grant scripts — versions >=14.10 call project `setIamPolicy` on every App Hosting deploy to reconcile `firebase-app-hosting-compute@` roles, causing early HTTP 409 before rollout (even after secret pre-grant).
- fix(deploy): pin Node 24.18.0 for firebase-tools ADC auth ([#158](https://github.com/arpi09/grocery-manager/pull/158)) — Deploy job ran `npx firebase-tools@14.9.0` without `setup-node`, using runner default Node 24.17.x
- fix(deploy): setup Node 24.18 before firebase ADC deploy ([#159](https://github.com/arpi09/grocery-manager/pull/159)) — Add `setup-node` with `.nvmrc` (24.18.0) before `google-github-actions/auth` in deploy job
- fix(prod): reload stale chunks and isolate expiry cron user failures ([#160](https://github.com/arpi09/grocery-manager/pull/160)) — Auto-reload once when a stale tab hits a removed JS chunk after deploy (fixes CLIENT /inkop dynamic import 404s).
- fix(prod): expiry cron date binding and chunk error noise ([#161](https://github.com/arpi09/grocery-manager/pull/161)) — Fix Postgres date comparison in expiry-reminder claim queries (Date was bound as JS toString, causing cron 500s for affected users)
- fix(test): receipt-import integration stale purchasedAt filter ([#162](https://github.com/arpi09/grocery-manager/pull/162)) — Remove fixed purchasedAt from receipt-import integration test so shelf-life inference does not auto-expire items before list assertion
- fix(ci): create empty .env for guides generate cron ([#163](https://github.com/arpi09/grocery-manager/pull/163)) — Fix **Guides generate cron** failure (`node: .env: not found`, exit 9) by creating an empty `.env` before `npm run guides:publish-next`.
- fix(nav): enable Pantry V2 flag in nav and dev defaults ([#164](https://github.com/arpi09/grocery-manager/pull/164)) — Apply `PANTRY_UX_V2` in More menu and desktop nav links to `/inventory`
- fix(nav): add profile icon and refresh settings glyph ([#168](https://github.com/arpi09/grocery-manager/pull/168)) — Add `profile` to nav icon config
- fix(inventory): portal row menu and add delete item action ([#170](https://github.com/arpi09/grocery-manager/pull/170)) — Fix invisible inventory row ⋮ menu by portaling the panel to `body` with `position: fixed` (same pattern as `RowOverflowMenu` / `ShoppingListShareMenu`)
- fix(email): use canonical house mark in branded email header ([#178](https://github.com/arpi09/grocery-manager/pull/178)) — Replace the S monogram placeholder in the branded email header with the canonical Skaffu house mark (`pwa/icon-192.png`, absolute URL via `getAppOrigin()`)
- fix(onboarding): remove duplicate nav row, empty-state copy, stepper fit ([#181](https://github.com/arpi09/grocery-manager/pull/181)) — Onboarding-dialogen (aktiveringsflödet) städas upp utifrån mobil-screenshot på steg 3 av 5:
- fix(mobile-ux): onboarding defer/Kivra, scan polish, hem pulse, pantry cleanup ([#182](https://github.com/arpi09/grocery-manager/pull/182)) — "Kanske senare" gjorde ingenting (flaggan lästes aldrig) — pausar nu flödet för sessionen och stänger modalen.
- fix(pantry): tile action buttons overflow card on mobile ([#184](https://github.com/arpi09/grocery-manager/pull/184))
- fix(onboarding): hide Kivra hints when forward flag is off ([#185](https://github.com/arpi09/grocery-manager/pull/185))
- fix(db): pass db handle explicitly to startup seeds — kills cold-start init race ([#186](https://github.com/arpi09/grocery-manager/pull/186)) — `ensureDefaultAdminUser(db)` / `ensureDefaultHousehold(db)` tar drizzle-handlen som parameter — ingen `getDb()`-import kvar i seed-filerna (cykeln bruten; endast type-import kvar).
- fix(shopping): checklist checkoff button unclickable — col-checkoff collapsed to 10px ([#192](https://github.com/arpi09/grocery-manager/pull/192)) — `table-layout: fixed` + `width: 1%` collapses `.col-checkoff` to ~10px; MDC's `overflow: hidden` clips the 44px checkoff button so its center lands in `col-qty` → mouse clicks (and Playwright without force) hit the qty cell instead of the button. Give the column a real width: `calc(var(--touch-target-min) + 2 * var(--space-sm))` (60px). Mobile (<640px) unaffected (own flex layout).
- fix(receipt): glass-sammansattningar + kategorihint till platsforslag; dedupe overflow-platta ([#194](https://github.com/arpi09/grocery-manager/pull/194)) — Heuristiken matchade `\bglass\b` — svenska sammansättningar ("Gräddglass Vanilj", "Tofta persikaglass", "Toftagubbeglass") har ingen ordgräns före "glass" och föll igenom till skafferi. Nu matchas glass-suffixet (undantag "glass burk/flaska" kvar) + `sorbet`/`glasspinne`.
- fix(data-grid): real widths for all narrow columns collapsed by fixed table layout ([#196](https://github.com/arpi09/grocery-manager/pull/196)) — Follow-up to #192 (same root cause, remaining columns): `table-layout: fixed` resolves every `width: 1%` column to ~10px and MDC's `overflow: hidden` clips the content — on desktop the row checkbox, product avatar, quantity text, expiry badge and row-action buttons were clipped or invisible in the shopping checklist grid and pantry grids (/inventory/all, /inventory/[location]).
- fix(receipt): NaN expiry dates on import when AI prediction is not a date ([#198](https://github.com/arpi09/grocery-manager/pull/198))
- fix(ci): run receipt expiry-estimate specs + a11y dot role + e2e failure artifacts ([#200](https://github.com/arpi09/grocery-manager/pull/200)) — **Last remaining flag gap after #188/#190:** `PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT` is on in prod (apphosting.yaml) but defaulted off in the Playwright webServer env, so the estimates-gated receipt spec (receipt.spec.ts:50) silently skips in CI and locally — and the exact code path #198 just fixed is never e2e-exercised. Default it on in playwright.config.ts (same pattern as `KIVRA_FORWARD_ENABLED`), which covers both e2e.yml and deploy.yml without touching their env blocks.
- fix(a11y): success toast WCAG AA contrast (darken fresh success token) ([#202](https://github.com/arpi09/grocery-manager/pull/202)) — Success-toasten (`.toast-message` vit text på `--color-success`) hade 3.97:1 mot kravet 4.5:1 (axe serious, WCAG 2.2 AA color-contrast). Mörkar `fresh.light.success` `#3d8f5c` → `#2e7a4c` i `src/lib/design/brand-colors.ts` och regenererar brand-CSS/SCSS (`npm run brand:css`). Nya kontraster: 5.24:1 mot vit text, 4.81:1 som textfärg på `--color-bg`.

### Changed

## [2026.6.24] - 2026-06-24

Prod deploy @ `a9ddaabca` — Fas A.
- chore(ci): Dependabot PR metadata, auto-merge, monthly deps CHANGELOG ([#131](https://github.com/arpi09/grocery-manager/pull/131)) — Extend `dependabot.yml` with labels, assignee (`arpi09`), and per-group labels for production/dev minor/patch groups
- docs: professional public README polish ([#134](https://github.com/arpi09/grocery-manager/pull/134)) — Rewrite `README.md` with Skaffu logo, public-facing structure, doc links instead of long feature walkthrough; remove `git init` section and personal emails
- chore(ci): error-export workflow_dispatch for prod logs ([#135](https://github.com/arpi09/grocery-manager/pull/135)) — Add manual workflow_dispatch for error-export so agents can pull prod error logs without ad-hoc scripts.
- Dependencies: npm production + dev minor/patch bumps ([#120](https://github.com/arpi09/grocery-manager/pull/120), [#121](https://github.com/arpi09/grocery-manager/pull/121), [#122](https://github.com/arpi09/grocery-manager/pull/122), [#130](https://github.com/arpi09/grocery-manager/pull/130), [#148](https://github.com/arpi09/grocery-manager/pull/148), [#149](https://github.com/arpi09/grocery-manager/pull/149)) — see merged PRs
- docs(design): add Stitch consumer UX v2 design pack ([#169](https://github.com/arpi09/grocery-manager/pull/169)) — Add design/v2 Stitch Skaffu consumer UX v2 documentation (review, audit, normalization plan, editorial home).
- chore(ai-tooling): sync pr-workflow rule to .claude/rules ([#173](https://github.com/arpi09/grocery-manager/pull/173)) — `scripts/sync-ai-tooling.mjs` — `pr-workflow.mdc` tillagd i `RULE_ALLOWLIST`
- refactor(login): streamline login action and form ([#176](https://github.com/arpi09/grocery-manager/pull/176)) — Hoistar `redirectTo` så alla tre `fail`-grenar återanvänder ett enda `safeRedirect`-anrop (istället för att räkna om det).
- docs(reality): prod SHA 046542052 (#178 email logo) post-deploy ([#179](https://github.com/arpi09/grocery-manager/pull/179)) — Post-deploy update: prod SHA `046542052` @ run 28665190055 (auto→fast, e2e critical, verify-release grön)
- chore: add .gitattributes with deterministic LF line endings ([#180](https://github.com/arpi09/grocery-manager/pull/180)) — Add `.gitattributes`: `* text=auto eol=lf`, CRLF for Windows scripts, binary markers for assets
- docs(reality): prod SHA e918c64ee post-deploy ([#183](https://github.com/arpi09/grocery-manager/pull/183))
- chore(design-sync): pin Skaffu Design System project ([#187](https://github.com/arpi09/grocery-manager/pull/187)) — Pins `projectId` `f06626f0-ce11-4687-bbf5-03ac70c38e44` in `.design-sync/config.json` so future `/design-sync` runs target the existing "Skaffu Design System" project instead of creating duplicates.
- docs(skills): coordinator-boot föreslår sessionsnamn + rename-steg ([#195](https://github.com/arpi09/grocery-manager/pull/195)) — Räddar en okommitterad SKILL.md-förbättring från huvudcheckouten (sessionsnamn-steg i coordinator-booten + rename-tips vid ny tråd). Innehållet användes redan av coordinator-sessioner men fanns inte i git.
- refactor(flags): retire UX v2 flags - shipped surfaces are the only mode ([#188](https://github.com/arpi09/grocery-manager/pull/188))
- docs(reality): prod SHA 8d02a97a2 post-deploy ([#201](https://github.com/arpi09/grocery-manager/pull/201))
- docs(competitive): lägg till Skafferi (app.getskafferi.com) i §3A + namn-/SEO-riskbedömning ([#204](https://github.com/arpi09/grocery-manager/pull/204)) — Ny aktör **Skafferi** (app.getskafferi.com) i §3A-tabellen (Skafferi/heminventering) med hotnivå 🟡 produkt / 🟠 namn-SEO

### Added

- Activation funnel improvements (onboarding → inköp core loop).
- Receipt wow flow and overlay coordinator.

### Changed

- Deploy-critical E2E coverage validated on prod SHA.
