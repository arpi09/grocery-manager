# Settings (`/settings`)

> iOS-style settings hub with drill-down rows. Account, notifications, household, plan, brain memory.

## Routes

| Route | Purpose |
|-------|---------|
| `/settings` | Hub (grouped rows) |
| `/settings/account` | Profile, password, delete account |
| `/settings/notifications` | Push preferences |
| `/settings/household` | Members, invite |
| `/settings/plan` | Subscription (Stripe Tier C) |
| `/settings/app` | App preferences |
| `/settings/memory` | Memory Explorer (Brain) |
| `/settings/price-memory` | Price memory UI |
| `/settings/kivra` | Kivra forward (Tier C) |
| `/settings/nearby` | Nearby sharing |
| `/settings/feedback` | Product feedback |
| `/settings/suggestions` | Feature suggestions |

## Flow

```mermaid
flowchart TB
  Hub[/settings]
  Hub --> Account[/settings/account]
  Hub --> Household[/settings/household]
  Hub --> Memory[/settings/memory]
  Hub --> Notifications[/settings/notifications]
```

## Key files

| Layer | File |
|-------|------|
| Hub | `src/routes/settings/+page.svelte`, `+page.server.ts` |
| Account UI | `AccountSettingsPanel.svelte` |
| Services | `account.service.ts`, `profile.service.ts`, `product-feedback.service.ts` |
| Brain API | `/api/brain/feedback`, `/api/price-memory/*` |
| Push API | `/api/push/*` |

## Tests

- `src/lib/application/account.service.test.ts`
- `settings.integration.test.ts` (integration-first pattern)

## Common issues

- **Toggle not persisting:** integration tests over E2E — see `.cursor/rules/integration-first.mdc`.
- **Memory Explorer empty:** learning flags off — [CURRENT_REALITY.md](../CURRENT_REALITY.md).
- **Account deletion:** `account.service.ts` + `domain/account-deletion.ts`.

## Related

- [household.md](./household.md)
- [auth.md](./auth.md)
