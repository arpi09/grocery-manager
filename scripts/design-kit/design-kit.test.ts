import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REQUIRED_SCREENSHOTS, validateAssets } from './validate-assets.ts';
import { exportTokens } from './export-tokens.ts';
import { ROOT } from './shared.ts';

describe('design-kit', () => {
	it('lists minimum screenshot routes', () => {
		expect(REQUIRED_SCREENSHOTS).toContain('home');
		expect(REQUIRED_SCREENSHOTS).toContain('shopping-plan');
		expect(REQUIRED_SCREENSHOTS.length).toBeGreaterThanOrEqual(16);
	});

	it('exportTokens writes TOKENS.md with CSS var references', () => {
		exportTokens();
		const tokens = readFileSync(join(ROOT, 'design/TOKENS.md'), 'utf8');
		expect(tokens).toContain('--color-primary');
		expect(tokens).toContain('brand-colors.generated.css');
		expect(tokens).not.toMatch(/#2c4a3e/);
	});

	it('validateAssets passes when docs exist', () => {
		const result = validateAssets({ strictScreenshots: false });
		expect(result.missingDocs).not.toContain('DESIGN.md');
		expect(existsSync(join(ROOT, 'design/DESIGN.md'))).toBe(true);
	});
});
