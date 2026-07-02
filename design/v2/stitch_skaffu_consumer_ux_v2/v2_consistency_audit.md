# V2_CONSISTENCY_AUDIT.md — Consumer UX V2

Audit of approved V2 Stitch screens against the locked `DESIGN_V2.md`.

| Screen | Target (V2) | Consistency Area | Status | Notes |
|--------|-------------|------------------|--------|-------|
| {{DATA:SCREEN:SCREEN_120}} | Hem | Colors | PASS | |
| | | Radius | PASS | |
| | | Spacing | PASS | |
| {{DATA:SCREEN:SCREEN_93}} | Inköp | Colors | PASS | |
| | | Radius | **FIX REQUIRED** | Card corners are too sharp (appear as 8px instead of 12px). |
| | | Spacing | **FIX REQUIRED** | List density is inconsistent between Plan and Shop views. |
| {{DATA:SCREEN:SCREEN_102}} | Lager | Colors | **FIX REQUIRED** | Surface uses a colder white compared to Hem. |
| | | Radius | PASS | |
| | | Lists | PASS | |
| {{DATA:SCREEN:SCREEN_117}} | Skanna | Colors | PASS | |
| | | Buttons | **FIX REQUIRED** | Shutter button uses custom green not matching --color-primary. |
| {{DATA:SCREEN:SCREEN_107}} | Granska kvitto | Spacing | **FIX REQUIRED** | Item rows are too tall for high-density utility rule. |
| | | Typography | PASS | |
| {{DATA:SCREEN:SCREEN_25}} | Inställningar | Density | PASS | |
| | | Colors | PASS | |

## Summary of Misalignments
- **Radius Drift:** High-density screens (Inköp) are reverting to smaller radii than the approved `--radius-md`.
- **Color Normalization:** Surface whites in Lager/Settings show slight hex drift from pure `#ffffff`.
- **Primary Green:** The "Scanner" green and some "Inköp" buttons vary by a few points in saturation.
