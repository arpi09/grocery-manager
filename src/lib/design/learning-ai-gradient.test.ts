import { describe, expect, it } from 'vitest';
import { getLearningAiGradientStops, mergePalette } from './brand-colors';

function relativeLuminance(hex: string): number {
	const normalized = hex.replace('#', '');
	const r = parseInt(normalized.slice(0, 2), 16) / 255;
	const g = parseInt(normalized.slice(2, 4), 16) / 255;
	const b = parseInt(normalized.slice(4, 6), 16) / 255;
	const transform = (channel: number) =>
		channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	const [lr, lg, lb] = [transform(r), transform(g), transform(b)];
	return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(foreground: string, background: string): number {
	const l1 = relativeLuminance(foreground);
	const l2 = relativeLuminance(background);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

describe('learning AI gradient tokens', () => {
	it('uses distinct light and dark gradient stops for fresh track', () => {
		const light = getLearningAiGradientStops('fresh', 'light');
		const dark = getLearningAiGradientStops('fresh', 'dark');
		expect(light).not.toEqual(dark);
		expect(light[0]).toBe('#3E5288');
		expect(dark[0]).toBe('#384E78');
	});

	it('meets 4.5:1 contrast for white text on gradient mid-stop', () => {
		for (const mode of ['light', 'dark'] as const) {
			const stops = getLearningAiGradientStops('fresh', mode);
			const onPrimary = mergePalette('fresh')[mode].onPrimary;
			const midStop = stops[Math.floor(stops.length / 2)] ?? stops[0];
			expect(contrastRatio(onPrimary, midStop)).toBeGreaterThanOrEqual(4.5);
		}
	});
});
