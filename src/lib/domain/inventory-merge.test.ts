import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { findDuplicateNameGroups } from '$lib/domain/inventory-merge';

function item(overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>): InventoryItem {
	return {
		householdId: 'h1',
		userId: 'u1',
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

describe('findDuplicateNameGroups', () => {
	it('returns groups with at least three normalized matches per location', () => {
		const groups = findDuplicateNameGroups([
			item({ id: '1', name: 'Mjölk' }),
			item({ id: '2', name: 'mjölk' }),
			item({ id: '3', name: 'MJÖLK' }),
			item({ id: '4', name: 'Ost' })
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.count).toBe(3);
		expect(groups[0]?.location).toBe('fridge');
	});
});
