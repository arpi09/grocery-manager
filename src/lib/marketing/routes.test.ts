import { describe, expect, it } from 'vitest';
import {
	isMarketingPath,
	isPublicCityFeedPath,
	isShoppingListSharePath,
	MARKETING_LANDING_PATHS,
	PUBLIC_MARKETING_PATHS
} from './routes';

describe('marketing routes', () => {
	it('treats landing and legal pages as marketing', () => {
		for (const path of PUBLIC_MARKETING_PATHS) {
			expect(isMarketingPath(path)).toBe(true);
		}
		expect(isMarketingPath('/hem')).toBe(false);
	});

	it('includes root landing for authenticated visitors', () => {
		expect(MARKETING_LANDING_PATHS).toContain('/');
	});

	it('treats /guider and guide slugs as marketing', () => {
		expect(isMarketingPath('/guider')).toBe(true);
		expect(isMarketingPath('/guider/minska-matsvinn-hemma-app')).toBe(true);
	});

	it('treats programmatic /kvitto/[store] pages as marketing (public + indexable)', () => {
		expect(isMarketingPath('/kvitto/ica')).toBe(true);
		expect(isMarketingPath('/kvitto/coop')).toBe(true);
		expect(isMarketingPath('/kvitto')).toBe(false);
		expect(isMarketingPath('/kvitto-pdf-kivra')).toBe(true);
	});

	it('treats shopping list share tokens as public acquisition paths', () => {
		expect(isShoppingListSharePath('/lista/abc123')).toBe(true);
		expect(isShoppingListSharePath('/lista/')).toBe(true);
		expect(isShoppingListSharePath('/lista')).toBe(false);
	});

	it('treats city feed as public acquisition path', () => {
		expect(isPublicCityFeedPath('/delningar')).toBe(true);
		expect(isPublicCityFeedPath('/delningar/')).toBe(true);
		expect(isPublicCityFeedPath('/delningar/malmo')).toBe(true);
		expect(isPublicCityFeedPath('/delning')).toBe(false);
	});
});
