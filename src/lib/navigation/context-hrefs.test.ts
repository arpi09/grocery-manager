import { describe, expect, it } from 'vitest';

import { PANTRY_SHELF_PATH } from './nav-config';
import { eatFirstWeekHref, expiringItemsHref } from './context-hrefs';

describe('context-hrefs', () => {
	describe('expiringItemsHref', () => {
		it('uses the pantry shelf with expiring filter', () => {
			expect(expiringItemsHref()).toBe(`${PANTRY_SHELF_PATH}?filter=expiring`);
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
