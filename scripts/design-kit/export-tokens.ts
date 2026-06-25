/**
 * Export design/TOKENS.md from generated CSS + brand TS metadata (no manual hex duplication).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	BRAND_CSS,
	BRAND_COLORS_TS,
	DESIGN_DIR,
	TOKENS_CSS,
	generatedHeader,
	ensureDir,
	isDirectScriptRun
} from './shared.ts';

function parseCssCustomProperties(css: string): string[] {
	const names: string[] = [];
	for (const match of css.matchAll(/^\s*(--[\w-]+):/gm)) {
		names.push(match[1]!);
	}
	return [...new Set(names)];
}

function extractTsExports(ts: string): string[] {
	const exports: string[] = [];
	for (const match of ts.matchAll(/^export (?:const|function|type|interface) (\w+)/gm)) {
		exports.push(match[1]!);
	}
	return exports;
}

function buildTokensMarkdown(): string {
	const colorsCss = readFileSync(BRAND_CSS, 'utf8');
	const tokensCss = readFileSync(TOKENS_CSS, 'utf8');
	const brandTs = readFileSync(BRAND_COLORS_TS, 'utf8');

	const colorVars = parseCssCustomProperties(colorsCss);
	const layoutVars = parseCssCustomProperties(tokensCss);
	const trackMatch = colorsCss.match(/Track: (\w+)/);
	const track = trackMatch?.[1] ?? 'fresh';

	const lines = [
		generatedHeader('scripts/design-kit/export-tokens.ts'),
		'# Design tokens (machine-readable summary)',
		'',
		'> Hex values live **only** in [`src/lib/design/brand-colors.ts`](../src/lib/design/brand-colors.ts).',
		'> Regenerate CSS: `npm run brand:css`. Regenerate this file: `npm run design:build`.',
		'',
		'## Source files',
		'',
		'| Layer | Path | Role |',
		'|-------|------|------|',
		'| Hex source of truth | `src/lib/design/brand-colors.ts` | Palette tracks, locked logo core |',
		'| Typography | `src/lib/design/brand/typography.ts` | DM Sans scale, weights |',
		'| Layout | `src/lib/design/brand/layout.ts` | Radius, space, shadows |',
		`| Active track | **${track}** | \`BRAND_PALETTE\` env at build time |`,
		'| Color CSS | `src/lib/design/brand-colors.generated.css` | `--color-*`, toast vars |',
		'| Layout CSS | `src/lib/design/brand-tokens.generated.css` | `--font-*`, `--radius-*`, `--space-*` |',
		'| App import | `src/app.css` | Imports both generated CSS files |',
		'| Live QA | `/brand` | Swatches + component gallery |',
		'',
		'## CSS custom properties — color (`brand-colors.generated.css`)',
		'',
		'Use `var(--token)` in components — never inline hex.',
		'',
		'| Token | Light/dark |',
		'|-------|------------|'
	];

	for (const name of colorVars) {
		lines.push(`| \`${name}\` | See generated CSS |`);
	}

	lines.push('', '## CSS custom properties — typography & layout (`brand-tokens.generated.css`)', '', '| Token |', '|-------|');
	for (const name of layoutVars) {
		lines.push(`| \`${name}\` |`);
	}

	lines.push('', '## Motion tokens (`src/app.css`)', '', '| Token | Default |', '|-------|---------|');
	for (const [token, value] of [
		['--motion-duration-fast', '0.15s'],
		['--motion-duration-normal', '0.24s'],
		['--motion-duration-slow', '0.42s'],
		['--motion-ease-out', 'cubic-bezier(0.33, 1, 0.68, 1)'],
		['--motion-ease-in-out', 'cubic-bezier(0.45, 0, 0.55, 1)']
	]) {
		lines.push(`| \`${token}\` | ${value} |`);
	}

	lines.push('', '## TypeScript exports (`brand-colors.ts`)', '');
	for (const name of extractTsExports(brandTs).slice(0, 24)) {
		lines.push(`- \`${name}\``);
	}
	if (extractTsExports(brandTs).length > 24) {
		lines.push(`- … and ${extractTsExports(brandTs).length - 24} more`);
	}

	return lines.join('\n') + '\n';
}

export function exportTokens(): void {
	ensureDir(DESIGN_DIR);
	writeFileSync(join(DESIGN_DIR, 'TOKENS.md'), buildTokensMarkdown(), 'utf8');
	console.log('Wrote design/TOKENS.md');
}

if (isDirectScriptRun()) {
	exportTokens();
}
