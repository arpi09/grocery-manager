# Household & delad lista

> Multi-member household, invite links, shared shopping list (W1), expiring share (W3).

## Routes

| Route | Purpose |
|-------|---------|
| `/settings/household` | Manage members, create invite |
| `/invite/[token]` | Accept household invite |
| `/lista/[token]` | Guest shared shopping list (W1) |
| `/dela/[token]` | Expiring items share (W3) |
| `/delningar` | Share management |

## Flow

```mermaid
flowchart LR
  Owner[Household owner]
  Invite["/invite/token"]
  Lista["/lista/token"]
  Inkop[/inkop]
  Owner -->|"Share list"| Lista
  Owner -->|"Invite member"| Invite
  Lista -->|"Guest checkoff"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| Settings | `src/routes/settings/household/+page.svelte` |
| Public lista | `src/routes/lista/[token]/+page.svelte`, `+page.server.ts` |
| Services | `household.service.ts`, `shopping-list-share.service.ts` |
| Repo | `household.repository.ts` |
| API | `/api/household/share-invite`, `/api/shopping-list/share`, `/api/expiring-share/*` |
| Context | `src/lib/server/household-context.ts` |

## Tests

- `src/routes/api/household/share-invite/share-invite.integration.test.ts`
- `src/lib/application/shopping-list-share.service.integration.test.ts`

## Common issues

- **Guest cookie:** `lista_join_token` on `/lista/[token]`.
- **Solo vs household:** `household-context.ts` scopes data queries.
- **W1 telemetry:** `shared_list_*` events — [ACQUISITION_LOOPS_V1.md](../ACQUISITION_LOOPS_V1.md).

## Related

- [inkop.md](./inkop.md)
- [HOUSEHOLD_LOOP_AUDIT.md](../HOUSEHOLD_LOOP_AUDIT.md)
