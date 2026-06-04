import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { filterAndSortInventoryItems } from './inventory-list-filters';

function item(overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>): InventoryItem {
	return {
		householdId: 'h1',
		userId: 'user-1',
		location: 'fridge',
		quantity: '1',
		unit: null,
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('filterAndSortInventoryItems', () => {
	const expiringSoon = new Date();
	expiringSoon.setDate(expiringSoon.getDate() + 2);
	const expiringIso = expiringSoon.toISOString().slice(0, 10);

	const items = [
		item({ id: '1', name: 'Zucchini', expiresOn: '2099-01-01' }),
		item({ id: '2', name: 'Apple', expiresOn: expiringIso }),
		item({ id: '3', name: 'Banana' })
	];

	it('filters by name and expiry', () => {
		const soon = filterAndSortInventoryItems(items, '', 'expiring', 'name');
		expect(soon.map((row) => row.name)).toEqual(['Apple']);
	});

	it('sorts by expiry then name', () => {
		const sorted = filterAndSortInventoryItems(items, '', 'all', 'expiry');
		expect(sorted.map((row) => row.name)).toEqual(['Apple', 'Zucchini', 'Banana']);
	});

	it('sorts by quantity then name', () => {
		const withQty = [
			item({ id: '1', name: 'Milk', quantity: '2' }),
			item({ id: '2', name: 'Eggs', quantity: '12' }),
			item({ id: '3', name: 'Butter', quantity: '1' })
		];
		const sorted = filterAndSortInventoryItems(withQty, '', 'all', 'quantity');
		expect(sorted.map((row) => row.name)).toEqual(['Butter', 'Milk', 'Eggs']);
	});
});
