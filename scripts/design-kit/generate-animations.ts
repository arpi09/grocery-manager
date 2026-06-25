/**
 * Generate design/ANIMATIONS.md from src/app.css motion utilities.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESIGN_DIR, ROOT, generatedHeader, ensureDir, isDirectScriptRun } from './shared.ts';

const APP_CSS = join(ROOT, 'src/app.css');

export function generateAnimationsDoc(): void {
	ensureDir(DESIGN_DIR);
	const css = readFileSync(APP_CSS, 'utf8');

	const motionVars = [...css.matchAll(/(--motion-[\w-]+):\s*([^;]+);/g)].map((m) => ({
		token: m[1]!,
		value: m[2]!.trim()
	}));

	const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]!);
	const utilityClasses = [...css.matchAll(/^\.(motion-[\w-]+)/gm)].map((m) => m[1]!);

	const lines = [
		generatedHeader('scripts/design-kit/generate-animations.ts'),
		'# Motion & animation',
		'',
		'> Extracted from `src/app.css`. Skaffu uses **CSS-only** motion with `prefers-reduced-motion` support.',
		'',
		'## Duration & easing tokens',
		'',
		'| Token | Value |',
		'|-------|-------|'
	];

	for (const { token, value } of motionVars) {
		lines.push(`| \`${token}\` | ${value} |`);
	}

	lines.push('', '## Utility classes', '');
	for (const cls of utilityClasses) {
		lines.push(`- \`.${cls}\``);
	}

	lines.push('', '## Keyframes', '');
	for (const name of keyframes) {
		lines.push(`- \`${name}\``);
	}

	lines.push(
		'',
		'## Modal scrim',
		'',
		'- `.modal-scrim` — fade-in via `modal-scrim-in` (0.2s ease-out)',
		'- Disabled when `prefers-reduced-motion: reduce`',
		'',
		'## Stagger pattern',
		'',
		'`.motion-stagger-children > *` applies fade-in with 40ms incremental delay (max 320ms).',
		'',
		'## Press feedback',
		'',
		'`.motion-press:active` scales to 0.97 — use on tappable cards, not form fields.',
		'',
		'## Guidelines for AI tools',
		'',
		'- Prefer subtle fade/slide (6px translateY max)',
		'- Never block interaction with long animations',
		'- Respect reduced motion — no essential info in animation-only cues',
		''
	);

	writeFileSync(join(DESIGN_DIR, 'ANIMATIONS.md'), lines.join('\n'), 'utf8');
	console.log('Wrote design/ANIMATIONS.md');
}

if (isDirectScriptRun()) {
	generateAnimationsDoc();
}
