# Activation onboarding

> State-driven 4-screen flow (v8) — modal overlay, not a route carousel. **Tier A:** finish → `/inkop?quick=1`.

## Routes & surfaces

| Surface | Location |
|---------|----------|
| Modal flow | `ActivationOnboardingFlow` in `AppLayout` |
| PWA install wedge | `/install-app` |
| Post-register | `/verify-email` → app with `freshAccount=1` |

## Flow

```mermaid
flowchart LR
  Register[Register/OAuth]
  Verify[/verify-email]
  Modal[Modal: welcome → fill → invite → finish]
  Inkop[/inkop?quick=1]
  Register --> Verify
  Verify --> Modal
  Modal -->|"Finish"| Inkop
```

## Screens (v8)

1. **welcome** — wow-öppning med loop-illustration; en primär CTA.
2. **fill** — seed skafferiet: staples-chips (`ActivationFillChips`) eller kvittolänk; kan skjutas upp (`fillDeferred`, återanvänder v7:s scan-deferred-nyckel).
3. **invite** — hushållsinvite direkt i flödet (`createAndShareHouseholdInvite`, context `onboarding_v8`); ersätter den tidigare post-onboarding share-prompten.
4. **finish** — recap (`ActivationFinishRecap`), push soft-ask, CTA → `/inkop?quick=1`.

## UX

- **Progress** — `OnboardingStepDots` (segmenterade dots, tap bakåt till klarade steg) + `OnboardingStepStage` för illustrationsscen; "Steg X av 4" för skärmläsare.
- **Copy** — `onboarding.activation.*` SV/EN: ni-tone, konkreta köksexempel, inga AI-/marknadsslogans.
- **Illustrationer** — `OnboardingLoopIllustration`, `OnboardingInviteIllustration` (+ legacy `OnboardingWelcomeIllustration`/`OnboardingScanIllustration`).
- **Post-onboarding** — share-prompten är borttagen i v8; enkäten (`PostOnboardingSurvey`) köas direkt vid completion. Legacy share-state migreras lazy via `migrateLegacyShareState` i `onboarding.ts`.

## Key files

| Layer | File |
|-------|------|
| UI | `ActivationOnboardingFlow.svelte`, `OnboardingStepDots.svelte`, `OnboardingStepStage.svelte`, `ActivationFillChips.svelte`, `ActivationFinishRecap.svelte`, `ActivationOnboardingScreen.svelte` |
| State | `activation-onboarding-state.ts`, `onboarding-steps.ts`, `onboarding.ts` (`ONBOARDING_VERSION = 8`) |
| Server truth | `activeInventoryCount` in root `+layout.server.ts` |
| Copy | `onboarding.activation.*` in `sv.json` / `en.json` |

## Telemetry

`onboarding_started`, `onboarding_step_viewed`, `onboarding_seed_choice` (`choice: staples/receipt/skip`), `onboarding_scan_started`, `onboarding_scan_completed`, `onboarding_completed`, `onboarding_finish_state`, `onboarding_skipped`, `onboarding_notifications_prompted`, `household_invite_prompt_clicked`/`_dismissed` (context `onboarding_v8`)

## Common issues

- **Flow reopens after scan:** by design — closes on `/scan/*`, resumes via `deriveActivationScreen()` on calm surfaces.
- **Skip vs complete flags:** localStorage per user in `onboarding.ts`; v8 completes only at finish (`activation-finish-seen`; legacy `activation-shopping-seen` accepted).
- **Stale step:** server `activeInventoryCount` vs client flags mismatch.

## Related

- [ONBOARDING_DEVELOPER.md](../ONBOARDING_DEVELOPER.md) §7
- [scan-receipt.md](./scan-receipt.md)
- Household growth ([household.md](./household.md), [HOUSEHOLD_GROWTH.md](../HOUSEHOLD_GROWTH.md)): referenser till post-onboarding share-prompten avser numera invite-steget i onboardingflödet.
