import { describe, expect, it } from 'vitest';
import type { ShoppingListItem } from './shopping-list-item';
import {
	clampFocusIndex,
	getFocusItem,
	getPeekOverflowCount,
	getPeekQueue,
	getSummaryNamePills,
	getTripProgress,
	isTripComplete,
	limitMemorySuggestions,
	sortUncheckedItems
} from './shopping-trip';

function item(
	overrides: Partial<ShoppingListItem> & Pick<ShoppingListItem, 'id' | 'name' | 'sortOrder'>
): ShoppingListItem {
	return {
		householdId: 'hh1',
		quantity: null,
		unit: null,
		checked: false,
		createdAt: new Date('2026-01-01'),
		updatedAt: new Date('2026-01-01'),
		...overrides
	};
}

describe('shopping-trip', () => {
	it('sorts unchecked items by sortOrder', () => {
		const items = [
			item({ id: 'b', name: 'B', sortOrder: 2 }),
			item({ id: 'a', name: 'A', sortOrder: 1 }),
			item({ id: 'c', name: 'C', sortOrder: 3, checked: true })
		];
		expect(sortUncheckedItems(items).map((entry) => entry.id)).toEqual(['a', 'b']);
	});

	it('computes trip progress', () => {
		expect(getTripProgress(2, 5)).toEqual({
			picked: 2,
			total: 5,
			remaining: 3,
			percent: 40
		});
	});

	it('returns focus item and peek queue', () => {
		const items = [
			item({ id: '1', name: 'One', sortOrder: 1 }),
			item({ id: '2', name: 'Two', sortOrder: 2 }),
			item({ id: '3', name: 'Three', sortOrder: 3 }),
			item({ id: '4', name: 'Four', sortOrder: 4 }),
			item({ id: '5', name: 'Five', sortOrder: 5 })
		];

		expect(getFocusItem(items, 0)?.name).toBe('One');
		expect(getPeekQueue(items, 0).map((entry) => entry.name)).toEqual(['Two', 'Three', 'Four']);
		expect(getPeekOverflowCount(items, 0)).toBe(1);
	});

	it('limits memory suggestions to max 3', () => {
		expect(limitMemorySuggestions([1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
	});

	it('builds summary pills with overflow', () => {
		const items = [
			item({ id: '1', name: 'A', sortOrder: 1 }),
			item({ id: '2', name: 'B', sortOrder: 2 }),
			item({ id: '3', name: 'C', sortOrder: 3 }),
			item({ id: '4', name: 'D', sortOrder: 4 })
		];
		expect(getSummaryNamePills(items)).toEqual({ names: ['A', 'B', 'C'], overflow: 1 });
	});

	it('detects trip completion', () => {
		expect(isTripComplete(3, 3)).toBe(true);
		expect(isTripComplete(2, 3)).toBe(false);
	});

	it('clamps focus index to unchecked bounds', () => {
		expect(clampFocusIndex(5, 3)).toBe(2);
		expect(clampFocusIndex(-1, 3)).toBe(0);
	});
});
