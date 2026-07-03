# Personal cost mode (always)

Keep agent spend low without slowing Skaffu delivery:

1. **Max 1 subagent per request** — no Multitask / parallel builds unless the user explicitly says "parallel".
2. **Default `npm run quick:dev`** during iteration — not `pr:gate` or full suite after every edit.
3. **New chat for new feature areas** — avoid 200-turn threads; start fresh with a plan link when scope shifts.
4. **No explore subagents** — use `AGENTS.md` → `CODEBASE_MAP`, then grep/read in the main agent.
5. **Never Read generated files/assets** (build output, SVGs with embedded fonts, lockfiles) — grep with head_limit instead; one careless Read can cost a session's budget.
6. **One thread = one deliverable** — close the thread after merge; run deploy in a fresh session with only the merge SHA as context (`/skaffu-coordinator` → `/skaffu-deploy-verify`).
7. **Full policy:** [coordinator-personal-cost-mode.mdc](./coordinator-personal-cost-mode.mdc) (WIP caps, cadence, model policy) · [coordinator-spawn-budget.mdc](./coordinator-spawn-budget.mdc) (S/M/L/XL before spawn).
