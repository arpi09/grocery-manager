import { describe, expect, it } from 'vitest';
import { resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import type { InventoryItem } from '$lib/domain/inventory-item';

function makeItem(name: string, expiresOn: string): InventoryItem {
	return {
		id: `id-${name}`,
		householdId: 'h1',
		userId: 'u1',
		name,
		location: 'fridge',
		quantity: '1',
		unit: null,
		expiresOn,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date()
	};
}

describe('eat-first expiring selection', () => {
	const today = new Date(2026, 5, 2);

	it('returns items expiring within seven days sorted by date', () => {
		const items = [
			makeItem('Yoghurt', '2026-06-08'),
			makeItem('Mjölk', '2026-06-03'),
			makeItem('Ris', '2026-07-01')
		];

		const expiring = filterItemsExpiringWithinDays(items, 7, today);
		expect(expiring.map((item) => item.name)).toEqual(['Mjölk', 'Yoghurt']);
	});

	it('maps expiring count to 3–5 week meal slots for eat-first API scope=week', () => {
		const expiring = filterItemsExpiringWithinDays(
			[
				makeItem('Mjölk', '2026-06-03'),
				makeItem('Yoghurt', '2026-06-08'),
				makeItem('Ost', '2026-06-05')
			],
			7,
			today
		);
		expect(resolveEatFirstWeekMealCount(expiring.length)).toBe(4);
	});
});
