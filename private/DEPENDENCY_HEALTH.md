# Dependency Health

**Last scanned:** 2026-06-13  
**Runtime audit:** `npm audit --omit=dev` → 0 runtime CVEs (dev audit has 11 low/mod/high — no direct runtime fixes applied)

## Bumped this branch (2026-06-13)

| Package | From → To |
|---------|-----------|
| `@electric-sql/pglite` | 0.5.0 → 0.5.2 |
| `@lucide/svelte` | 1.17 → 1.18 |
| `@sveltejs/kit` | 2.63 → 2.65 |
| `sharp` | 0.34.5 → 0.35.1 |
| `eslint`, `typescript-eslint`, `firebase-tools`, `happy-dom`, `prettier`, `stripe`, `svelte`, etc. | patch within semver |

## Safe now (patch/minor)

| Package | Notes |
|---------|--------|
| `@electric-sql/pglite` | 0.5.1 → 0.5.2 — test infra |
| `@lucide/svelte` | 1.17 → 1.18 |
| `@sveltejs/kit` | 2.63 → 2.65 — run `check` + build |
| `eslint`, `typescript-eslint` | patch |
| `firebase-tools`, `happy-dom`, `prettier`, `stripe`, `svelte` | patch |
| `sharp` | 0.34.5 → 0.35.1 — asset scripts |

## Review required

| Package | Risk |
|---------|------|
| `lint-staged` | 15 → 17 major |
| `marked` | 13 → 18 major — guide generation |
| `@types/node` | 22 → 25 — stay on Node 24 policy |
| `lucia` ecosystem | auth migration (L) |

## Delay

- Drizzle majors during migration 0047–0050 flight
- SvelteKit/Vite/Vitest majors — currently stable

## Abandoned / heavy

- `maplibre-gl` — single map component (Tier C)

Refresh: `npm outdated` + `npm audit --omit=dev` monthly.
