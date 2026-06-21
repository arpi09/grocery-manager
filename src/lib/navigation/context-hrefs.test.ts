import { describe, expect, it } from 'vitest';

import { PANTRY_SHELF_PATH } from './nav-config';
import { eatFirstWeekHref, expiringItemsHref } from './context-hrefs';

describe('context-hrefs', () => {
	describe('expiringItemsHref', () => {
		it('uses pantry shelf when UX v2 is enabled', () => {
			expect(expiringItemsHref({ pantryUxV2Enabled: true })).toBe(
				`${PANTRY_SHELF_PATH}?filter=expiring`
			);
		});

		it('uses legacy fridge path when UX v2 is off', () => {
			expect(expiringItemsHref()).toBe('/inventory/fridge?filter=expiring');
			expect(expiringItemsHref({ pantryUxV2Enabled: false })).toBe(
				'/inventory/fridge?filter=expiring'
			);
		});
	});

	describe('eatFirstWeekHref', () => {
		it('builds week view path with optional inbound source', () => {
			expect(eatFirstWeekHref()).toBe('/planer/vecka');
			expect(eatFirstWeekHref('stats')).toBe('/planer/vecka?from=stats');
			expect(eatFirstWeekHref('planer')).toBe('/planer/vecka?from=planer');
		});
	});
});
