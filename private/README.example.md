# Local ops files (not in git)

Copy this file to `private/README.md` locally. Everything under `private/` except `README.example.md` stays **local only** — never commit ops reports, credentials, or coordinator state.

## Suggested local files

| File | Purpose |
|------|---------|
| `AGENT_STATUS.md` | Coordinator handoff / active agents |
| `SECURITY_REPORT.md` | Security agent scan output |
| `SECURITY_DEPLOYMENT_CHECKLIST.md` | Pre-deploy security checklist |
| `DEPLOYMENT_POLICY.md` | Release policy notes |
| `RELEASE_PIPELINE.md` | CI/CD pipeline notes |
| `DEPENDENCY_HEALTH.md` | `npm audit` / dependency scan (Dependency Health agent) |
| `COMPLEXITY_REPORT.md` | Complexity agent output |
| `MERGE_QUEUE.md` | Merge queue state |
| `DELIVERY_METRICS.md` | Flow metrics after merges |
| `MULTITASK.md` | Multitask session notes |

## Rules

- No API keys, passwords, or `.env` contents in this folder.
- Agents refresh these files locally; they are **not** source of truth for prod.
- For onboarding: use `npm run setup:agent` and [`AGENTS.md`](../AGENTS.md).
