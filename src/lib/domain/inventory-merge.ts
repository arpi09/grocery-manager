import {
	formatNumericQuantity,
	parseNumericQuantity
} from '$lib/domain/consumption-quantity';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { isItemFinished } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';
import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';

export const MERGE_FUZZY_JACCARD_THRESHOLD = 0.7;
export const MERGE_GRAY_ZONE_JACCARD_MIN = 0.5;

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

function tokenizeForMerge(name: string): Set<string> {
	const normalized = normalizeInventoryItemName(name);
	return new Set(
		normalized
			.split(' ')
			.map((token) => token.trim())
			.filter((token) => token.length > 1)
	);
}

export function mergeTokenJaccardScore(a: string, b: string): number {
	const left = tokenizeForMerge(a);
	const right = tokenizeForMerge(b);
	if (left.size === 0 && right.size === 0) {
		return normalizeInventoryItemName(a) === normalizeInventoryItemName(b) ? 1 : 0;
	}
	const intersection = [...left].filter((token) => right.has(token)).length;
	const union = new Set([...left, ...right]).size;
	return union === 0 ? 0 : intersection / union;
}

function pickLatestMatch(matches: InventoryItem[]): InventoryItem {
	return matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
}

export interface FindMergeCandidateOptions {
	/** Known purchase concept key when inventory rows lack explicit concept metadata. */
	conceptKey?: string | null;
}

export function findMergeCandidate(
	items: InventoryItem[],
	name: string,
	location: StorageLocation,
	options: FindMergeCandidateOptions = {}
): InventoryItem | null {
	return findMergeCandidateWithScore(items, name, location, options)?.item ?? null;
}

export function findMergeCandidateWithScore(
	items: InventoryItem[],
	name: string,
	location: StorageLocation,
	options: FindMergeCandidateOptions = {}
): { item: InventoryItem; score: number; grayZone: boolean } | null {
	const normalized = normalizeInventoryItemName(name);
	const activeInLocation = items.filter(
		(item) => !isItemFinished(item) && item.location === location
	);

	const exactMatches = activeInLocation.filter(
		(item) => normalizeInventoryItemName(item.name) === normalized
	);
	if (exactMatches.length > 0) {
		return { item: pickLatestMatch(exactMatches), score: 1, grayZone: false };
	}

	const conceptKey = options.conceptKey?.trim() || normalized;
	if (conceptKey) {
		const conceptMatches = activeInLocation.filter(
			(item) => normalizeInventoryItemName(item.name) === conceptKey
		);
		if (conceptMatches.length > 0) {
			return { item: pickLatestMatch(conceptMatches), score: 1, grayZone: false };
		}
	}

	let best: { item: InventoryItem; score: number } | null = null;
	for (const item of activeInLocation) {
		const score = mergeTokenJaccardScore(name, item.name);
		if (score < MERGE_GRAY_ZONE_JACCARD_MIN) continue;
		if (!best || score > best.score) {
			best = { item, score };
		}
	}

	if (!best) return null;
	return {
		item: best.item,
		score: best.score,
		grayZone: best.score < MERGE_FUZZY_JACCARD_THRESHOLD
	};
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
	return pickLatestMatch(matches);
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
