/**
 * Generate design/AI_CONTEXT.md — philosophy and constraints for AI design tools.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESIGN_DIR, DOCS_UX, generatedHeader, ensureDir, isDirectScriptRun } from './shared.ts';

export function generateAiContext(): void {
	ensureDir(DESIGN_DIR);

	const ux = readFileSync(DOCS_UX, 'utf8');
	const principlesSection = ux.match(/## App UX principles[\s\S]*?(?=\n## |$)/)?.[0] ?? '';

	const content = `${generatedHeader('scripts/design-kit/generate-ai-context.ts')}# AI design context — Skaffu

> Single briefing for Stitch, Cursor, v0, and other AI design tools.  
> Canonical design kit: [DESIGN.md](./DESIGN.md) · Tokens: [TOKENS.md](./TOKENS.md)

## Product philosophy

Skaffu is a **Swedish household pantry & shopping app** — not a SaaS dashboard, not enterprise inventory software.

- **Core loop:** Outgoing food → shared shopping list (\`/inkop\`) → shop together → check off → pantry → next week's list.
- **Tone:** Warm, practical, ni/vi kitchen language — concrete examples, no hype or AI slogans.
- **Speed over chrome:** Fewest taps to scan, add, check off, consume.
- **Mobile-first:** One-handed use, 390×844 reference viewport, bottom nav safe areas.

## Visual identity — do

- **Scandinavian minimalism:** generous whitespace, soft surfaces (\`--color-bg\`, \`--color-surface-muted\`).
- **DM Sans** typography — see \`/brand\` and \`brand/typography.ts\`.
- **Forest green primary** (\`--color-primary\`) — locked logo palette across tracks.
- **Location semantics:** fridge = green, freezer = frost gray, cupboard = warm brown.
- **Atomic Design:** atoms → molecules → organisms; reuse existing components.
- **WCAG 2.2 AA:** contrast, focus-visible, 44px touch targets, one \`h1\` per page.

## Visual identity — avoid

- ❌ Dashboard / analytics-first layouts (statistik is secondary, not hero)
- ❌ Generic SaaS sidebars, dense data tables as primary UI
- ❌ Material Design 3 default look (we use SMUI tokens, not Material You)
- ❌ Heroicons or generic icon packs as default — use existing Skaffu patterns
- ❌ Inline hex — always \`var(--color-*)\` from generated CSS
- ❌ Duplicate button hierarchies — one primary CTA per section
- ❌ Decorative gradients except \`learning-ai\` badge contexts

## Key routes (Swedish locale)

| Screen | Route |
|--------|-------|
| Home | \`/hem\` |
| Shopping plan | \`/inkop\` (plan mode) |
| Shopping trip | \`/inkop\` (shop mode) |
| Pantry | \`/inventory\`, \`/inventory/[location]\` |
| Scan hub | \`/scan\` |
| Receipt | \`/scan/kvitto\`, \`/scan?mode=receipt\` |
| Settings | \`/settings\` |
| Brain / memory | \`/settings/memory\` |
| Brand QA | \`/brand\` (noindex) |
| Start guide | Activation onboarding modal + \`/install-app\` |

## Component sources

| Category | Source |
|----------|--------|
| Buttons, badges | \`src/lib/components/atoms/\` |
| Cards, banners | \`src/lib/components/molecules/\` |
| Page shells | \`src/lib/components/organisms/\` |
| Gallery reference | \`/brand\` page |
| Illustrations | \`static/illustrations/v2/*.svg\` |

## Generated assets

- Screenshots: \`design/SCREENSHOTS/\` — run \`npm run design:screenshots\`
- Flows: \`design/FLOWS/\`
- Components: \`design/COMPONENTS/\`

## UX principles (from docs/UX_GUIDELINES.md)

${principlesSection.replace(/^## App UX principles[^\n]*\n/, '')}

## Architecture constraints

- **SOLID** domain/application/infrastructure layers — UI imports domain types, not DB.
- **No source duplication** in design docs — link to implementation and generated CSS.
- **Tier C frozen** without explicit request: grannskafferiet, Stripe/Pro, meal-AI hero, wrapped statistik as primary surface.

## When proposing UI changes

1. Read \`design/DESIGN.md\` and \`docs/UX_GUIDELINES.md\`.
2. Check \`design/SCREENSHOTS/\` for current visual baseline.
3. Match button hierarchy: primary / secondary / ghost / danger.
4. Every list/async surface needs empty, loading, error, success states.
5. Run \`npm run design:build\` after visual changes to refresh kit assets.
`;

	writeFileSync(join(DESIGN_DIR, 'AI_CONTEXT.md'), content, 'utf8');
	console.log('Wrote design/AI_CONTEXT.md');
}

if (isDirectScriptRun()) {
	generateAiContext();
}
