import type { InventoryItem } from '$lib/domain/inventory-item';
import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import { daysUntilExpiry, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';

export type InventoryExpiryFilter = 'all' | 'expiring' | 'dated' | 'noExpiry';
export type InventorySortKey = 'name' | 'expiry' | 'quantity';
export type InventorySortDirection = 'asc' | 'desc';

export const DEFAULT_INVENTORY_SORT: InventorySortKey = 'name';
export const DEFAULT_INVENTORY_SORT_DIRECTION: InventorySortDirection = 'asc';
export const INVENTORY_EXPIRY_FILTER_PARAM = 'filter';
const INVENTORY_EXPIRY_FILTERS = new Set<InventoryExpiryFilter>(['all', 'expiring', 'dated', 'noExpiry']);
const INVENTORY_SORT_KEYS = new Set<InventorySortKey>(['name', 'expiry', 'quantity']);

export function parseInventorySortKey(value: string | null): InventorySortKey {
	if (value && INVENTORY_SORT_KEYS.has(value as InventorySortKey)) {
		return value as InventorySortKey;
	}
	return DEFAULT_INVENTORY_SORT;
}

export function parseInventoryExpiryFilter(value: string | null): InventoryExpiryFilter {
	if (value && INVENTORY_EXPIRY_FILTERS.has(value as InventoryExpiryFilter)) return value as InventoryExpiryFilter;
	return 'all';
}
export function buildInventoryListUrl(pathname: string, filter: InventoryExpiryFilter, searchParams?: URLSearchParams): string {
	const url = new URL(pathname, 'http://local');
	if (searchParams) for (const [key, value] of searchParams) if (key !== INVENTORY_EXPIRY_FILTER_PARAM) url.searchParams.append(key, value);
	const param = filter === 'all' ? null : filter;
	if (param) url.searchParams.set(INVENTORY_EXPIRY_FILTER_PARAM, param); else url.searchParams.delete(INVENTORY_EXPIRY_FILTER_PARAM);
	return `${url.pathname}${url.search}`;
}

export function matchesInventoryExpiryFilter(
	item: InventoryItem,
	filter: InventoryExpiryFilter
): boolean {
	if (filter === 'all') {
		return true;
	}
	if (filter === 'noExpiry') {
		return !item.expiresOn;
	}
	if (!item.expiresOn) {
		return false;
	}
	if (filter === 'dated') {
		return true;
	}
	const days = daysUntilExpiry(item.expiresOn);
	return days >= 0 && days <= EXPIRING_SOON_DAYS;
}

function compareQuantity(a: InventoryItem, b: InventoryItem): number {
	const aNum = parseNumericQuantity(a.quantity);
	const bNum = parseNumericQuantity(b.quantity);
	if (aNum !== null && bNum !== null && aNum !== bNum) {
		return aNum - bNum;
	}
	return a.quantity.localeCompare(b.quantity, undefined, { numeric: true, sensitivity: 'base' });
}

export function compareInventoryItems(
	a: InventoryItem,
	b: InventoryItem,
	sort: InventorySortKey,
	direction: InventorySortDirection = DEFAULT_INVENTORY_SORT_DIRECTION
): number {
	let cmp = 0;

	if (sort === 'name') {
		cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
	} else if (sort === 'quantity') {
		cmp = compareQuantity(a, b);
		if (cmp === 0) {
			cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		}
	} else {
		const aExpiry = a.expiresOn ?? '9999-12-31';
		const bExpiry = b.expiresOn ?? '9999-12-31';
		cmp = aExpiry.localeCompare(bExpiry);
		if (cmp === 0) {
			cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		}
	}

	return direction === 'asc' ? cmp : -cmp;
}

export function matchesInventorySearch(item: InventoryItem, q: string): boolean {
	const normalized = q.trim().toLowerCase();
	if (!normalized) {
		return true;
	}
	return item.name.toLowerCase().includes(normalized);
}

export const pantryLocationGridAdapters = {
	matchesFacet: matchesInventoryExpiryFilter,
	matchesSearch: matchesInventorySearch,
	compare: compareInventoryItems
};

export function filterAndSortInventoryItems(
	items: InventoryItem[],
	query: string,
	expiryFilter: InventoryExpiryFilter,
	sort: InventorySortKey,
	direction: InventorySortDirection = DEFAULT_INVENTORY_SORT_DIRECTION
): InventoryItem[] {
	const normalized = query.trim().toLowerCase();
	return items
		.filter((item) => {
			if (normalized && !item.name.toLowerCase().includes(normalized)) {
				return false;
			}
			return matchesInventoryExpiryFilter(item, expiryFilter);
		})
		.sort((a, b) => compareInventoryItems(a, b, sort, direction));
}
