import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	filterItemsExpiringWithinDays,
	isWithinExpiryWindow,
	normalizeExpiryReminderDays,
	shouldSendExpiryReminder
} from '$lib/domain/expiry-reminder';

function item(overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'expiresOn'>): InventoryItem {
	return {
		householdId: 'hh-1',
		userId: 'user-1',
		name: 'Test',
		location: 'fridge',
		quantity: '1',
		unit: null,
		notes: null,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides
	};
}

describe('expiry-reminder domain', () => {
	const today = new Date(2026, 4, 30); // 2026-05-30 local

	it('isWithinExpiryWindow includes today through N days ahead', () => {
		expect(isWithinExpiryWindow('2026-05-30', 7, today)).toBe(true);
		expect(isWithinExpiryWindow('2026-06-06', 7, today)).toBe(true);
		expect(isWithinExpiryWindow('2026-06-07', 7, today)).toBe(false);
		expect(isWithinExpiryWindow('2026-05-29', 7, today)).toBe(false);
	});

	it('filterItemsExpiringWithinDays selects and sorts by expiry date', () => {
		const items = [
			item({ id: 'a', name: 'Later', expiresOn: '2026-06-05' }),
			item({ id: 'b', name: 'Soon', expiresOn: '2026-05-31' }),
			item({ id: 'c', name: 'No date', expiresOn: null }),
			item({ id: 'd', name: 'Past', expiresOn: '2026-05-28' }),
			item({ id: 'e', name: 'Far', expiresOn: '2026-07-01' })
		];

		expect(filterItemsExpiringWithinDays(items, 7, today).map((row) => row.id)).toEqual(['b', 'a']);
	});

	it('filterItemsExpiringWithinDays respects a 3-day window', () => {
		const items = [
			item({ id: 'a', expiresOn: '2026-06-01' }),
			item({ id: 'b', expiresOn: '2026-06-02' }),
			item({ id: 'c', expiresOn: '2026-06-04' })
		];

		expect(filterItemsExpiringWithinDays(items, 3, today).map((row) => row.id)).toEqual(['a', 'b']);
	});

	it('shouldSendExpiryReminder enforces weekly interval', () => {
		expect(shouldSendExpiryReminder(null, today)).toBe(true);
		expect(shouldSendExpiryReminder(new Date(2026, 4, 29), today)).toBe(false);
		expect(shouldSendExpiryReminder(new Date(2026, 4, 22), today)).toBe(true);
	});

	it('normalizeExpiryReminderDays falls back to default', () => {
		expect(normalizeExpiryReminderDays(3)).toBe(3);
		expect(normalizeExpiryReminderDays(7)).toBe(7);
		expect(normalizeExpiryReminderDays(14)).toBe(7);
	});
});
