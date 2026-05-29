# Dependency health report

**Last scanned:** 2026-05-29 (local, `chore/dependency-health-program`)

**Commands:** `npm outdated --json`, `npm audit --json` (registry reachable; audit completed successfully)

**Scope:** Direct and transitive findings from lockfile-resolved tree. No `package.json` changes in this scan.

---

## Summary

### Top outdated (direct deps — largest gap to **latest**)

| Package | Current | Latest | Note |
|---------|---------|--------|------|
| `vite` | 6.4.2 | 8.0.14 | Two major versions behind |
| `@sveltejs/vite-plugin-svelte` | 5.1.1 | 7.1.2 | Align with SvelteKit/Vite before jumping |
| `vitest` | 3.2.4 | 4.1.7 | Major; coordinate with Vite |
| `typescript` | 5.9.3 | 6.0.3 | Major TS release |
| `zod` | 3.25.76 | 4.4.3 | Major; many schemas site-wide |

Also notable: **`drizzle-orm`** 0.39.3 → 0.45.2 (security fix available), **`@electric-sql/pglite`** 0.2.17 → 0.4.6, **`firebase-tools`** 14.27.0 → 15.19.0 (dev-only CLI).

### Top security (`npm audit` metadata: 12 total — 3 high, 6 moderate, 3 low, 0 critical)

| Package | Severity | Direct? | Issue (short) |
|---------|----------|---------|----------------|
| `drizzle-orm` | **high** | yes | SQL identifier escaping ([GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)); fix ≥ 0.45.2 |
| `firebase-tools` | **high** | yes (dev) | Transitive **`tar`** path traversal advisories; fix path via `firebase-tools@15.19.0` |
| `tar` | **high** | no | Multiple path traversal / hardlink issues (via `firebase-tools`) |
| `esbuild` | moderate | no | Dev-server request leak ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)); via `drizzle-kit` |
| `uuid` | moderate | no | Buffer bounds check ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)); via `firebase-tools` |

**Runtime vs dev:** `drizzle-orm` affects production queries — prioritize review. `firebase-tools` / `drizzle-kit` / `esbuild` issues are mostly **dev/CLI** paths; still plan upgrades before release.

### Abandoned / maintenance risk

| Package | Risk | Evidence |
|---------|------|----------|
| **`lucia`** + **`@lucia-auth/adapter-drizzle`** | **Deprecated ecosystem** | Lucia v3 is deprecated; auth is centralized in `src/lib/infrastructure/auth/lucia.ts`, session types in `app.d.ts` — migration is a **large** auth project, not a patch bump |
| **`@esbuild-kit/*`** (transitive) | Unmaintained fork chain | Pulled in by older **`drizzle-kit`**; upgrade `drizzle-kit` to reduce exposure |

### Usage spot-check (direct deps vs `src/`)

| Package | Used? | Locations (sample) |
|---------|-------|----------------------|
| `lucia`, `@lucia-auth/adapter-drizzle` | yes | `src/lib/infrastructure/auth/lucia.ts`, `id.ts`, `app.d.ts` |
| `drizzle-orm`, `@electric-sql/pglite` | yes | `src/lib/infrastructure/db/init.ts` |
| `@node-rs/argon2` | yes | auth/password paths (server) |
| `@zxing/browser` | yes | scan/barcode features (routes under scan) |
| `zod` | yes | validation across routes/services |
| `postgres` | yes | production Postgres when `USE_PGLITE` is false |

---

## Outdated packages (`npm outdated`)

Semver ranges in `package.json` satisfied where **current** = **wanted**; **latest** may be a major ahead.

| Package | Current | Wanted | Latest | Recommendation | Effort |
|---------|---------|--------|--------|----------------|--------|
| `@electric-sql/pglite` | 0.2.17 | 0.2.17 | 0.4.6 | Plan PGlite + drizzle-orm upgrade together; retest migrations | L |
| `@eslint/js` | 9.39.4 | 9.39.4 | 10.0.1 | Bundle with ESLint 10 + eslint-plugin-svelte 3 | M |
| `@sveltejs/vite-plugin-svelte` | 5.1.1 | 5.1.1 | 7.1.2 | Follow SvelteKit release notes; do not jump ahead of Kit | L |
| `@types/node` | 22.19.19 | 22.19.19 | 25.9.1 | Stay on 22 LTS types until Node 22 EOL policy decided | S |
| `drizzle-kit` | 0.30.6 | 0.30.6 | 0.31.10 | Upgrade with `drizzle-orm`; addresses esbuild-kit chain | M |
| `drizzle-orm` | 0.39.3 | 0.39.3 | 0.45.2 | **Security:** upgrade to ≥ 0.45.2 after regression tests | M |
| `eslint` | 9.39.4 | 9.39.4 | 10.4.0 | Coordinate with `@eslint/js`, typescript-eslint | M |
| `eslint-plugin-svelte` | 2.46.1 | 2.46.1 | 3.18.0 | Pair with ESLint 10 + Svelte 5 toolchain | M |
| `firebase-tools` | 14.27.0 | 14.27.0 | 15.19.0 | Dev CLI; upgrade to clear `tar`/`uuid` advisories | M |
| `globals` | 15.15.0 | 15.15.0 | 17.6.0 | Dev-only; low priority | S |
| `prettier-plugin-svelte` | 3.5.2 | 3.5.2 | 4.0.1 | After Prettier/Svelte plugin matrix check | S |
| `svelte` | 5.55.9 | 5.55.10 | 5.55.10 | Patch within range: `npm update svelte` when assigned | S |
| `typescript` | 5.9.3 | 5.9.3 | 6.0.3 | Defer major until eslint/svelte-check support clear | L |
| `vite` | 6.4.2 | 6.4.2 | 8.0.14 | Stay on 6.x until Kit documents Vite 7/8 | L |
| `vitest` | 3.2.4 | 3.2.4 | 4.1.7 | Upgrade with Vite major plan | L |
| `zod` | 3.25.76 | 3.25.76 | 4.4.3 | Major API changes; dedicated migration chore | L |

**Direct deps with no `npm outdated` row (within declared range at scan time):** `@playwright/test`, `@sveltejs/adapter-node`, `@sveltejs/kit`, `@node-rs/argon2`, `@vitejs/plugin-basic-ssl`, `eslint-config-prettier`, `nodemon`, `prettier`, `svelte-check`, `typescript-eslint`, `postgres`, `@lucia-auth/adapter-drizzle`, `lucia`, `@zxing/browser` (latest may still differ — only packages behind **wanted** appear above).

---

## Security audit (`npm audit`)

Audit **succeeded** on 2026-05-29. Totals: **12** vulnerabilities (3 high, 6 moderate, 3 low).

| Package | Severity | Direct | Fix available (npm) | Recommendation | Effort |
|---------|----------|--------|---------------------|----------------|--------|
| `drizzle-orm` | high | yes | 0.45.2 (semver major) | Schedule ORM bump + integration tests | M |
| `firebase-tools` | high | yes | 15.19.0 (major) | Dev machine/CI only; upgrade CLI when convenient | M |
| `tar` | high | no | via `firebase-tools` | Same as firebase-tools | M |
| `drizzle-kit` | moderate | yes | 0.31.10 (major) | Pair with drizzle-orm; dev migrations | M |
| `esbuild` | moderate | no | via `drizzle-kit` | Dev-server exposure; avoid exposing dev server publicly | M |
| `@esbuild-kit/core-utils` | moderate | no | via `drizzle-kit` | Remove by upgrading drizzle-kit | M |
| `@esbuild-kit/esm-loader` | moderate | no | via `drizzle-kit` | Same | M |
| `uuid` | moderate | no | via `firebase-tools` | Same as firebase-tools | M |
| `gaxios` | moderate | no | via `firebase-tools` | Transitive | M |
| `@sveltejs/kit` | low | yes | audit suggests ancient 0.0.30 — **ignore**; track Kit patch releases instead | Monitor upstream `cookie` dependency | S |
| `@sveltejs/adapter-node` | low | yes | transitive via Kit | Same | S |
| `cookie` | low | no | via Kit | Low severity; wait for Kit bump | S |

**Do not run `npm audit fix --force` without assignment** — audit suggests breaking downgrades (e.g. `@sveltejs/kit@0.0.30`).

---

## Recommended priority queue (documentation only)

1. **M — `drizzle-orm` ≥ 0.45.2** (production SQL injection advisory)
2. **M — `drizzle-kit` + ORM** (esbuild-kit chain, migration tooling)
3. **M — `firebase-tools` 15.x** (dev CLI transitive high severity)
4. **S — `svelte` patch** to 5.55.10 when coordinator assigns a minimal bump PR
5. **L — Auth:** plan post-Lucia strategy before large dependency churn
6. **L — Toolchain:** Vite 8 / Vitest 4 / TS 6 / Zod 4 as separate coordinated epics

---

## Raw audit metadata

```json
"vulnerabilities": { "info": 0, "low": 3, "moderate": 6, "high": 3, "critical": 0, "total": 12 }
```
