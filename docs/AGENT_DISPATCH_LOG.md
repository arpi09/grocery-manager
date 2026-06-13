# Agent Dispatch Log — Cloud Handoff Protocol

**Purpose:** Single source of truth for manual Cursor Cloud agents and coordinator-orchestrated work when sessions are too large to migrate to Cloud. The coordinator assigns tasks via copy-paste prompts; Cloud agents report back by updating this table. Session continuity in Cloud is **not** assumed.

---

## Execution modes

| Mode | Who runs | When to use |
|------|----------|-------------|
| `COORDINATOR_LOCAL` | Coordinator in current chat, local tools | Small docs, status, orchestration, no long CI |
| `COORDINATOR_AGENT` | Subagent/Task spawned by coordinator (local or background) | Local agent with full repo; not user-opened Cloud |
| `MANUAL_CLOUD_AGENT` | User opens new Cursor Cloud agent, pastes prompt | Large context, parallel capacity, Linux CI subset |
| `USER_LOCAL` | Product owner (captcha, phone, prod login, manual smoke) | Cannot be automated in Cloud |
| `BLOCKED` | Nobody yet | Deploy lockdown, secrets, decision, dependency |

---

## Status values

| Status | Meaning |
|--------|---------|
| `PLANNED` | Task assigned; agent not started |
| `RUNNING` | Agent actively working |
| `PR_OPEN` | Branch pushed; PR open to `master` |
| `DONE` | PR merged or task complete without merge |
| `BLOCKED` | Waiting on dependency (deploy, decision, secrets) |
| `CANCELLED` | Task abandoned or superseded |

Append new rows at the **top** of the dispatch table.

---

## Hard rules

- **Cloud agents:** never deploy, never secrets, never push to `master` — **PR only**
- **Coordinator:** owns prod state
- **Prod SHA** updated only by coordinator/release manager after **verified** deploy (not Cloud, not dispatch log agent rows)

See also [CLOUD_AGENT_SETUP.md](./CLOUD_AGENT_SETUP.md) for Cloud-safe vs forbidden tasks.

---

## Coordinator sync command

Paste at session start or after user reports a Cloud agent finished:

```text
Läs docs/AGENT_DISPATCH_LOG.md och sammanfatta:
- aktiva agents
- öppna branches
- öppna PRs
- blockers
- vad koordinatorn ska göra härnäst
```

---

## Dispatch table

| Tid | Agent | Branch | Task | Execution mode | Status | PR | Blockers | Coordinator follow-up |
|-----|-------|--------|------|----------------|--------|----|----------|----------------------|
| 2026-06-13 | cloud-pilot-reality | `feat/cloud-pilot-reality-sync` | CURRENT_REALITY master sync | MANUAL_CLOUD_AGENT | PLANNED | — | Deploy pågår lokalt | Start Cloud efter deploy stabil |

---

## Standard Cloud Agent Prompt Footer

Append to **every** `MANUAL_CLOUD_AGENT` prompt:

```text
---
CLOUD HANDOFF FOOTER (required)

Before finishing:
1. Update docs/AGENT_DISPATCH_LOG.md with:
   - timestamp (ISO or YYYY-MM-DD HH:mm)
   - agent name (short label)
   - branch
   - task (one line)
   - execution mode = MANUAL_CLOUD_AGENT
   - status (PR_OPEN / DONE / BLOCKED)
   - PR number/link if created
   - blockers
   - coordinator follow-up needed

2. Do NOT merge to master.
3. Open PR only (feat/* → master).

Forbidden: deploy, Firebase, prod smoke, Cloud SQL, real API keys (OpenAI/Stripe/Resend), push to master.
```

---

## PR description template

Use when opening a PR from a Cloud agent:

```markdown
## Task
<!-- one-line from dispatch log -->

## Files touched
- 

## Tests run
- [ ] `npm run check:locales`
- [ ] `npm run quick:dev` (or other: ___)
- [ ] Other: ___

## Risks
- 

## Dispatch log updated
- [ ] yes — row added/updated in docs/AGENT_DISPATCH_LOG.md
- [ ] no — reason: ___

## Coordinator follow-up
<!-- what coordinator must do after merge: prod SHA, deploy, review, etc. -->
```

---

## Manual Cloud Agent Task Template

Coordinator must provide this block when mode = `MANUAL_CLOUD_AGENT`:

```text
# Cloud Agent Task — [short name]

## Context
[1–2 sentences: why Cloud, what deploy/local work is parallel]

## Branch
Create/checkout: `feat/...` from `master` (not master direct commits)

## Task
[Concrete deliverable]

## Allowed files (max N)
- path/to/file1
- path/to/file2

## Forbidden
- No deploy (`gh workflow run`, `deploy:firebase`, prod smoke)
- No secrets (.env, API keys, Firebase MCP for deploy)
- No push to master
- No OpenAI live calls
- No manual browser/phone tests

## Tests (run before PR)
npm run cloud:bootstrap
npm run check:locales
[optional: npm run quick:dev / quick:marketing]

## PR
- Push branch, open PR to master
- Use PR template from docs/AGENT_DISPATCH_LOG.md
- Do not merge

## CLOUD HANDOFF FOOTER
[paste footer from Standard Cloud Agent Prompt Footer section above]
```

---

## Example: reality-sync-pilot

```text
# Cloud Agent Task — reality-sync-pilot

## Context
Coordinator kör deploy lokalt. Du synkar master-state i docs utan prod SHA.

## Branch
feat/cloud-pilot-reality-sync from master

## Task
Update docs/CURRENT_REALITY.md (master SHA, APP_HOME_PATH, nav, flags from apphosting.yaml).
Update docs/INDEX.md (Cloud links + dispatch log pointer).
Do NOT update prod SHA — leave note "Uppdateras av coordinator efter deploy".

## Allowed files (max 3)
- docs/CURRENT_REALITY.md
- docs/INDEX.md
- docs/AGENT_DISPATCH_LOG.md (your dispatch row only)

## Forbidden
No deploy, Firebase, secrets, master push, code changes, OpenAI.

## Tests
npm run cloud:bootstrap
npm run check:locales

## PR
Open PR to master. Use PR template. Do not merge.

---
CLOUD HANDOFF FOOTER (required)

Before finishing:
1. Update docs/AGENT_DISPATCH_LOG.md with:
   - timestamp (ISO or YYYY-MM-DD HH:mm)
   - agent name (short label)
   - branch
   - task (one line)
   - execution mode = MANUAL_CLOUD_AGENT
   - status (PR_OPEN / DONE / BLOCKED)
   - PR number/link if created
   - blockers
   - coordinator follow-up needed

2. Do NOT merge to master.
3. Open PR only (feat/* → master).

Forbidden: deploy, Firebase, prod smoke, Cloud SQL, real API keys (OpenAI/Stripe/Resend), push to master.
```
