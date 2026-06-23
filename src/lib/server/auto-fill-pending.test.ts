import { describe, expect, it } from 'vitest';
import {
	clearAutoFillPendingStoreForTests,
	peekAutoFillPending,
	storeAutoFillPending,
	takeAutoFillPending
} from './auto-fill-pending';

describe('auto-fill-pending', () => {
	it('stores and takes pending suggestions per household user', () => {
		clearAutoFillPendingStoreForTests();
		storeAutoFillPending({
			householdId: 'house-1',
			userId: 'user-1',
			items: [
				{
					name: 'Mjölk',
					quantity: '1',
					category: 'Mejeri',
					reason: 'test',
					priority: 'high'
				}
			],
			note: 'note'
		});

		expect(peekAutoFillPending('house-1', 'user-1')?.count).toBe(1);
		const taken = takeAutoFillPending('house-1', 'user-1');
		expect(taken?.items[0]?.name).toBe('Mjölk');
		expect(peekAutoFillPending('house-1', 'user-1')).toBeNull();
	});
});
