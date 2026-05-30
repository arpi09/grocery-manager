# File ownership

Who may edit which areas in a multi-agent / multi-worktree setup. **One active agent per shared area** unless the user approves overlap.

**Related:** [AGENT_STATUS.md](./AGENT_STATUS.md) ┬╖ [MULTITASK.md](./MULTITASK.md)

---

## Coordinator rules

| Rule | Detail |
|------|--------|
| **Push** | Only after: `Approved to push [branch-name]` |
| **Out of scope** | Stop work; report in chat; update [AGENT_STATUS.md](./AGENT_STATUS.md) |
| **Commits** | Small, frequent, single-purpose |
| **Worktrees** | Proposed in chat with purpose, branch name, allowed paths, conflict risk ΓÇö **no auto-create** |
| **Dev runtime agent** | `home-pantry-dev` / `chore/dev-runtime` ΓÇö scripts and dev tooling only; **no** `src/routes`, application features, merge, or push |

---

## Shared areas (high conflict ΓÇö one agent at a time)

| Area | Paths | Typical owners | Notes |
|------|--------|----------------|-------|
| **Auth & session** | `src/hooks.server.ts`, `src/lib/server/auth.ts`, `src/lib/server/session.ts`, `src/lib/infrastructure/auth/**`, `src/lib/application/auth.service.ts`, `src/routes/login/**`, `src/routes/register/**`, `src/routes/logout/**` | Admin, profile, household | Lucia/session changes affect everyone |
| **Routes (layout)** | `src/routes/+layout.*`, `src/app.html`, `src/app.css`, `src/app.d.ts` | Nav, profile, theme | Global layout and theme hooks |
| **Shared UI / nav** | `src/lib/components/organisms/AppHeader.svelte`, `src/lib/components/templates/AppLayout.svelte`, `src/lib/components/molecules/HeaderProfileMenu.svelte` | Nav-redesign, profile, analytics (nav link) | **Hot zone** ΓÇö coordinate merges |
| **Global config** | `package.json`, `package-lock.json`, `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `nodemon.dev.json` | Dev-runtime (dev scripts only), E2E (playwright deps), Tests (vitest) | One agent per PR; dev-runtime limited to `dev:*` scripts |
| **Schema & DB** | `src/lib/infrastructure/db/schema.ts`, `drizzle/**`, `src/lib/infrastructure/db/init.ts`, `src/lib/infrastructure/db/seed-admin.ts` | Feature agents (one migration owner per change) | Serialize migrations (`0004`, `0005`, ΓÇª) |
| **API contracts** | `src/routes/api/**` | AI, analytics, admin | Version/consume carefully |
| **DI / server wiring** | `src/lib/server/di.ts`, `src/lib/server/openai.ts` | AI, admin | |

**Rule:** If you need a shared area owned by another agent ΓåÆ stop, ask for approval, note blocker in [AGENT_STATUS.md](./AGENT_STATUS.md).

---

## Restricted areas

| Area | Who | Others |
|------|-----|--------|
| **E2E / Playwright** | E2E agent ┬╖ `home-pantry-e2e` ┬╖ `e2e/**`, `playwright.config.ts` | Read-only elsewhere |
| **Dev runtime ops** | Dev-runtime ┬╖ `scripts/dev-runtime/**`, dev npm scripts | No feature code in `src/**` |
| **Admin panel** | Admin agent ┬╖ `src/routes/admin/**`, `admin.service*`, `admin.repository*`, `admin.schemas.ts` | No OpenAI `/inkop` changes |
| **Vitest suites (canonical)** | Tests worktree ┬╖ `**/*.test.ts`, `**/*.integration.test.ts`, `src/lib/test/**` | Feature agents may add *focused* tests only with approval |
| **`.env`** | User only | Never commit |

---

## Dedicated ownership by agent / feature

| Agent / feature | Branch (typical) | Owns (primary) | Must not touch |
|-----------------|------------------|----------------|----------------|
| **Tests** | `feat/integration-test-suite` | `**/*.test.ts`, `src/lib/test/integration-db.ts`, test scripts in `package.json` | Product UI except test IDs |
| **Admin UI** | `feature/admin-interface`, `feature/admin-error-logs` | `src/routes/admin/**`, `admin.*`, `presence.ts`, error-log storage & admin views | `e2e/**`, OpenAI routes |
| **AI / OpenAI** | `feat/openai-enhancements` | `src/routes/inkop/**`, `src/routes/planer/**` (AI parts), `src/routes/api/recipes`, `ica-shopping-list`, `product-from-image`, `InkopAssistant`, `RecipeAssistant`, `openai.ts` | Admin, E2E |
| **E2E** | `feat/e2e-playwright` | `e2e/**`, `playwright.config.ts`, `AGENTS-E2E.md`, E2E scripts | `src/**` except trivial selectors |
| **Dev runtime** | `chore/dev-runtime` | `scripts/dev-runtime/**`, `nodemon.dev.json`, `dev:*` in `package.json`, `AGENTS-DEV-RUNTIME.md` | All feature `src/**` |
| **Expiring soon** | `feature/expiring-soon-home` | `ExpiringSoonSection.svelte`, `expiry.ts`, home dashboard expiry slice in `DashboardSummary` / `+page` | Unrelated routes |
| **Nav redesign** | `feature/nav-redesign` | `AppHeader.svelte`, nav styling, main nav links structure | Profile dropdown internals |
| **User profile** | `feature/user-profile` | `routes/profile/**`, `profile.service*`, `profile.schemas.ts`, `HeaderProfileMenu.svelte`, user profile migrations | Admin, analytics pages |
| **Dark theme** | `feature/profile-dark-theme` | `theme.ts`, `theme-cookie.ts`, `theme.schemas.ts`, theme migration, layout theme class | Nav structure |
| **Analytics** | `feature/analytics-page` | `routes/statistik/**`, `AnalyticsDashboard.svelte`, `inventory-analytics*` | Admin, inkop |
| **Shared household** | `feature/shared-household` | Household domain, shared inventory rules, `household.*` tests, inventory service sharing logic | Admin UI |
| **Dependency health** | `chore/dependency-health-program` | `DEPENDENCY_HEALTH.md`, `docs/DEPENDENCY_HEALTH.md`, `.cursor/rules/dependency-health-agent.mdc` | `package.json`, `package-lock.json`, `src/**` (except read-only grep) |
| **Complexity** | `chore/complexity-agent-program` | `COMPLEXITY_REPORT.md`, `docs/COMPLEXITY_REPORT.md`, `.cursor/rules/complexity-agent.mdc` | `src/**` (except read-only scan); no refactors unless assigned |
| **Coordinator / docs** | `chore/coordinator-v2`, `docs/agent-coordination` | `AGENT_STATUS.md`, `MERGE_QUEUE.md`, `OWNERSHIP.md`, `MULTITASK.md` (coordination sections) | No `src/**` |

---

## Suggested map for current in-flight work

```
master (dda14b4)
Γö£ΓöÇΓöÇ home-pantry-admin      ΓåÆ admin (done on master; error-logs branch TBD)
Γö£ΓöÇΓöÇ home-pantry-tests      ΓåÆ tests (done on master)
Γö£ΓöÇΓöÇ home-pantry-dev        ΓåÆ dev-runtime (ops)
Γö£ΓöÇΓöÇ home-pantry-e2e        ΓåÆ playwright
Γö£ΓöÇΓöÇ feature/expiring-soon-home   ΓåÆ expiry UI (branch ready)
Γö£ΓöÇΓöÇ feature/nav-redesign         ΓåÆ header/nav (done, branch TBD)
Γö£ΓöÇΓöÇ feature/admin-error-logs     ΓåÆ admin errors (commit needed)
ΓööΓöÇΓöÇ home-pantry (split WIP!)
    Γö£ΓöÇΓöÇ feature/user-profile
    Γö£ΓöÇΓöÇ feature/analytics-page
    Γö£ΓöÇΓöÇ feature/profile-dark-theme
    ΓööΓöÇΓöÇ feature/shared-household
```

---

## Escalation

1. Update blocker in [AGENT_STATUS.md](./AGENT_STATUS.md).
2. Ask user to assign shared area or approve overlap.
3. Rebase feature branch onto latest `origin/master` before merge.
