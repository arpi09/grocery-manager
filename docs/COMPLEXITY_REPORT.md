# Complexity report (process)

How the **Complexity** agent fits into home-pantry coordination.

**Last report refresh:** 2026-05-30 — see canonical [`COMPLEXITY_REPORT.md`](../COMPLEXITY_REPORT.md) at repo root.

## Cadence

| When | Action |
|------|--------|
| **Monthly** | Refresh [`COMPLEXITY_REPORT.md`](../COMPLEXITY_REPORT.md) on a chore branch |
| **Before large features** | Re-scan shared hotspots (`init.ts`, nav/modals, schema, OpenAI routes) |
| **After merge pain** | Add finding if a conflict zone repeats; cross-link `MERGE_QUEUE.md` |
| **Coordinator checkpoint** | Summarize top 3 hotspots in chat; do not auto-refactor |

## How the coordinator invokes the agent

1. Assign branch (typical: `chore/complexity-agent-program`) and point the agent at [`.cursor/rules/complexity-agent.mdc`](../.cursor/rules/complexity-agent.mdc).
2. Prompt example: *"Run complexity scan; update COMPLEXITY_REPORT.md; summarize top 3 hotspots; do not change src/."*
3. Agent runs line counts, grep/coupling checks, git churn (if available), updates the root report, posts a short summary.
4. Coordinator reviews **Recommended Next Refactors** and assigns **separate implementation agents/PRs** if work is approved.

## Artifacts

| File | Purpose |
|------|---------|
| `COMPLEXITY_REPORT.md` | Canonical complexity findings |
| `.cursor/rules/complexity-agent.mdc` | Agent constraints (read-only default) |
| `OWNERSHIP.md` / `MERGE_QUEUE.md` | Cross-reference for conflict-prone paths |
| `DEPENDENCY_HEALTH.md` | Complementary (deps vs structure) |

## Tools (read-only)

| Tool | Use |
|------|-----|
| PowerShell / `wc -l` | Largest files under `src/` |
| `rg` / Cursor grep | Duplication, import fan-in, auth checks |
| `git log --since` | Churn hotspots |
| Manual read | Top 10 files by lines — confirm mixed concerns |

Push only after user approval per coordinator rules.
