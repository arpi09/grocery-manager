---
name: skaffu-ship
description: Ships staged work to master via branch → PR → green pr-gate → squash-merge. Use when user says ship, skeppa, öppna PR, merge till master, or when a change is ready for master.
---

# Skaffu ship — branch → PR → merge

Kör hela leveransflödet utan att fråga mellan stegen (fråga endast vid Tier C-filer eller röd CI). Rapportera slutresultat: PR-URL + **full merge-SHA**.

## Flöde

1. **Scope-koll:** `git status --short` — endast avsedda filer. Tier C-filer (grannskafferiet, Kivra, Stripe/Pro) kräver explicit user request — annars stanna och fråga.
2. **G0:** `npm run quick:dev` (docs/skills/rules-only-ändringar: hoppa).
3. **Branch:** `fix/<slug>` eller `feat/<slug>` från senaste `origin/master` (`git fetch origin` först).
4. **Commit:** conventional commit, en logisk enhet. Rebase på `origin/master` om den hunnit röra sig.
5. **PR:** `git push -u origin <branch>` → `gh pr create` mot master enligt PR-mallen.
6. **Vänta CI:** `gh pr checks <nr> --watch` — kräv grön **`pr-gate / pr-gate`** (+ PR E2E om core-loop-paths).
7. **Merge:** `gh pr merge <nr> --squash --delete-branch`.
8. **Rapportera merge-SHA:** `gh pr view <nr> --json mergeCommit --jq .mergeCommit.oid` — denna fulla SHA är input till `skaffu-deploy-verify`.

## Efter merge

- **Deploya inte** — deploy är ett separat beslut (skill `skaffu-deploy-verify`, pinnad full SHA).
- Föreslå **ny tråd** för nästa leverans (cost mode: en tråd = ett leveransobjekt).
