import { describe, expect, it } from 'vitest';
import type { InventoryItem } from './inventory-item';
import {
	buildPantryShelfView,
	buildZoneShelf,
	filterInventoryBySearch,
	getActiveInventoryItems,
	groupItemsByZone,
	isUseSoonItem,
	MAX_TILES_PER_ZONE,
	sortZoneItemsForTiles,
	USE_SOON_DAYS
} from './pantry-shelf';

const today = new Date('2026-06-18');

function item(
	overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name' | 'location'>
): InventoryItem {
	return {
		householdId: 'hh1',
		userId: 'u1',
		quantity: '1',
		unit: 'st',
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: today,
		createdAt: today,
		updatedAt: today,
		...overrides
	};
}

describe('pantry-shelf', () => {
	it('filters inventory by search query', () => {
		const items = [
			item({ id: '1', name: 'Mjölk', location: 'fridge' }),
			item({ id: '2', name: 'Pasta', location: 'cupboard' })
		];
		expect(filterInventoryBySearch(items, 'mjölk')).toHaveLength(1);
		expect(filterInventoryBySearch(items, '  ')).toHaveLength(2);
		expect(filterInventoryBySearch(items, 'missing')).toHaveLength(0);
	});

	it('filters finished items and groups by zone', () => {
		const items = [
			item({ id: '1', name: 'Milk', location: 'fridge' }),
			item({ id: '2', name: 'Peas', location: 'freezer', quantity: '0' }),
			item({ id: '3', name: 'Pasta', location: 'cupboard' })
		];

		expect(getActiveInventoryItems(items)).toHaveLength(2);
		expect(groupItemsByZone(items).fridge).toHaveLength(1);
		expect(groupItemsByZone(items).freezer).toHaveLength(0);
		expect(groupItemsByZone(items).cupboard).toHaveLength(1);
	});

	it('sorts use-soon items ahead of stable stock', () => {
		const items = [
			item({ id: '1', name: 'Butter', location: 'fridge', expiresOn: '2026-07-01' }),
			item({ id: '2', name: 'Spinach', location: 'fridge', expiresOn: '2026-06-19' })
		];

		expect(sortZoneItemsForTiles(items, today).map((entry) => entry.id)).toEqual(['2', '1']);
		expect(isUseSoonItem(items[1]!, USE_SOON_DAYS, today)).toBe(true);
	});

	it('caps visible tiles and reports overflow', () => {
		const zoneItems = Array.from({ length: MAX_TILES_PER_ZONE + 2 }, (_, index) =>
			item({
				id: `item-${index}`,
				name: `Item ${index}`,
				location: 'fridge'
			})
		);

		const shelf = buildZoneShelf('fridge', zoneItems, MAX_TILES_PER_ZONE, today);
		expect(shelf.tiles).toHaveLength(MAX_TILES_PER_ZONE);
		expect(shelf.overflowCount).toBe(2);
		expect(shelf.totalCount).toBe(MAX_TILES_PER_ZONE + 2);
	});

	it('builds shelf view with use-soon names and empty state', () => {
		const populated = buildPantryShelfView(
			[
				item({ id: '1', name: 'Spinach', location: 'fridge', expiresOn: '2026-06-20' }),
				item({ id: '2', name: 'Salmon', location: 'freezer', expiresOn: '2026-06-21' }),
				item({ id: '3', name: 'Rice', location: 'cupboard' })
			],
			today
		);

		expect(populated.isEmpty).toBe(false);
		expect(populated.useSoon).toHaveLength(2);
		expect(populated.useSoonNames).toEqual(['Spinach', 'Salmon']);
		expect(populated.zones.map((zone) => zone.location)).toEqual(['fridge', 'freezer', 'cupboard']);

		const empty = buildPantryShelfView([], today);
		expect(empty.isEmpty).toBe(true);
		expect(empty.totalActiveCount).toBe(0);
	});
});
