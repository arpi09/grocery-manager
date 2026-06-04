import type { InventoryItem } from '$lib/domain/inventory-item';
import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import { daysUntilExpiry, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';

export type InventoryExpiryFilter = 'all' | 'expiring' | 'dated';
export type InventorySortKey = 'name' | 'expiry' | 'quantity';

export function matchesInventoryExpiryFilter(
	item: InventoryItem,
	filter: InventoryExpiryFilter
): boolean {
	if (filter === 'all') {
		return true;
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

export function compareInventoryItems(a: InventoryItem, b: InventoryItem, sort: InventorySortKey): number {
	if (sort === 'name') {
		return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
	}

	if (sort === 'quantity') {
		const byQty = compareQuantity(a, b);
		if (byQty !== 0) {
			return byQty;
		}
		return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
	}

	const aExpiry = a.expiresOn ?? '9999-12-31';
	const bExpiry = b.expiresOn ?? '9999-12-31';
	if (aExpiry !== bExpiry) {
		return aExpiry.localeCompare(bExpiry);
	}
	return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

export function filterAndSortInventoryItems(
	items: InventoryItem[],
	query: string,
	expiryFilter: InventoryExpiryFilter,
	sort: InventorySortKey
): InventoryItem[] {
	const normalized = query.trim().toLowerCase();
	return items
		.filter((item) => {
			if (normalized && !item.name.toLowerCase().includes(normalized)) {
				return false;
			}
			return matchesInventoryExpiryFilter(item, expiryFilter);
		})
		.sort((a, b) => compareInventoryItems(a, b, sort));
}
