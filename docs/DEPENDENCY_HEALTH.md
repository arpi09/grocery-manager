# Dependency health (process)

How the **Dependency Health** agent fits into home-pantry coordination.

## Cadence

| When | Action |
|------|--------|
| **Monthly** | Refresh [`DEPENDENCY_HEALTH.md`](../DEPENDENCY_HEALTH.md) on a chore branch |
| **Before release** | Re-run audit; ensure no unreviewed **high** direct runtime advisories |
| **After a major dep bump** | Spot-check usage in `src/` and update the report |

## How the coordinator invokes the agent

1. Assign branch (typical: `chore/dependency-health-program`) and point the agent at [`.cursor/rules/dependency-health-agent.mdc`](../.cursor/rules/dependency-health-agent.mdc).
2. Prompt example: *"Run dependency health scan; update DEPENDENCY_HEALTH.md; summarize top 5 outdated and top vulnerabilities; do not change package.json."*
3. Agent runs `npm outdated` / `npm audit`, updates the root report, and posts a short summary in chat.
4. Coordinator reviews; if fixes are needed, **assign a separate agent/PR** for bumps (do not auto-fix from the health agent).

## Artifacts

| File | Purpose |
|------|---------|
| `DEPENDENCY_HEALTH.md` | Canonical scan results |
| `.cursor/rules/dependency-health-agent.mdc` | Agent constraints (read-only default) |
| `AGENT_STATUS.md` / `OWNERSHIP.md` | Coordination rows |

Push only after user approval per coordinator rules.
