import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import { isItemFinished, type InventoryItem } from '$lib/domain/inventory-item';
import { normalizeInventoryItemName } from '$lib/domain/inventory-merge';
import { isStaleItem } from '$lib/domain/inventory-staleness';
import type { StorageLocation } from '$lib/domain/location';

export type PantryHealthInsightKind = 'stale' | 'duplicate' | 'overstock';

export interface PantryHealthInsight {
	kind: PantryHealthInsightKind;
	id: string;
	count: number;
	displayName?: string;
	location?: StorageLocation;
	href: string;
}

export const MAX_PANTRY_HEALTH_INSIGHTS = 5;
export const OVERSTOCK_ROW_THRESHOLD = 3;
export const OVERSTOCK_QUANTITY_THRESHOLD = 10;
const DUPLICATE_MIN_COUNT = 2;

export function detectPantryHealthInsights(
	items: InventoryItem[],
	referenceDate = new Date()
): PantryHealthInsight[] {
	const active = items.filter((item) => !isItemFinished(item));
	const insights: PantryHealthInsight[] = [];

	const staleCount = active.filter((item) => isStaleItem(item, referenceDate)).length;
	if (staleCount > 0) {
		insights.push({
			kind: 'stale',
			id: 'stale',
			count: staleCount,
			href: '/inventory/synk'
		});
	}

	const duplicateGroups = groupDuplicates(active);
	for (const group of duplicateGroups) {
		insights.push({
			kind: 'duplicate',
			id: `duplicate:${group.normalizedName}`,
			count: group.count,
			displayName: group.displayName,
			location: group.location,
			href: '/inventory/merge'
		});
	}

	const overstockGroups = groupOverstock(active);
	for (const group of overstockGroups) {
		if (insights.some((entry) => entry.kind === 'duplicate' && entry.id === `duplicate:${group.normalizedName}`)) {
			continue;
		}
		insights.push({
			kind: 'overstock',
			id: `overstock:${group.normalizedName}`,
			count: group.count,
			displayName: group.displayName,
			location: group.location,
			href: group.location ? `/inventory/${group.location}` : '/inventory/fridge'
		});
	}

	return insights.slice(0, MAX_PANTRY_HEALTH_INSIGHTS);
}

interface NameGroup {
	normalizedName: string;
	displayName: string;
	count: number;
	location?: StorageLocation;
}

function groupDuplicates(items: InventoryItem[]): NameGroup[] {
	const groups = new Map<string, { displayName: string; count: number; location: StorageLocation }>();

	for (const item of items) {
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
		.filter(([, value]) => value.count >= DUPLICATE_MIN_COUNT)
		.map(([key, value]) => ({
			normalizedName: key.split(':').slice(1).join(':'),
			displayName: value.displayName,
			count: value.count,
			location: value.location
		}))
		.sort((a, b) => b.count - a.count);
}

function groupOverstock(items: InventoryItem[]): NameGroup[] {
	const groups = new Map<string, { displayName: string; count: number; location: StorageLocation }>();

	for (const item of items) {
		const normalized = normalizeInventoryItemName(item.name);
		const qty = parseNumericQuantity(item.quantity);
		const isHighQty = qty !== null && qty >= OVERSTOCK_QUANTITY_THRESHOLD;
		if (!isHighQty) {
			continue;
		}

		const key = normalized;
		const existing = groups.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			groups.set(key, { displayName: item.name, count: 1, location: item.location });
		}
	}

	const rowGroups = new Map<string, { displayName: string; count: number; location: StorageLocation }>();
	for (const item of items) {
		const normalized = normalizeInventoryItemName(item.name);
		const key = normalized;
		const existing = rowGroups.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			rowGroups.set(key, { displayName: item.name, count: 1, location: item.location });
		}
	}

	const results = new Map<string, NameGroup>();

	for (const [normalized, value] of rowGroups) {
		if (value.count >= OVERSTOCK_ROW_THRESHOLD) {
			results.set(normalized, {
				normalizedName: normalized,
				displayName: value.displayName,
				count: value.count,
				location: value.location
			});
		}
	}

	for (const [normalized, value] of groups) {
		if (!results.has(normalized)) {
			results.set(normalized, {
				normalizedName: normalized,
				displayName: value.displayName,
				count: value.count,
				location: value.location
			});
		}
	}

	return [...results.values()].sort((a, b) => b.count - a.count);
}
