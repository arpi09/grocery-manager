# COMPLEXITY_REPORT.md

**Last scanned:** 2026-05-30 (local)

**Commands:** PowerShell line counts on `src/**/*.{ts,svelte}` (LiteralPath for bracket routes); ripgrep for imports, `matchMedia`, OpenAI auth patterns, Modal consumers; manual read of top offenders. `git` not available in scan shell — churn cross-referenced from `MERGE_QUEUE.md` and `OWNERSHIP.md`.

**Scope:** Application code under `src/` (SvelteKit). Excludes `node_modules`, `.svelte-kit`, build output. No production code modified in this scan.

---

## Top 10 Complexity Hotspots

| Rank | Area/File | Issue | Severity | Risk | Suggested Action |
|------|-----------|-------|----------|------|------------------|
| 1 | `src/lib/infrastructure/db/init.ts` (~281 LOC) | Dual PGlite/Postgres bootstrap, Cloud SQL connector + public-IP fallback, hand-maintained PGlite migration list (`0000`–`0011`, skips `0009`) | **High** | Deploy failures, migration drift, local/CI/prod divergence | Single migration owner; verify PGlite list against `drizzle/meta/_journal.json`; extract backend-specific modules |
| 2 | `src/hooks.server.ts` + `src/app.d.ts` | Central request pipeline: DB init, 9 services on `locals`, session, household context, admin gate, theme cookie, error logging | **High** | Every domain feature touches globals; merge conflicts on shared hook | Coordinator approval for `App.Locals` changes; document locals checklist before new services |
| 3 | `src/lib/components/organisms/MainNav.svelte` (474 LOC) | Responsive nav, “more” menu, Modal, PantrySwitcher, RecipeIdeas, keyboard/a11y, large scoped CSS | **High** | Nav is a shared hot zone; overlaps modal-blur and nav-redesign branches | Extract desktop/mobile subcomponents; one nav owner per PR |
| 4 | `src/lib/components/molecules/PantrySwitcher.svelte` (460 LOC) | Desktop dropdown + mobile sheet + create-pantry forms in one molecule | **High** | Duplicates viewport/Escape logic with MainNav; household feature churn | Split desktop/mobile; share breakpoint hook with MainNav |
| 5 | `src/lib/infrastructure/repositories/household.repository.ts` (436 LOC) | Wide repository (30+ methods): multi-pantry, invites, roles, active household | **Medium** | Schema/query changes ripple to service, settings UI, and PantrySwitcher | Keep as data boundary; split invite module only when assigned |
| 6 | Scan UX cluster (`ScanToAddFlow.svelte`, `ReceiptBulkAddFlow.svelte`, `/scan/**`) | Multi-step scan/lookup/confirm flows (~381 + ~199 LOC) plus receipt parse + bulk add; ties to `/api/barcode`, `/api/receipt/parse` | **Medium** | `feature/admin-health-usage` and scan branches historically diverged; camera/device edge cases | Stabilize scan API contracts; one agent on scan routes; extract confirm/review steps |
| 7 | `src/lib/components/organisms/AddItemForm.svelte` (374 LOC) | Large create/edit form: validation, location, expiry, barcode prefill, modal overlay usage | **Medium** | Used from inventory routes and `AddItemModalOverlay`; item paths can drift | Split field groups (quantity/location vs metadata); align with scan confirm step |
| 8 | `src/lib/application/household.service.ts` (304 LOC) | 11 domain error classes, invite/member/role orchestration | **Medium** | `householdActionError` in settings and `acceptError` in invite routes duplicate mapping | Export shared `mapHouseholdErrorToFail` for form actions |
| 9 | OpenAI cluster (`src/lib/server/openai.ts` + 5 `/api/*` routes) | Repeated pattern: `locals.user` → `getOpenAiApiKey()` → structured JSON parse (~135–179 LOC per route) | **Medium** | New AI endpoints copy boilerplate; deploy secrets must match runtime checks | Shared `$lib/server/api-guards.ts` when next AI route is assigned |
| 10 | Firebase deploy stack (`apphosting.yaml`, `.github/workflows/deploy-firebase.yml`, `init.ts` Cloud SQL) | Env/secrets split across YAML, Firebase console, CI, and runtime DB init | **Medium** | `feature/firebase-pipeline` flagged **high conflict** in merge queue | Infra owner only; rebase before schema/deploy merge |

---

## Detailed Findings

### `src/lib/infrastructure/db/init.ts`

- Complexity type: Dual-backend initialization (PGlite vs Postgres), Cloud SQL connector retry, manual PGlite SQL migration runner
- Severity: High
- Why it matters: Every request calls `initDatabase()` from `hooks.server.ts`. Postgres path includes Cloud SQL connector + public-IP fallback. PGlite path maintains a parallel migration list that must stay aligned with `drizzle/`
- Future risk: Firebase pipeline and local dev diverge; agents editing migrations without updating the PGlite list break local tests and CI (`USE_PGLITE=true`); hardcoded public-IP fallback is operational debt
- Suggested remediation: Extract `createPostgresClient`, PGlite migration runner, and env detection into separate modules; generate PGlite incremental list from Drizzle journal or single source of truth
- Estimated effort: L
- Fix now or later: Later (after Cloud SQL path confirmed stable per merge queue)

### `src/hooks.server.ts` + `src/app.d.ts`

- Complexity type: God-hook — wires DB, session, household context, admin redirect, theme cookie, error logging, HTML theme injection
- Severity: High
- Why it matters: `App.Locals` declares 9 services plus household context; adding a domain requires hook + `di.ts` + `app.d.ts` and often `OWNERSHIP.md` update
- Future risk: Parallel feature agents conflict on the same ~122-line file; easy to miss household scoping on new routes
- Suggested remediation: Lazy service accessors or route-group hooks for admin/API-only concerns (coordinator-approved)
- Estimated effort: M
- Fix now or later: Later — document “locals change checklist” first

### `src/lib/server/di.ts`

- Complexity type: Singleton service graph (18 imports, 9 exported services, module-load construction)
- Severity: Medium
- Why it matters: Only imported by `hooks.server.ts`, but builds the full object graph at import time; `AdminRepository` depends on `ErrorLogRepository`
- Future risk: Circular dependency if repositories start calling services; test doubles require module mocking
- Suggested remediation: Factory function `createServices(db)` for tests; keep single import site in hooks
- Estimated effort: M
- Fix now or later: Later

### `src/lib/infrastructure/db/schema.ts`

- Complexity type: Monolithic schema (~209 LOC, 15+ tables spanning household, inventory, shopping, pets, meal-plan, admin)
- Severity: Medium
- Why it matters: All repositories import from one file; migrations serialize through `drizzle/`
- Future risk: High merge conflict on `feature/firebase-pipeline` and any parallel migration branches
- Suggested remediation: Domain-split schema files re-exported from `schema.ts` (no behavior change)
- Estimated effort: M
- Fix now or later: Later — after migration queue clears

### `src/lib/infrastructure/repositories/household.repository.ts`

- Complexity type: Large repository — CRUD, invites, roles, active household, email lookups
- Severity: Medium
- Why it matters: Largest repository by line count; backs PantrySwitcher, settings, invites, and household context in hooks
- Future risk: Query bugs affect authorization (role checks live in service but data access is dense)
- Suggested remediation: Split `HouseholdInviteRepository` or invite-focused module when household work is assigned
- Estimated effort: M
- Fix now or later: Later

### `src/lib/application/household.service.ts`

- Complexity type: Many typed errors (11 classes) + orchestration (invites, members, active pantry)
- Severity: Medium
- Why it matters: Business rules for shared household are non-trivial; error mapping duplicated in `settings/+page.server.ts` (`householdActionError`) and `invite/[token]/+page.server.ts` (`acceptError`)
- Future risk: New household actions copy-paste catch blocks; inconsistent HTTP status codes
- Suggested remediation: Export `mapHouseholdErrorToFail(error)` from service layer for all form actions
- Estimated effort: S
- Fix now or later: Later (low urgency if settings stable)

### `src/lib/components/organisms/MainNav.svelte`

- Complexity type: Large presentation component — responsive nav, Modal, PantrySwitcher, RecipeIdeas, extensive scoped CSS (474 lines)
- Severity: High
- Why it matters: Highest line count in `src/`; combines layout, a11y keyboard handling, and breakpoint logic (`matchMedia('(max-width: 899px)')`)
- Future risk: Nav-redesign, modal-blur, and household branches all touch nav/modal CSS; agent overlap
- Suggested remediation: Extract `MainNavDesktop.svelte`, `MainNavMobileSheet.svelte`, shared `useNarrowViewport()` hook
- Estimated effort: M
- Fix now or later: Fix now if another nav PR is queued; else after `feature/modal-blur-consistency` merges

### `src/lib/components/molecules/PantrySwitcher.svelte`

- Complexity type: Molecule sized as organism — dual UI (dropdown + sheet), create pantry modal, form enhance callbacks (460 lines)
- Severity: High
- Why it matters: Duplicates `matchMedia('(max-width: 899px)')` and Escape-handler pattern from MainNav
- Future risk: Household UX changes require editing two large files consistently
- Suggested remediation: Shared viewport store/hook; extract `CreatePantryForm.svelte`
- Estimated effort: M
- Fix now or later: Later

### `src/lib/components/molecules/Modal.svelte`

- Complexity type: Feature-rich modal primitive (274 LOC): center/sheet variants, focus trap, portal, nested modals, a11y
- Severity: Medium
- Why it matters: Central to recent modal migration on master; **10 direct consumers** (MainNav, PantrySwitcher, settings, scan, calendar, pets, AI assistants)
- Future risk: Modal behavior changes ripple across consumers; `app.css` scrim/blur also in conflict zone for `feature/modal-blur-consistency`
- Suggested remediation: Freeze Modal API during blur-consistency merge; document consumer contract in architecture doc
- Estimated effort: S (documentation only)
- Fix now or later: Fix now — avoid parallel Modal refactors

### Scan UX cluster (`ScanToAddFlow.svelte`, `ReceiptBulkAddFlow.svelte`, `/scan/**`)

- Complexity type: Multi-step client flows — barcode scan → lookup → confirm; receipt upload → parse → bulk review; routes under `/scan`, `/scan/kvitto`, `/scan/snabbstart`
- Severity: Medium
- Why it matters: ~381 + ~199 LOC mixing camera UX, form state, and API calls; uses `device.ts` for desktop vs mobile scan behavior
- Future risk: `feature/admin-health-usage` mixed scan WIP; branch divergence noted in merge queue; confirm step overlaps `AddItemForm` fields
- Suggested remediation: Extract `ScanConfirmStep.svelte`; shared barcode lookup client helper; one scan owner per PR
- Estimated effort: M
- Fix now or later: Later — after scan branch strategy is explicit

### `src/lib/components/organisms/AddItemForm.svelte`

- Complexity type: Large form (374 LOC) — validation display, location, expiry, barcode prefill, optional Modal usage
- Severity: Medium
- Why it matters: Used from inventory routes and `AddItemModalOverlay`; ties to inventory Zod schemas and scan confirm flow
- Future risk: Item create/edit paths (`item/new`, `item/[id]/edit`, nested inventory routes) may drift
- Suggested remediation: Split field groups (quantity/location vs metadata); share confirm fields with scan flow
- Estimated effort: M
- Fix now or later: Later

### `src/lib/components/organisms/InkopAssistant.svelte` + `RecipeAssistant.svelte`

- Complexity type: AI-facing UI (~404 + ~182 LOC) coupled to `/api/recipes`, `/api/ica-shopping-list`, inventory context
- Severity: Medium
- Why it matters: OpenAI features span UI, `openai.ts`, and multiple API routes; assistant modals depend on stable Modal API
- Future risk: Key handling and “AI unavailable” messaging duplicated across assistants
- Suggested remediation: Shared “AI feature unavailable” UI component; coordinator assigns API consolidation separately
- Estimated effort: M
- Fix now or later: Later

### `src/lib/server/openai.ts` + OpenAI `/api/*` routes

- Complexity type: Repeated route pattern in 5 handlers (`recipes`, `product-from-image`, `receipt/parse`, `inventory-insights`, `ica-shopping-list`): auth → key check → structured request → parse/validate → `json()`
- Severity: Medium
- Why it matters: Each route 135–179 LOC with similar guard rails; `openai.ts` (~199 LOC) centralizes HTTP but not route boilerplate
- Future risk: New AI endpoints copy-paste auth and error shapes
- Suggested remediation: `requireUser(locals)`, `requireOpenAiKey(feature)` helpers in `$lib/server/api-guards.ts`
- Estimated effort: S
- Fix now or later: Later

### `src/routes/admin/+page.svelte`

- Complexity type: Page-level admin dashboard (361 LOC) — stats, error logs, user table inline
- Severity: Medium
- Why it matters: Admin is a restricted area but page mixes multiple sections without sub-route split
- Future risk: `feature/admin-health-usage` diverged from master (merge queue pause)
- Suggested remediation: Split error logs to `/admin/errors` or organism-only sections (partial split exists via `AdminHealthDashboard`)
- Estimated effort: M
- Fix now or later: Later — after admin branch rebase or split

### `src/routes/settings/+page.server.ts` + `settings/+page.svelte`

- Complexity type: Multi-domain settings hub (household, pets, invites) — ~182 server + ~203 client lines; `HouseholdSettingsPanel.svelte` adds ~318 LOC
- Severity: Medium
- Why it matters: Aggregates unrelated actions; local `householdActionError()` not shared with invite route
- Future risk: Pet settings and household invites conflict when parallel household/profile agents are active
- Suggested remediation: Route split `/settings/household` vs `/settings/pets` or export shared error mapper
- Estimated effort: M
- Fix now or later: Later

### `src/lib/components/molecules/LoginLandingShowcase.svelte` + auth routes

- Complexity type: Large marketing showcase (338 LOC, CSS bento mockups) plus login/register server routes in merge queue
- Severity: Medium
- Why it matters: `feature/login-landing-redesign` touches `login/**`, `register/**`, `e2e/auth.spec.ts` — medium conflict risk
- Future risk: Auth shell changes collide with session/hook work and E2E specs
- Suggested remediation: Merge after modal-blur; run `npm run test:e2e` before merge; one auth UI owner
- Estimated effort: S (process) / M (if split showcase from auth logic)
- Fix now or later: Fix now for merge sequencing only

### Firebase deploy stack + CI

- Complexity type: Cross-layer deploy config — `apphosting.yaml`, `.github/workflows/deploy-firebase.yml`, Cloud SQL in `init.ts`, env vs runtime secrets
- Severity: Medium
- Why it matters: Merge queue marks `feature/firebase-pipeline` high conflict (`package-lock.json`, `drizzle/meta`, workflows)
- Future risk: Production DB init paths differ from CI (`USE_PGLITE=true` in CI vs false in App Hosting)
- Suggested remediation: Single deploy checklist in `docs/FIREBASE_DEPLOY.md`; no parallel edits without infra owner
- Estimated effort: S (process) / L (full pipeline hardening)
- Fix now or later: Fix now for infra owner only

### Merge / churn hotspots (coordinator-sourced)

- Complexity type: Frequently edited shared paths — git unavailable in scan shell; inferred from `MERGE_QUEUE.md`, `OWNERSHIP.md`
- Severity: Medium
- Why it matters: Active queue cites: `app.css`, `Modal.svelte`, `login/**`, `register/**`, `drizzle/meta`, `package-lock.json`, `init.ts`, `e2e/auth.spec.ts`, `hooks.server.ts`
- Future risk: Rebase loops on login landing + firebase pipeline + modal-blur batch
- Suggested remediation: Enforce one agent per shared row in `OWNERSHIP.md`; refresh this report after those merges
- Estimated effort: S
- Fix now or later: Fix now (process)

---

## Recommended Next Refactors

1. **Extract viewport/breakpoint hook** — Deduplicate `matchMedia('(max-width: 899px)')` between `MainNav.svelte` and `PantrySwitcher.svelte` (note: `device.ts` uses 768px for mobile — align breakpoints deliberately). Do this before the next nav/household PR.
2. **API guard helpers for OpenAI routes** — Small `$lib/server/api-guards.ts` to unify auth + missing-key responses across 5 endpoints (coordinator assigns; no behavior change intended).
3. **Split `init.ts` by backend** — `postgres-client.ts`, `pglite-migrations.ts`, thin `init.ts` orchestrator; reduces review surface for Firebase/Cloud SQL work.
4. **Household form error mapper** — Export shared `mapHouseholdErrorToFail` from household service layer for settings and invite routes.
5. **Nav + scan step extraction** — Break `MainNav.svelte` into desktop/mobile subcomponents after modal-blur merges; extract `ScanConfirmStep.svelte` shared with `AddItemForm.svelte` when scan work resumes.

---

## Notes For Coordinator

- **Files protected from parallel edits:** `src/hooks.server.ts`, `src/app.d.ts`, `src/lib/server/di.ts`, `src/lib/infrastructure/db/init.ts`, `src/lib/infrastructure/db/schema.ts`, `drizzle/**`, `src/routes/+layout.*`, `src/app.css`, `src/lib/components/organisms/MainNav.svelte`, `src/lib/components/molecules/Modal.svelte`, `src/routes/login/**`, `src/routes/register/**`, `package-lock.json`, `apphosting.yaml`, `.github/workflows/deploy-firebase.yml`
- **Areas requiring coordinator approval:** Any new `App.Locals` service; new Drizzle migration; changes to Modal focus/portal API; OpenAI route additions; Firebase secret/env changes; scan API contract changes
- **Candidates for splitting modules/components:** `MainNav.svelte`, `PantrySwitcher.svelte`, `household.repository.ts`, `init.ts`, `ScanToAddFlow.svelte`, `AddItemForm.svelte`, `admin/+page.svelte`, monolithic `schema.ts`, `HouseholdSettingsPanel.svelte`
- **Complementary reports:** [`DEPENDENCY_HEALTH.md`](./DEPENDENCY_HEALTH.md) (Lucia deprecation, drizzle-orm security), [`MERGE_QUEUE.md`](./MERGE_QUEUE.md) (modal-blur → login-landing → firebase-pipeline order)
- **Re-scan triggers:** After firebase-pipeline merge, after nav/modal/login batch lands, monthly chore cadence per `docs/COMPLEXITY_REPORT.md`

---

**Scan date:** 2026-05-30

**Method:** PowerShell line counts (`Get-Content -LiteralPath`), ripgrep import fan-in and duplication patterns (`matchMedia`, OpenAI guards, Modal consumers), manual read of top 15 files by LOC; git churn unavailable (`git` not on PATH in scan environment) — substituted `MERGE_QUEUE.md` / `OWNERSHIP.md`.
