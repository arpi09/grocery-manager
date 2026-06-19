import type { DataGridSortDirection } from '$lib/domain/data-grid-state';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import { formatShoppingListExportLine } from '$lib/utils/shopping-list-export';

export type ShoppingListFacetFilter = 'unchecked' | 'checked' | 'all';
export type ShoppingListSortKey = 'name' | 'added';

export const DEFAULT_SHOPPING_LIST_FACET: ShoppingListFacetFilter = 'unchecked';
export const DEFAULT_SHOPPING_LIST_SORT: ShoppingListSortKey = 'name';

const SHOPPING_LIST_FACETS = new Set<ShoppingListFacetFilter>(['unchecked', 'checked', 'all']);
const SHOPPING_LIST_SORT_KEYS = new Set<ShoppingListSortKey>(['name', 'added']);

export function parseShoppingListFacetFilter(value: string | null): ShoppingListFacetFilter {
	if (value && SHOPPING_LIST_FACETS.has(value as ShoppingListFacetFilter)) {
		return value as ShoppingListFacetFilter;
	}
	return DEFAULT_SHOPPING_LIST_FACET;
}

export function parseShoppingListSortKey(value: string | null): ShoppingListSortKey {
	if (value && SHOPPING_LIST_SORT_KEYS.has(value as ShoppingListSortKey)) {
		return value as ShoppingListSortKey;
	}
	return DEFAULT_SHOPPING_LIST_SORT;
}

export function matchesShoppingListFacet(
	item: ShoppingListItem,
	filter: ShoppingListFacetFilter
): boolean {
	if (filter === 'all') {
		return true;
	}
	if (filter === 'checked') {
		return item.checked;
	}
	return !item.checked;
}

export function matchesShoppingListSearch(item: ShoppingListItem, q: string): boolean {
	const normalized = q.trim().toLowerCase();
	if (!normalized) {
		return true;
	}
	return formatShoppingListExportLine(item).toLowerCase().includes(normalized);
}

export function compareShoppingListItems(
	a: ShoppingListItem,
	b: ShoppingListItem,
	sort: ShoppingListSortKey,
	dir: DataGridSortDirection
): number {
	let cmp = 0;

	if (sort === 'name') {
		cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
	} else {
		cmp = a.createdAt.getTime() - b.createdAt.getTime();
		if (cmp === 0) {
			cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		}
	}

	return dir === 'asc' ? cmp : -cmp;
}

export const shoppingListGridAdapters = {
	matchesFacet: matchesShoppingListFacet,
	matchesSearch: matchesShoppingListSearch,
	compare: compareShoppingListItems
};
