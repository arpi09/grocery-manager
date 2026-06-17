import { describe, expect, it } from 'vitest';
import { HOME_V5_MARKUP } from './home-v5-markup';

describe('HOME_V5_MARKUP', () => {
	it('keeps a single h1 in hero and h2 on cards', () => {
		expect(HOME_V5_MARKUP.heroHeadingLevel).toBe(1);
		expect(HOME_V5_MARKUP.cardHeadingLevel).toBe(2);
	});

	it('uses section landmarks and decorative illustrations', () => {
		expect(HOME_V5_MARKUP.landmarkRole).toBe('section');
		expect(HOME_V5_MARKUP.decorativeIllustration).toBe('aria-hidden');
	});

	it('exposes stable test ids for overview cards', () => {
		expect(HOME_V5_MARKUP.cardTestIds).toContain('home-expiring-card');
		expect(HOME_V5_MARKUP.cardTestIds).toContain('home-shopping-card');
	});
});
