import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	buildInventoryListUrl,
	compareInventoryItems,
	filterAndSortInventoryItems,
	parseInventoryExpiryFilter
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
	it('filters items without expiry date', () => {
		const items = [
			item({ id: '1', name: 'Zucchini', expiresOn: '2099-01-01' }),
			item({ id: '3', name: 'Banana' })
		];
		expect(filterAndSortInventoryItems(items, '', 'noExpiry', 'name').map((r) => r.name)).toEqual(['Banana']);
	});
});

describe('parseInventoryExpiryFilter', () => {
	it('parses noExpiry and defaults to all', () => {
		expect(parseInventoryExpiryFilter('noExpiry')).toBe('noExpiry');
		expect(parseInventoryExpiryFilter(null)).toBe('all');
	});
});

describe('buildInventoryListUrl', () => {
	it('sets filter query param', () => {
		expect(buildInventoryListUrl('/inventory/fridge', 'noExpiry')).toBe('/inventory/fridge?filter=noExpiry');
	});
});

describe('compareInventoryItems', () => {
	it('flips sign for descending', () => {
		const a = item({ id: '1', name: 'Apple', expiresOn: '2026-01-01' });
		const b = item({ id: '2', name: 'Banana', expiresOn: '2026-06-01' });
		expect(compareInventoryItems(a, b, 'expiry', 'asc')).toBeLessThan(0);
	});
});
