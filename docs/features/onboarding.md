# Activation onboarding

> State-driven scan-first flow (v7) — modal overlay, not a route carousel. **Tier A:** finish → `/inkop?quick=1`.

## Routes & surfaces

| Surface | Location |
|---------|----------|
| Modal flow | `ActivationOnboardingFlow` in `AppLayout` |
| PWA install wedge | `/install-app` |
| Post-register | `/hem?welcome=1` |

## Flow

```mermaid
flowchart LR
  Register[Register/OAuth]
  Modal[ActivationOnboardingFlow]
  Scan[/scan]
  Inkop[/inkop?quick=1]
  Register --> Modal
  Modal -->|"Scan step"| Scan
  Modal -->|"Complete"| Inkop
```

## Key files

| Layer | File |
|-------|------|
| UI | `ActivationOnboardingFlow.svelte`, `ActivationProgressChecklist.svelte`, `ActivationOnboardingScreen.svelte` |
| State | `activation-onboarding-state.ts`, `onboarding.ts` (`ONBOARDING_VERSION = 7`) |
| Server truth | `activeInventoryCount` in root `+layout.server.ts` |
| Copy | `onboarding.activation.*` in `sv.json` / `en.json` |

## Telemetry

`onboarding_started`, `onboarding_step_viewed`, `onboarding_scan_started`, `onboarding_scan_completed`, `onboarding_completed`, `onboarding_skipped`

## Common issues

- **Flow reopens after scan:** by design — closes on `/scan/*`, resumes via `deriveActivationScreen()` on calm surfaces.
- **Skip vs complete flags:** localStorage per user in `onboarding.ts`.
- **Stale step:** server `activeInventoryCount` vs client flags mismatch.

## Related

- [ONBOARDING_DEVELOPER.md](../ONBOARDING_DEVELOPER.md) §7
- [scan-receipt.md](./scan-receipt.md)
