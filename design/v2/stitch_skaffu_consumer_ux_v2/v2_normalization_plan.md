# V2_NORMALIZATION_PLAN.md — Consumer UX V2

Exact token-level corrections to align all screens with `DESIGN_V2.md`.

## 1. Global Normalization
- **Action:** Replace all custom green hex codes with `var(--color-primary)`.
- **Action:** Replace all custom warm-white backgrounds with `var(--color-bg)`.
- **Action:** Force all main cards to `var(--radius-md)` (12px).

## 2. Screen-Specific Corrections

### Inköp (Shopping List)
- **Mismatch:** Card radius is 8px.
- **Fix:** Update all container classes to `rounded-xl` (mapping to `--radius-md`).
- **Mismatch:** List row height varies.
- **Fix:** Standardize `h-14` (56px) for all list items to ensure touch target compliance.

### Lager (Pantry)
- **Mismatch:** Cold white surface (`#fcfcfc`).
- **Fix:** Normalize to `var(--color-surface)` (`#ffffff`).
- **Mismatch:** Location chips vary in height.
- **Fix:** Standardize to `h-8` with `rounded-sm` (8px).

### Skanna (Scanner)
- **Mismatch:** Shutter button color mismatch.
- **Fix:** Update background to `bg-primary` (`#2c4a3e`).
- **Mismatch:** Overlay scrim is too dark.
- **Fix:** Normalize to `bg-black/40` to maintain "Quiet" aesthetic.

### Granska Kvitto (Review Receipt)
- **Mismatch:** Low density.
- **Fix:** Reduce row vertical padding from `py-4` to `py-2`. Maintain large font for readability but reduce "air" between items.

### Inställningar (Settings)
- **Mismatch:** Text-muted is too light.
- **Fix:** Update all secondary labels to `text-text-muted` (`#4a5850`).
