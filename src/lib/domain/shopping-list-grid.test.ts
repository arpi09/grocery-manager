import { describe, expect, it } from 'vitest';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import { runDataGridPipeline } from '$lib/domain/data-grid-state';
import {
	compareShoppingListItems,
	DEFAULT_SHOPPING_LIST_FACET,
	DEFAULT_SHOPPING_LIST_SORT,
	matchesShoppingListFacet,
	matchesShoppingListSearch,
	parseShoppingListFacetFilter,
	parseShoppingListSortKey,
	shoppingListGridAdapters
} from './shopping-list-grid';

function item(
	overrides: Partial<ShoppingListItem> & Pick<ShoppingListItem, 'id' | 'name'>
): ShoppingListItem {
	return {
		householdId: 'h1',
		quantity: null,
		unit: null,
		checked: false,
		sortOrder: 0,
		createdAt: new Date('2026-01-01T10:00:00Z'),
		updatedAt: new Date('2026-01-01T10:00:00Z'),
		...overrides
	};
}

describe('parseShoppingListFacetFilter', () => {
	it('parses known facets and defaults to unchecked', () => {
		expect(parseShoppingListFacetFilter('checked')).toBe('checked');
		expect(parseShoppingListFacetFilter('all')).toBe('all');
		expect(parseShoppingListFacetFilter(null)).toBe(DEFAULT_SHOPPING_LIST_FACET);
	});
});

describe('parseShoppingListSortKey', () => {
	it('parses known sort keys and defaults to name', () => {
		expect(parseShoppingListSortKey('added')).toBe('added');
		expect(parseShoppingListSortKey(null)).toBe(DEFAULT_SHOPPING_LIST_SORT);
	});
});

describe('matchesShoppingListFacet', () => {
	it('filters checked and unchecked rows', () => {
		const rows = [
			item({ id: '1', name: 'Mjölk', checked: false }),
			item({ id: '2', name: 'Bröd', checked: true })
		];
		expect(rows.filter((row) => matchesShoppingListFacet(row, 'unchecked')).map((row) => row.name)).toEqual([
			'Mjölk'
		]);
		expect(rows.filter((row) => matchesShoppingListFacet(row, 'checked')).map((row) => row.name)).toEqual([
			'Bröd'
		]);
	});
});

describe('matchesShoppingListSearch', () => {
	it('matches name and quantity line', () => {
		expect(matchesShoppingListSearch(item({ id: '1', name: 'Mjölk', quantity: '1', unit: 'L' }), '1 l')).toBe(
			true
		);
		expect(matchesShoppingListSearch(item({ id: '1', name: 'Mjölk' }), 'bröd')).toBe(false);
	});
});

describe('compareShoppingListItems', () => {
	it('sorts by added date with name tie-breaker', () => {
		const older = item({ id: '1', name: 'Banana', createdAt: new Date('2026-01-01T08:00:00Z') });
		const newer = item({ id: '2', name: 'Apple', createdAt: new Date('2026-01-02T08:00:00Z') });
		expect(compareShoppingListItems(older, newer, 'added', 'asc')).toBeLessThan(0);
		expect(compareShoppingListItems(newer, older, 'added', 'desc')).toBeLessThan(0);
	});
});

describe('runDataGridPipeline with shopping adapters', () => {
	it('paginates unchecked items sorted by name', () => {
		const rows = [
			item({ id: '1', name: 'Zucchini', checked: false }),
			item({ id: '2', name: 'Apple', checked: false }),
			item({ id: '3', name: 'Banana', checked: true }),
			item({ id: '4', name: 'Apricot', checked: false })
		];

		const result = runDataGridPipeline(
			rows,
			{
				q: '',
				filter: 'unchecked',
				sort: 'name',
				dir: 'asc',
				page: 1,
				pageSize: 5
			},
			shoppingListGridAdapters
		);

		expect(result.pageRows.map((row) => row.name)).toEqual(['Apple', 'Apricot', 'Zucchini']);
		expect(result.totalCount).toBe(3);
	});
});
