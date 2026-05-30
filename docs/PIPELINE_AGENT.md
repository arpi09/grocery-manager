# Pipeline / Release (process)

How the **Pipeline / Release** agent fits into home-pantry coordination.

**Last policy refresh:** 2026-05-30 — see canonical [`DEPLOYMENT_POLICY.md`](../DEPLOYMENT_POLICY.md) and [`RELEASE_PIPELINE.md`](../RELEASE_PIPELINE.md) at repo root.

## Cadence

| When | Action |
|------|--------|
| **After workflow or infra change** | Refresh root policy + pipeline docs; verify `.github/workflows/release.yml` matches gate table |
| **Before high-risk merge to `master`** | Classify risk; confirm guarded path checklist |
| **Monthly** | Review secrets posture, rollback steps, and E2E gate coverage |
| **Post-incident** | Update rollback notes and `DELIVERY_METRICS.md` row |

## How the coordinator invokes the agent

1. Assign branch (typical: `chore/pipeline-release-program`) and point the agent at [`.cursor/rules/pipeline-release-agent.mdc`](../.cursor/rules/pipeline-release-agent.mdc).
2. Prompt example: *"Review release.yml vs docs; update DEPLOYMENT_POLICY.md and RELEASE_PIPELINE.md; classify risk for pending firebase changes; do not change src/."*
3. Agent reads workflows and CI docs, updates root artifacts, posts pipeline status and fast/guarded recommendation.
4. Coordinator applies risk class before implementation agents push to `master`.

## Artifacts

| File | Purpose |
|------|---------|
| `DEPLOYMENT_POLICY.md` | Deploy authority, environments, risk tiers, rollback |
| `RELEASE_PIPELINE.md` | G0–G3 gates, test mapping, agent playbook |
| `.cursor/rules/pipeline-release-agent.mdc` | Agent constraints (read-only product default) |
| [docs/CI_CD.md](./CI_CD.md) | Trunk-based overview (Swedish); links here |
| [docs/FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md) | Firebase bootstrap and secrets |
| `OWNERSHIP.md` / `MERGE_QUEUE.md` | Infra blockers and deploy-path conflicts |

## Relationship to E2E agent

- **E2E agent** owns `e2e/**` and test quality.
- **Pipeline agent** wires E2E into G2 and may **request** smoke tests — does not rewrite E2E coverage without approval.

Push only after user approval per coordinator rules.
