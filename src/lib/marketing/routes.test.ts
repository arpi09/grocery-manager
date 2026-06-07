import { describe, expect, it } from 'vitest';
import { isMarketingPath, MARKETING_LANDING_PATHS, PUBLIC_MARKETING_PATHS } from './routes';

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
});
