# DESIGN_V2.md — Skaffu Consumer UX V2 Canonical Design Language

> **Status:** LOCKED (Reference for all V2 implementations)  
> **Philosophy:** Quiet Architectural Modernism — Scandinavian minimalism, domestic warmth, and high-utility density.

## 1. Colors
Normalize all V2 screens to these existing tokens. No inline hex.

| Token | Role | Approved Value (Light) |
|-------|------|------------------------|
| `--color-primary` | Main branding, primary CTA | `#2c4a3e` (Forest Green) |
| `--color-bg` | Page background | `#fbf9f4` (Warm Off-white) |
| `--color-surface` | Primary card/container background | `#ffffff` (Pure White) |
| `--color-surface-muted` | Secondary/background sections | `#f5f3ee` (Taupe-tinted) |
| `--color-border` | Subtle dividers and outlines | `#dbdad5` (Warm Gray) |
| `--color-text` | Primary headers and body | `#1f2a24` (Deep Charcoal) |
| `--color-text-muted` | Metadata and secondary labels | `#4a5850` (Slate Gray) |
| `--color-success` | Positive states / saved | `#3d8f5c` |
| `--color-warning` | Expiry soon / alerts | `#c9870a` |
| `--color-danger` | Errors / destructive | `#c44d4d` |
| `--color-fridge` | Location: Kyl | `#056B52` |
| `--color-freezer` | Location: Frys | `#3F4F63` |
| `--color-cupboard` | Location: Skafferi | `#A05228` |

## 2. Radius Scale
Consistency across all V2 components.

| Token | Value | Applied To |
|-------|-------|------------|
| `--radius-sm` | 8px | Chips, small buttons, status badges |
| `--radius-md` | 12px | Standard cards, input fields, illustrations |
| `--radius-lg` | 16px | Large cards (Home), bottom sheets, dialogs |

## 3. Spacing & Density
Dynamic rhythm based on screen purpose.

### Spacing Tokens
- `Page Padding:` `--space-md` (16px)
- `Section Gap:` `--space-xl` (32px)
- `Card Internal Padding:` `--space-md` (16px)
- `List Row Gap:` `--space-xs` (4px)

### Density Rules
| Page Type | Density | Principle |
|-----------|---------|-----------|
| **Home** | Spacious | Calm, low cognitive load, welcoming. |
| **Shopping** | Compact Premium | High-utility, scannable checklist, minimal whitespace. |
| **Pantry** | Balanced | Structured inventory, clear metadata. |
| **Details** | Readability | Focus on one item, generous typography. |
| **Settings** | Native | Standard system list density for familiarity. |

## 4. Typography
Hierarchies derived from DM Sans.

| Role | Token / Style | Usage |
|------|---------------|-------|
| **H1** | `font-display text-display-mobile` | Main page headline (e.g., "God kväll") |
| **H2** | `font-headline-md` | Major section headers |
| **Section Title** | `font-label-caps text-label-caps` | Small caps for categories (e.g., "FÖR ER") |
| **Body** | `font-body text-body` | Primary content text |
| **Body Small** | `font-body-sm text-body-sm` | Secondary descriptions |
| **Label** | `font-label text-label` | Metadata, tags |
| **Button Text** | `font-label font-bold` | Primary and secondary actions |

## 5. Component Language

### Cards
- **Background:** `--color-surface`
- **Border:** None (use subtle shadow or `--color-surface-muted` background)
- **Shadow:** `--shadow-sm` (subtle architectural lift)
- **Radius:** `--radius-md` (Default) or `--radius-lg` (Hero)

### Lists
- **Rows:** 56px height for touch targets.
- **Dividers:** `--color-border` (1px solid) or simple whitespace gap.
- **Metadata:** Right-aligned or secondary line below title.

### Buttons
- **Primary:** Filled `--color-primary`, white text.
- **Secondary:** Outlined `--color-primary` or background `--color-surface-muted`.
- **Tertiary:** Ghost text-only (`--color-text`).
- **Mobile CTA:** Always full-width, sticky to bottom safe area.

## 6. Illustration Usage
- **Allowed:** Only on Home (Hero) and Onboarding.
- **Max Height:** 160px on mobile.
- **Constraint:** Hide/Remove on all utility screens (Shopping, Scan, Lager) to prioritize density.
- **Integration:** Soft edges, no harsh borders, interacting with `--color-bg`.

## 7. Motion & Accessibility
- **Transitions:** Suble fade-in (`0.2s ease-out`).
- **No:** Bounce, spin, or distracting UI noise.
- **Contrast:** AA minimum for all text (4.5:1).
- **Touch:** 44px min target for all interactions.
- **Color:** Never use color alone to convey meaning (always accompany with icon or text label).
