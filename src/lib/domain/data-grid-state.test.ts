import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '$lib/domain/inventory-item';
import {
	applyFacet,
	applySearch,
	clampPage,
	computePageCount,
	computeRange,
	DEFAULT_DATA_GRID_PAGE_SIZE,
	paginateRows,
	parseDataGridPage,
	parseDataGridPageSize,
	parseDataGridSortDirection,
	runDataGridPipeline,
	sortRows
} from './data-grid-state';
import {
	compareInventoryItems,
	matchesInventoryExpiryFilter,
	type InventoryExpiryFilter,
	type InventorySortKey
} from '$lib/utils/inventory-list-filters';

function inventoryItem(
	overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>
): InventoryItem {
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

const inventoryAdapters = {
	matchesFacet: (item: InventoryItem, filter: InventoryExpiryFilter) =>
		matchesInventoryExpiryFilter(item, filter),
	matchesSearch: (item: InventoryItem, q: string) =>
		!q || item.name.toLowerCase().includes(q.toLowerCase()),
	compare: (a: InventoryItem, b: InventoryItem, sort: InventorySortKey, dir: 'asc' | 'desc') =>
		compareInventoryItems(a, b, sort, dir)
};

describe('parseDataGridSortDirection', () => {
	it('defaults to asc and accepts desc', () => {
		expect(parseDataGridSortDirection(null)).toBe('asc');
		expect(parseDataGridSortDirection('desc')).toBe('desc');
	});
});

describe('parseDataGridPage', () => {
	it('defaults invalid values to page 1', () => {
		expect(parseDataGridPage(null)).toBe(1);
		expect(parseDataGridPage('0')).toBe(1);
		expect(parseDataGridPage('3')).toBe(3);
	});
});

describe('parseDataGridPageSize', () => {
	it('accepts 5/10/25 and defaults otherwise', () => {
		expect(parseDataGridPageSize('5')).toBe(5);
		expect(parseDataGridPageSize('25')).toBe(25);
		expect(parseDataGridPageSize('99')).toBe(DEFAULT_DATA_GRID_PAGE_SIZE);
	});
});

describe('clampPage and computeRange', () => {
	it('clamps page within bounds', () => {
		expect(clampPage(0, 3)).toBe(1);
		expect(clampPage(9, 3)).toBe(3);
	});

	it('returns zero range for empty data', () => {
		expect(computeRange(0, 2, 10)).toEqual({
			rangeStart: 0,
			rangeEnd: 0,
			pageCount: 1,
			page: 1
		});
	});

	it('computes inclusive range for a page slice', () => {
		expect(computeRange(23, 2, 10)).toEqual({
			rangeStart: 11,
			rangeEnd: 20,
			pageCount: 3,
			page: 2
		});
	});
});

describe('paginateRows', () => {
	it('slices rows and reports footer range', () => {
		const rows = Array.from({ length: 12 }, (_, index) => `row-${index + 1}`);
		const result = paginateRows(rows, 2, 5);
		expect(result.pageRows).toEqual(['row-6', 'row-7', 'row-8', 'row-9', 'row-10']);
		expect(result.totalCount).toBe(12);
		expect(result.pageCount).toBe(computePageCount(12, 5));
		expect(result.rangeStart).toBe(6);
		expect(result.rangeEnd).toBe(10);
	});
});

describe('pipeline stages', () => {
	const rows = [
		inventoryItem({ id: '1', name: 'Banana' }),
		inventoryItem({ id: '2', name: 'Apple', expiresOn: '2099-01-01' }),
		inventoryItem({ id: '3', name: 'Zucchini' })
	];

	it('applyFacet filters inventory expiry facet', () => {
		expect(
			applyFacet(rows, 'noExpiry', inventoryAdapters.matchesFacet).map((item) => item.name)
		).toEqual(['Banana', 'Zucchini']);
	});

	it('applySearch filters by query', () => {
		expect(applySearch(rows, 'app', inventoryAdapters.matchesSearch).map((item) => item.name)).toEqual([
			'Apple'
		]);
	});

	it('sortRows respects direction', () => {
		const asc = sortRows(rows, 'name', 'asc', inventoryAdapters.compare).map((item) => item.name);
		const desc = sortRows(rows, 'name', 'desc', inventoryAdapters.compare).map((item) => item.name);
		expect(asc).toEqual(['Apple', 'Banana', 'Zucchini']);
		expect(desc).toEqual(['Zucchini', 'Banana', 'Apple']);
	});
});

describe('runDataGridPipeline', () => {
	it('runs rawRows → facet → search → sort → paginate', () => {
		const rows = [
			inventoryItem({ id: '1', name: 'Banana' }),
			inventoryItem({ id: '2', name: 'Apple', expiresOn: '2099-01-01' }),
			inventoryItem({ id: '3', name: 'Apricot' }),
			inventoryItem({ id: '4', name: 'Zucchini' })
		];

		const result = runDataGridPipeline(
			rows,
			{
				q: 'a',
				filter: 'all',
				sort: 'name',
				dir: 'asc',
				page: 1,
				pageSize: 5
			},
			inventoryAdapters
		);

		expect(result.allRows.map((item) => item.name)).toEqual(['Apple', 'Apricot', 'Banana']);
		expect(result.pageRows.map((item) => item.name)).toEqual(['Apple', 'Apricot', 'Banana']);
		expect(result.totalCount).toBe(3);
		expect(result.rangeStart).toBe(1);
		expect(result.rangeEnd).toBe(3);
	});
});
