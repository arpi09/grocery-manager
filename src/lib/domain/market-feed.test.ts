import { describe, expect, it } from 'vitest';
import { earliestExpiryOn, sortNearbySharesByExpiry } from './market-feed';

describe('market-feed', () => {
	it('picks earliest expiry from preview items', () => {
		expect(
			earliestExpiryOn([
				{ expiresOn: '2026-06-10' },
				{ expiresOn: '2026-06-05' },
				{ expiresOn: null }
			])
		).toBe('2026-06-05');
	});

	it('sorts shares by soonest expiry then distance', () => {
		const sorted = sortNearbySharesByExpiry([
			{
				previewItems: [{ expiresOn: '2026-06-12' }],
				approximateDistanceM: 100
			},
			{
				previewItems: [{ expiresOn: '2026-06-08' }],
				approximateDistanceM: 300
			}
		]);

		expect(sorted[0]?.previewItems[0]?.expiresOn).toBe('2026-06-08');
	});
});
