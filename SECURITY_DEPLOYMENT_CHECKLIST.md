# Security deployment checklist

Use this checklist **before each production deploy** (G3). The Security agent maintains this file; the coordinator or human owner signs off when all required items pass.

**Related:** [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md) · [RELEASE_PIPELINE.md](./RELEASE_PIPELINE.md) · [SECURITY_REPORT.md](./SECURITY_REPORT.md)

**Deploy candidate SHA:** _fill before deploy_  
**Reviewer:** _Security agent / coordinator / human owner_  
**Date:** _ISO date_

---

## Pre-deploy checks

- [ ] **Dependency scan passed** — no unapproved **critical** or **high** runtime vulnerabilities (`DEPENDENCY_HEALTH.md` / `npm audit`; `drizzle-orm` and other direct deps reviewed)
- [ ] **No secrets detected** — no `.env`, API keys, passwords, or tokens in git diff or CI logs; Firebase Secret Manager refs only in `apphosting.yaml`
- [ ] **Auth changes reviewed** — session, login/register/logout, Lucia cookie settings, admin gate in `hooks.server.ts` (if touched)
- [ ] **Permission changes reviewed** — household roles, invite accept flow, admin routes (if touched)
- [ ] **Input validation reviewed** — Zod schemas and form actions on changed routes; API body/query validation
- [ ] **API exposure reviewed** — new or changed `/api/**` routes require auth; OpenAI routes use `requireUser` + `requireOpenAiKey`
- [ ] **Environment config reviewed** — `ORIGIN` / `PUBLIC_ORIGIN` match live URL; Turnstile keys in production; `TURNSTILE_SKIP` not effective in prod
- [ ] **CI/CD security reviewed** — `.github/workflows/release.yml` gates appropriate; no secret echo; emergency skip-E2E documented if used
- [ ] **Rollback plan confirmed** — App Hosting rollout revert and/or git revert path per [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md) § Rollback

---

## Security agent gate

| Field | Value |
|-------|-------|
| **SECURITY_REPORT.md deploy status** | pass / blocked / needs review |
| **Blocking findings (if any)** | _list IDs or titles_ |
| **High-severity exceptions approved** | yes / no / n/a — _who approved, date_ |

**Rule:** If status is **blocked**, do **not** proceed to G3 until resolved or explicitly approved per [DEPLOYMENT_POLICY.md](./DEPLOYMENT_POLICY.md) and Security agent blocking rules.

---

## Sign-off

| Role | Name | OK to deploy |
|------|------|--------------|
| Security agent scan | | ☐ |
| Coordinator | | ☐ |
| Human owner (if required) | | ☐ |
