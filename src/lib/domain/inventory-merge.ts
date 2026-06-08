import {
	formatNumericQuantity,
	parseNumericQuantity
} from '$lib/domain/consumption-quantity';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { isItemFinished } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

export function normalizeInventoryItemName(name: string): string {
	return normalizeReceiptProductName(name);
}

export function inventoryItemsMatch(
	a: { name: string; location: StorageLocation },
	b: { name: string; location: StorageLocation }
): boolean {
	return (
		a.location === b.location &&
		normalizeInventoryItemName(a.name) === normalizeInventoryItemName(b.name)
	);
}

export function findMergeCandidate(
	items: InventoryItem[],
	name: string,
	location: StorageLocation
): InventoryItem | null {
	const normalized = normalizeInventoryItemName(name);
	const matches = items.filter(
		(item) =>
			!isItemFinished(item) &&
			item.location === location &&
			normalizeInventoryItemName(item.name) === normalized
	);
	if (matches.length === 0) {
		return null;
	}
	return matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

export function findLastActiveByNormalizedName(
	items: InventoryItem[],
	name: string
): InventoryItem | null {
	const normalized = normalizeInventoryItemName(name);
	const matches = items.filter(
		(item) => !isItemFinished(item) && normalizeInventoryItemName(item.name) === normalized
	);
	if (matches.length === 0) {
		return null;
	}
	return matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

export interface DuplicateNameGroup {
	normalizedName: string;
	displayName: string;
	count: number;
	location: StorageLocation;
}

export function findDuplicateNameGroups(
	items: InventoryItem[],
	minCount = 3
): DuplicateNameGroup[] {
	const groups = new Map<string, { displayName: string; count: number; location: StorageLocation }>();

	for (const item of items) {
		if (isItemFinished(item)) {
			continue;
		}
		const normalized = normalizeInventoryItemName(item.name);
		const key = `${item.location}:${normalized}`;
		const existing = groups.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			groups.set(key, { displayName: item.name, count: 1, location: item.location });
		}
	}

	return [...groups.entries()]
		.filter(([, value]) => value.count >= minCount)
		.map(([key, value]) => ({
			normalizedName: key.split(':').slice(1).join(':'),
			displayName: value.displayName,
			count: value.count,
			location: value.location
		}))
		.sort((a, b) => b.count - a.count);
}

export function addQuantities(stock: string, add: string): string | null {
	const stockNum = parseNumericQuantity(stock);
	const addNum = parseNumericQuantity(add);
	if (stockNum === null || addNum === null) {
		return null;
	}
	return formatNumericQuantity(stockNum + addNum);
}
