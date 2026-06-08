import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	compareInventoryItems,
	filterAndSortInventoryItems
} from './inventory-list-filters';

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
		lastConfirmedAt: new Date(),
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

	it('filters items without expiry date', () => {
		const noExpiry = filterAndSortInventoryItems(items, '', 'noExpiry', 'name');
		expect(noExpiry.map((row) => row.name)).toEqual(['Banana']);
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

	it('sorts expiry descending (latest / no date last)', () => {
		const sorted = filterAndSortInventoryItems(items, '', 'all', 'expiry', 'desc');
		expect(sorted.map((row) => row.name)).toEqual(['Banana', 'Zucchini', 'Apple']);
	});

	it('reverses name order when direction is desc', () => {
		const sorted = filterAndSortInventoryItems(items, '', 'all', 'name', 'desc');
		expect(sorted.map((row) => row.name)).toEqual(['Zucchini', 'Banana', 'Apple']);
	});
});

describe('compareInventoryItems', () => {
	const a = item({ id: '1', name: 'Apple', expiresOn: '2026-01-01' });
	const b = item({ id: '2', name: 'Banana', expiresOn: '2026-06-01' });

	it('flips sign for descending', () => {
		expect(compareInventoryItems(a, b, 'expiry', 'asc')).toBeLessThan(0);
		expect(compareInventoryItems(a, b, 'expiry', 'desc')).toBeGreaterThan(0);
	});
});
