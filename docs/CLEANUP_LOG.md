# Cleanup log — WIP 1 (31 maj 2026)

Konservativ städning: minska brus för agenter/människor utan att ta bort produktkapacitet.

## Borttaget

| Fil | Varför |
|-----|--------|
| `check-out.txt`, `check-output.txt` | Stale `npm run check`-dump; inget i CI eller docs refererar |
| `scripts/_patch-shopping-e2e.cjs` | Engångspatch (redan applicerad); inga referenser |
| `scripts/_patch-toggle.cjs` | Engångspatch för `/inkop` redirect |
| `scripts/_patch-e2e-auth.cjs`, `_patch-e2e-auth.mjs` | Engångspatch för auth-specs |
| `scripts/_patch-layout.mjs` | Engångspatch för PWA manifest i layout |

## Dokumentation — ändrat

| Fil | Ändring |
|-----|---------|
| `docs/README.md` | Index: länk till `DOMAIN_STRATEGY.md` |
| `docs/E2E.md` | `admin.spec.ts` → `z-admin.spec.ts`; testantal 23 |
| `docs/ROADMAP.md` | Enhetligt E2E-antal (23, var 17/22) |
| `docs/90_DAY_ROADMAP.md` | Pekare till ROADMAP; trimmat historisk punkt-2-spec; uppdaterat punkt-16 |
| `docs/COMPETITIVE_ANALYSIS.md` | E2E-rad: 23 tester + länk |

## Medvetet kvar (för riskabelt eller fortfarande relevant)

- **`homepantry.com` i copy/env/marketing** — framtida domän och kontaktmail; prod kör `*.hosted.app` (dokumenterat i CUSTOM_DOMAIN / NEXT_STEPS)
- **`docs/90_DAY_ROADMAP.md` leveransavsnitt** — arkiv med operativa detaljer (cron, Firebase); pekar nu till ROADMAP för aktiv status
- **`private/`** — orörd (regler + intern styrning)
- **`.cursor/rules/pipeline-release-agent.mdc`** — refererar fortfarande `admin.spec.ts` (regel-fil; ej ändrad i denna pass)
- **Svelte-varningar (37 st)** — befintliga `$state`-/a11y-varningar; inga fel efter `npm run check`
- **Duplicerade Windows-sökvägar i git** (`e2e\auth.spec.ts` vs `e2e/auth.spec.ts`) — samma filer; kräver git-normalisering, ej denna pass
- **ICA API-rutter** (`/api/ica-shopping-list`) — fortfarande i kod/README; produktfeature, ej borttagen

## Verifiering

```powershell
npm run check   # 0 errors, 37 warnings (oförändrat mönster)
```

*Ingen commit i denna pass — ändringar redo för granskning.*
