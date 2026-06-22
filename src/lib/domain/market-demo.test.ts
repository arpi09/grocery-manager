import { describe, expect, it } from 'vitest';
import {
	isMarketDemoSeedEnabled,
	marketDemoListingFixtures,
	MARKET_DEMO_DEFAULT_CENTER
} from './market-demo';

describe('market-demo', () => {
	it('builds four fixtures near the center', () => {
		const fixtures = marketDemoListingFixtures(MARKET_DEMO_DEFAULT_CENTER);
		expect(fixtures).toHaveLength(4);
		for (const fixture of fixtures) {
			expect(fixture.latitude).toBeGreaterThan(59);
			expect(fixture.longitude).toBeGreaterThan(18);
			expect(fixture.items.length).toBeGreaterThan(0);
		}
	});

	it('allows seed unless env explicitly disables it', () => {
		expect(isMarketDemoSeedEnabled(() => undefined)).toBe(true);
		expect(isMarketDemoSeedEnabled(() => 'false')).toBe(false);
	});
});
