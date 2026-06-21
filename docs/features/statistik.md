# Statistik (`/statistik`)

> Receipt spend analytics + wrapped. **Tier C as hero** — do not promote as primary nav without explicit request.

## Routes

| Route | Purpose |
|-------|---------|
| `/statistik` | Dashboard (`StatistikDashboard`) |
| `/statistik/wrapped` | Seasonal wrapped view |

## Flow

```mermaid
flowchart LR
  Receipt[Kvitto import]
  Spend[receipt-spend domain]
  Dashboard[/statistik]
  Receipt --> Spend
  Spend --> Dashboard
```

## Key files

| Layer | File |
|-------|------|
| Route | `src/routes/statistik/+page.svelte`, `+page.server.ts` |
| UI | `StatistikDashboard.svelte`, `StatistikSpendHero.svelte`, `StatistikSpendTrend.svelte` |
| Service | `statistik.service.ts`, `wrapped.service.ts` |
| Domain | `receipt-spend.ts` |
| API | `/api/statistik/analytics` |

## Tests

- `src/lib/application/statistik.service.test.ts`
- `src/lib/domain/receipt-spend.test.ts`

## Common issues

- **Empty charts:** needs receipt price data — `receipt_price_captured` telemetry + price memory flags.
- **Wrapped season boundaries:** `wrapped.service.ts` date logic.

## Related

- [PRICE_INTELLIGENCE_AUDIT.md](../PRICE_INTELLIGENCE_AUDIT.md)
- [scan-receipt.md](./scan-receipt.md) — data source
