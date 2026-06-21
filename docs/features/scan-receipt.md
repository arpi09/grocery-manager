# Scan & kvitto (`/scan`)

> 3-card scan hub, receipt parse, PWA `share_target`, photo/barcode add. **Tier A/B.**

## Routes

| Route | Purpose |
|-------|---------|
| `/scan` | Hub: kvitto / foto / streckkod |
| `/scan/kvitto` | Receipt upload flow (server) |
| `/scan/foto` | Photo round flow |
| `/scan/snabbstart` | Quick start |
| `/scan/share` | PWA share_target handler |

## Flow

```mermaid
flowchart LR
  Hub[/scan]
  Parse[receipt-parse]
  Review[ReceiptBulkAddFlow]
  Pantry[/inventory]
  Inkop[/inkop]
  Hub -->|"PDF/bild"| Parse
  Parse --> Review
  Review --> Pantry
  Review -->|"Saknas på lista"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| Route | `src/routes/scan/+page.svelte`, `+page.server.ts` |
| UI | `PhotoRoundFlow.svelte`, `ReceiptBulkAddFlow.svelte`, `ReceiptAutopilotSection.svelte` |
| Server | `src/lib/server/receipt-parse.ts`, `receipt-import.ts` |
| Domain | `receipt-store.ts`, `receipt-line.ts` |
| Utils | `scan-nav.ts`, `receipt-import-session.ts` |
| API | `/api/receipt/parse`, `/api/receipt-autopilot/*`, `/api/receipt/share-pending` |

## Tests

- `e2e/receipt.spec.ts`
- `src/lib/server/receipt-parse.test.ts`
- `scripts/validate-receipt-fixtures.mjs`

## Common issues

- **share_target (Android PWA):** `/scan/share` + manifest — [PWA.md](../PWA.md).
- **Autopilot dismiss loop:** `/api/receipt-autopilot/*` + local session state.
- **Onboarding closes on scan:** `ActivationOnboardingFlow` pauses on `/scan/*` paths.

## Related

- [onboarding.md](./onboarding.md) — scan-first activation
- [RECEIPT_IMPORT_AUTOMATION_SPIKE.md](../RECEIPT_IMPORT_AUTOMATION_SPIKE.md)
