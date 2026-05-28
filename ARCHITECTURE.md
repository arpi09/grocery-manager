# Architecture

## Layers

- **Domain** (`src/lib/domain`): entities and enums with no framework dependencies.
- **Application** (`src/lib/application`): use cases (`AuthService`, `InventoryService`) depending on repository interfaces.
- **Infrastructure** (`src/lib/infrastructure`): Drizzle schema, repositories, Lucia, password hashing.
- **Presentation** (`src/routes`, `src/lib/components`): SvelteKit routes and Atomic Design UI.

## Atomic Design

| Layer | Path | Examples |
|-------|------|----------|
| Atoms | `components/atoms` | Button, Input, Card |
| Molecules | `components/molecules` | FormField, ItemRow |
| Organisms | `components/organisms` | LoginForm, InventoryList |
| Templates | `components/templates` | AuthLayout, AppLayout |
| Pages | `src/routes` | Compose templates + organisms only |

## Auth

Lucia v3 sessions with HTTP-only cookies. All inventory queries scope by `user_id` from `locals.user`.

## Database

PostgreSQL via Drizzle ORM. Run migrations with `npm run db:migrate` after setting `DATABASE_URL`.
