---
name: Skaffu Editorial Home
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#414845'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#727974'
  outline-variant: '#c1c8c3'
  surface-tint: '#466558'
  primary: '#153328'
  on-primary: '#ffffff'
  primary-container: '#2c4a3e'
  on-primary-container: '#98b9a9'
  inverse-primary: '#adcebe'
  secondary: '#546347'
  on-secondary: '#ffffff'
  secondary-container: '#d7e8c5'
  on-secondary-container: '#5a694d'
  tertiary: '#3e2a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5a3f00'
  on-tertiary-container: '#d6aa55'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8eada'
  primary-fixed-dim: '#adcebe'
  on-primary-fixed: '#012016'
  on-primary-fixed-variant: '#2f4d41'
  secondary-fixed: '#d7e8c5'
  secondary-fixed-dim: '#bbccaa'
  on-secondary-fixed: '#121f09'
  on-secondary-fixed-variant: '#3d4b31'
  tertiary-fixed: '#ffdea6'
  tertiary-fixed-dim: '#eec068'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
  fridge-emerald: '#056B52'
  freezer-frost: '#3F4F63'
  cupboard-warm-brown: '#A05228'
  surface-white: '#ffffff'
  text-main: '#1f2a24'
  text-muted: '#4a5850'
  border-soft: '#dde5d8'
typography:
  display-lg:
    fontFamily: DM Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: DM Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-caps:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  margin-page: 24px
  section-gap: 48px
  gutter: 16px
  touch-target: 44px
---

## Brand & Style

The design system embodies the "Editorial Home" aesthetic—a sophisticated blend of Scandinavian minimalism and warm, domestic utility. It is designed to feel like a premium lifestyle catalog (inspired by Muuto or Montana), evoking a sense of intentionality, calm, and architectural permanence.

The style is **Minimalist & Tactile**, prioritizing high-quality typography and generous whitespace over decorative borders. It creates a "forever-ready" atmosphere that feels less like a utility app and more like a curated kitchen assistant. The interface avoids "digital noise," using soft shadows and natural tones to create depth while maintaining a focused, high-end editorial feel.

**Key Principles:**
- **Warmth:** Use off-white surfaces to avoid the sterile feel of pure white.
- **Intentionality:** Every element has breathing room; whitespace is a functional tool for grouping, not just a void.
- **Architectural:** Hierarchy is built through structural font weights and scale rather than containers.

## Colors

The palette is rooted in nature-inspired tones: **Forest Green** for primary actions, supported by **Warm Neutrals** and **Soft Taupes**. 

- **Primary (#2c4a3e):** Used for high-contrast "Decision Moments" and primary CTAs.
- **Surface (#f7f5f0):** The foundation of the "Editorial Home" look; a warm off-white that reduces eye strain and feels domestic.
- **Semantic Colors:** Inventory locations are color-coded with distinct hues:
    - **Fridge (Kyl):** Deep Emerald.
    - **Freezer (Frys):** Frost Gray/Blue.
    - **Cupboard (Skafferi):** Warm Earthy Brown.

Avoid using pure black for text; use the deep charcoal-green (`text-main`) to maintain the organic feel of the brand.

## Typography

DM Sans is the sole typeface, used with high intentionality to create hierarchy without the need for visual chrome.

- **Display & Headlines:** Bold and architectural. Use tight tracking (`-0.02em`) to give headers a modern, "locked-in" editorial appearance.
- **Body:** Set at 16px with an airy `1.6` line-height. This generous leading is critical for the "Skaffu" aesthetic, ensuring even dense information feels readable and calm.
- **Labels:** Use uppercase with increased letter-spacing (`+0.05em`) for metadata, categorizations, and small hints.
- **Hierarchy Rule:** Differentiate levels primarily through weight (Bold vs. Regular) and size. Avoid wrapping every piece of text in a box or border; let the vertical rhythm guide the eye.

## Layout & Spacing

The design system uses a strict **4px/8px base grid** to ensure mathematical harmony. 

- **Whitespace as Divider:** Use large vertical gaps (48px+) between major content blocks instead of horizontal lines. This maintains the "airy" catalog feel.
- **Grid Model:** 12-column fixed grid for desktop (centered), fluid 4-column for mobile.
- **Margins:** Consistent 24px outer page margins on all mobile views to provide a "frame" for the content.
- **Touch Targets:** Minimum 44px (2.75rem) height for all interactive elements to ensure ease of use during "one-handed kitchen moments."

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Surface Strategy:** The background uses the warm Neutral (`#f7f5f0`), while cards and "Decision Moments" lift off using pure White (`#ffffff`).
- **Shadows:** Use ultra-diffused, low-opacity shadows for cards (e.g., `0px 4px 20px rgba(0,0,0,0.04)`). The goal is a subtle "lift" that feels natural and physical.
- **Overlays:** Dialogs and bottom sheets utilize a massive backdrop blur (20px+) to maintain context while creating a distinct focus layer.

## Shapes

The shape language is refined and soft, avoiding harsh 90-degree angles to maintain the domestic, approachable feel.

- **Standard Radius:** 0.5rem (8px) for chips and small elements.
- **Card Radius:** 1rem to 1.5rem (16px to 24px) for major content containers.
- **Dialogs:** Bottom sheets should feature a pronounced 32px top radius to emphasize their "slide-up" organic movement.

## Components

- **Buttons:** 
    - **Primary:** Pill-shaped (fully rounded), Forest Green background with white text. 
    - **Secondary/Tertiary:** Ghost or text-only links, often accompanied by a subtle arrow icon. Never use two filled buttons in the same section.
- **Cards:** Used sparingly. Only use cards for "Decision Moments" or distinct grouped data. They should have a white background, soft shadows, and no borders.
- **Chips:** 8px radius. Use semantic background tints for inventory locations (Kyl, Frys, Skafferi).
- **Navigation:** A ghost-like bottom navigation bar. Use high-contrast icons for active states, paired with a soft background shape to indicate the selection.
- **Input Fields:** Minimalist with soft background tints. Focus states are indicated by the Accent Gold color used sparingly.
- **Banners:** Zero borders. Use soft background tints (e.g., pale red for errors, pale green for success) that span the full width or align top-down with the content flow.
- **Illustrations:** Integrated, soft-focus, and architectural. They should sit alongside or behind copy with ample whitespace, never feeling like "clip-art."