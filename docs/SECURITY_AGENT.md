# Security agent (process)

How the **Security** agent fits into home-pantry coordination.

**Last report refresh:** 2026-05-30 — see canonical [`SECURITY_REPORT.md`](../SECURITY_REPORT.md) at repo root.

## Cadence

| When | Action |
|------|--------|
| **Before deploy to production** | Full scan + complete [`SECURITY_DEPLOYMENT_CHECKLIST.md`](../SECURITY_DEPLOYMENT_CHECKLIST.md) |
| **Before push to `master`** (high-risk) | Review deploy candidate diff; update executive summary in `SECURITY_REPORT.md` |
| **Weekly / coordinator checkpoint** | Refresh findings; consume [`DEPENDENCY_HEALTH.md`](../DEPENDENCY_HEALTH.md) |
| **After auth, API, or infra change** | Re-scan affected areas; set pass / blocked / needs review |

## How the coordinator invokes the agent

1. Assign branch (typical: `chore/security-agent-program`) and point the agent at [`.cursor/rules/security-agent.mdc`](../.cursor/rules/security-agent.mdc).
2. Prompt example: *"Run security scan for master HEAD; update SECURITY_REPORT.md; deploy gate pass/blocked; do not change src/."*
3. Agent runs read-only checks, updates root report and checklist, posts deploy status and top blockers.
4. Coordinator blocks G3 or push when status is **blocked**; assigns implementation agents for approved fixes.

## Artifacts

| File | Purpose |
|------|---------|
| `SECURITY_REPORT.md` | Findings, severity, deploy gate |
| `SECURITY_DEPLOYMENT_CHECKLIST.md` | Pre-deploy sign-off |
| `.cursor/rules/security-agent.mdc` | Agent constraints (read-only default) |
| `DEPENDENCY_HEALTH.md` | npm audit input |
| `DEPLOYMENT_POLICY.md` / `RELEASE_PIPELINE.md` | Policy and gate alignment |

## Relationships

| Agent | Role |
|-------|------|
| **Pipeline / Release** | Security blockers are hard deploy blockers alongside G1/G2 failures |
| **Dependency Health** | Audit data source; security agent gates on runtime-critical vulns |
| **Integration** (planned) | Include security status in merge readiness |
| **Coordinator** | Assigns fixes; only coordinator spawns implementation agents |

## Tools (read-only)

| Tool | Use |
|------|-----|
| `DEPENDENCY_HEALTH.md` | Known npm audit findings |
| `rg` / Cursor grep | Secrets patterns, auth guards, API routes |
| `git log` / `git diff` | Deploy candidate scope (when git available) |
| Manual read | `hooks.server.ts`, `api-guards.ts`, CI workflow, `apphosting.yaml` |
