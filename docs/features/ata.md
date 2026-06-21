# Äta (`/planer`)

> Veckovy för middagsplanering — nav-label **Äta**, route `/planer`. Flyttad från [ATA_PAGE.md](../ATA_PAGE.md).

## Routes

| Route | UI name |
|-------|---------|
| `/planer` | **Äta** — veckokalender + idépanel |
| `/planer/vecka` | **Veckoförslag** — AI-generera hela veckan |
| `/recept/[id]` | Receptdetalj |
| `/recept/[id]/laga` | Laga-flöde |

## Flow

```mermaid
flowchart LR
  Hem[/hem]
  Planer[/planer]
  Recept["/recept/id"]
  Inkop[/inkop]
  Hem -->|"Planera middag"| Planer
  Planer --> Recept
  Planer -->|"Saknade på lista"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| Routes | `src/routes/planer/+page.svelte`, `planer/vecka/+page.svelte` |
| UI | `WeeklyRitualFlow.svelte` |
| Services | `weekly-ritual.service.ts`, `meal-plan.service.ts` |
| Repo | `meal-plan.repository.ts` |
| API | `/api/planer/ideas`, `/api/planer/weekly-ritual/approve`, `/api/recipes/*` |

## Telemetry

| Event | When |
|-------|------|
| `planer_viewed` | `/planer` mount |
| `ata_recipe_opened` | Recept from calendar / ideas / day sheet |
| `ata_week_view_toggled` | Week/month toggle |

## Common issues

- **Broken recipe link:** manual meals have no `ideaId` — no recipe chip.
- **Week deep links:** `?week=YYYY-MM-DD`, `#ata-calendar`.
- **"Veckan fixad" vs "Veckoförslag":** success copy in `WeeklyRitualFlow` ≠ page title on `/planer/vecka`.

## Related

- [ATA_PAGE.md](../ATA_PAGE.md) — original spec (historical)
- [hem.md](./hem.md) — briefing → planera middag
