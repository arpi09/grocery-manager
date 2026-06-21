# Hem (`/hem`)

> Home UX v2 briefing — default app home when logged in. See [CODEBASE_MAP.md](../CODEBASE_MAP.md#huvudtabell-tier-ab-ytor).

## Routes

| Route | Purpose |
|-------|---------|
| `/hem` | Dashboard: briefing, expiring, shopping memory, household |
| `/hem?welcome=1` | Post-register guided start wedge |

## Flow

```mermaid
flowchart LR
  Hem[/hem briefing]
  Inkop[/inkop]
  Planer[/planer]
  Scan[/scan]
  Inventory[/inventory]
  Hem -->|"Planera middag"| Planer
  Hem -->|"Handla"| Inkop
  Hem -->|"Skanna kvitto"| Scan
  Hem -->|"Utgår snart"| Inventory
```

## Key files

| Layer | File |
|-------|------|
| Route | `src/routes/(app)/hem/+page.svelte`, `+page.server.ts` |
| UI | `src/lib/components/organisms/HomeV2Page.svelte`, `HomeV2BriefingView.svelte` |
| Domain | `src/lib/domain/home-briefing.ts`, `home-briefing-presenter.ts` |
| Flags | `src/lib/server/home-ux-v2-flag.ts` |
| Nav default | `src/lib/navigation/app-home.ts` |

## Tests

- `src/lib/domain/home-briefing*.test.ts`
- `src/lib/domain/home-briefing-presenter.test.ts`

## Common issues

- **Wrong home variant:** check `HOME_UX_V2_ENABLED` / `HOME_REDESIGN_V1_ENABLED` in [CURRENT_REALITY.md](../CURRENT_REALITY.md).
- **Briefing empty:** server load depends on inventory count + household context in `+page.server.ts`.

## Related

- [HOME_V3.md](../HOME_V3.md) — product direction
- [CURRENT_REALITY.md](../CURRENT_REALITY.md) — nav & flags
