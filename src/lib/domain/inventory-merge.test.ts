import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	findMergeCandidate,
	inventoryItemsMatch,
	mergeTokenJaccardScore,
	MERGE_FUZZY_JACCARD_THRESHOLD
} from '$lib/domain/inventory-merge';

function item(
	overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name' | 'location'>
): InventoryItem {
	return {
		householdId: 'hh-1',
		userId: 'user-1',
		quantity: '1',
		unit: null,
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: new Date('2026-06-01T12:00:00Z'),
		createdAt: new Date('2026-06-01T12:00:00Z'),
		updatedAt: new Date('2026-06-01T12:00:00Z'),
		...overrides
	};
}

describe('mergeTokenJaccardScore', () => {
	it('scores identical normalized names as 1', () => {
		expect(mergeTokenJaccardScore('ICA Mjölk 1L', 'Arla Mjölk')).toBe(1);
	});

	it('scores overlapping tokens above threshold', () => {
		const score = mergeTokenJaccardScore('Filmjölk naturell 1l', 'Naturell filmjölk');
		expect(score).toBeGreaterThanOrEqual(MERGE_FUZZY_JACCARD_THRESHOLD);
	});
});

describe('findMergeCandidate', () => {
	const inventory = [
		item({
			id: 'inv-1',
			name: 'Mjölk 3%',
			location: 'fridge',
			updatedAt: new Date('2026-06-02T12:00:00Z')
		}),
		item({
			id: 'inv-2',
			name: 'Basmatiris',
			location: 'cupboard',
			updatedAt: new Date('2026-06-01T12:00:00Z')
		})
	];

	it('matches exact normalized names', () => {
		expect(findMergeCandidate(inventory, 'Arla Mjölk 3%', 'fridge')?.id).toBe('inv-1');
	});

	it('matches fuzzy names when tokens overlap', () => {
		const fuzzyInventory = [
			item({
				id: 'inv-filmjolk',
				name: 'Naturell filmjölk',
				location: 'fridge'
			})
		];
		expect(findMergeCandidate(fuzzyInventory, 'Filmjölk naturell 1l', 'fridge')?.id).toBe(
			'inv-filmjolk'
		);
	});

	it('respects storage location', () => {
		expect(findMergeCandidate(inventory, 'Mjölk', 'cupboard')).toBeNull();
	});

	it('ignores finished items', () => {
		const finished = [
			item({ id: 'inv-done', name: 'Mjölk', location: 'fridge', quantity: '0' })
		];
		expect(findMergeCandidate(finished, 'Mjölk', 'fridge')).toBeNull();
	});
});

describe('inventoryItemsMatch', () => {
	it('treats brand-prefixed receipt names as the same product', () => {
		expect(
			inventoryItemsMatch(
				{ name: 'ICA Falukorv', location: 'fridge' },
				{ name: 'Falukorv', location: 'fridge' }
			)
		).toBe(true);
	});
});
