import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BRAND_MARK_COLORS, buildMarkGroup, getMarkInnerSvg } from './skaffu-mark.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('skaffu-mark', () => {
	it('favicon.svg uses gold accent rect (not curved leaf)', () => {
		const favicon = readFileSync(join(root, 'static/favicon.svg'), 'utf8');
		expect(favicon).toContain(`fill="${BRAND_MARK_COLORS.accent}"`);
		expect(favicon).toMatch(/<rect[^>]+x="20\.8"[^>]+fill="#d4a853"/);
	});

	it('AppLogo.svelte matches favicon geometry without mark-leaf', () => {
		const appLogo = readFileSync(
			join(root, 'src/lib/components/atoms/AppLogo.svelte'),
			'utf8'
		);
		expect(appLogo).not.toContain('mark-leaf');
		expect(appLogo).toContain('width="32" height="32" rx="8"');
		expect(appLogo).toContain('fill="#d4a853"');
	});

	it('buildMarkGroup scales and positions the mark', () => {
		const group = buildMarkGroup({ x: 96, y: 172, size: 108 });
		expect(group).toMatch(/^<g transform="translate\(96, 172\) scale\(3\.375\)">/);
		expect(group).toContain(getMarkInnerSvg());
	});
});
