import type { StorageLocation } from './location';

/** Minimum distinct receipt imports containing the product. */
export const RECEIPT_PATTERN_MIN_IMPORTS = 2;

/** Minimum total line occurrences within the lookback window. */
export const RECEIPT_PATTERN_MIN_LINES = 3;

/** Days of receipt history to analyze. */
export const RECEIPT_PATTERN_WINDOW_DAYS = 90;

/** Max suggestions shown at once. */
export const RECEIPT_PATTERN_MAX_SUGGESTIONS = 5;

/** Days of recent purchases to check for still-in-stock conflicts. */
export const RECEIPT_FINISH_LOOKBACK_DAYS = 14;

/** Max "mark as finished?" suggestions. */
export const RECEIPT_FINISH_MAX_SUGGESTIONS = 5;

export const RECEIPT_FINISH_DISMISS_PREFIX = 'finish:';

export interface ReceiptPurchaseLineRecord {
	id: string;
	householdId: string;
	userId: string;
	importBatchId: string;
	productName: string;
	normalizedKey: string;
	barcode: string | null;
	location: StorageLocation;
	quantity: string | null;
	unit: string | null;
	unitPrice: string | null;
	currency: string | null;
	lineTotal: string | null;
	storeLabel: string | null;
	purchasedAt: Date | null;
	createdAt: Date;
}

export interface ReceiptPatternSuggestion {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	importCount: number;
	lineCount: number;
	lastPurchasedAt: Date;
}

export interface PantryInventoryMatch {
	id: string;
	name: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	normalizedKey: string;
}

export interface ReceiptFinishSuggestion {
	inventoryItemId: string;
	displayName: string;
	normalizedKey: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	purchasedName: string;
	purchasedAt: Date;
}

export function receiptFinishDismissKey(inventoryItemId: string): string {
	return `${RECEIPT_FINISH_DISMISS_PREFIX}${inventoryItemId}`;
}

export interface RecordReceiptPurchaseLineInput {
	householdId: string;
	userId: string;
	importBatchId: string;
	productName: string;
	barcode?: string | null;
	location: StorageLocation;
	quantity?: string | null;
	unit?: string | null;
	unitPrice?: string | null;
	currency?: string | null;
	lineTotal?: string | null;
	storeLabel?: string | null;
	purchasedAt?: Date | null;
}

/** Normalize receipt product names for recurring-purchase matching. */
export function normalizeReceiptProductName(name: string): string {
	let normalized = name.trim().toLowerCase();
	normalized = normalized.replace(/[^\p{L}\p{N}\s]/gu, ' ');
	normalized = normalized.replace(/\s+/g, ' ').trim();
	// Strip trailing pack-size tokens common on Swedish receipts.
	normalized = normalized.replace(/\b\d+([,.]\d+)?\s*(g|kg|ml|l|cl|dl|st|pack|pkt)\b$/u, '').trim();
	return normalized;
}

interface PatternAggregate {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	importBatchIds: Set<string>;
	lineCount: number;
	lastPurchasedAt: Date;
}

function purchaseDate(line: ReceiptPurchaseLineRecord): Date {
	return line.purchasedAt ?? line.createdAt;
}

/** Derive refill suggestions from stored receipt lines (pure/heuristic). */
export function detectReceiptPatternSuggestions(
	lines: ReceiptPurchaseLineRecord[],
	inventoryNormalizedKeys: Set<string>,
	dismissedKeys: Set<string>,
	now: Date = new Date()
): ReceiptPatternSuggestion[] {
	const cutoff = new Date(now);
	cutoff.setDate(cutoff.getDate() - RECEIPT_PATTERN_WINDOW_DAYS);

	const aggregates = new Map<string, PatternAggregate>();

	for (const line of lines) {
		const purchased = purchaseDate(line);
		if (purchased < cutoff) continue;
		const key = line.normalizedKey;
		if (!key || dismissedKeys.has(key) || inventoryNormalizedKeys.has(key)) continue;

		let aggregate = aggregates.get(key);
		if (!aggregate) {
			aggregate = {
				normalizedKey: key,
				displayName: line.productName.trim(),
				location: line.location,
				quantity: line.quantity ?? '1',
				unit: line.unit,
				importBatchIds: new Set(),
				lineCount: 0,
				lastPurchasedAt: purchased
			};
			aggregates.set(key, aggregate);
		}

		aggregate.importBatchIds.add(line.importBatchId);
		aggregate.lineCount += 1;
		if (purchased >= aggregate.lastPurchasedAt) {
			aggregate.lastPurchasedAt = purchased;
			aggregate.displayName = line.productName.trim();
			aggregate.location = line.location;
			aggregate.quantity = line.quantity ?? aggregate.quantity;
			aggregate.unit = line.unit ?? aggregate.unit;
		}
	}

	const suggestions: ReceiptPatternSuggestion[] = [];

	for (const aggregate of aggregates.values()) {
		const importCount = aggregate.importBatchIds.size;
		if (
			importCount < RECEIPT_PATTERN_MIN_IMPORTS &&
			aggregate.lineCount < RECEIPT_PATTERN_MIN_LINES
		) {
			continue;
		}

		suggestions.push({
			normalizedKey: aggregate.normalizedKey,
			displayName: aggregate.displayName,
			location: aggregate.location,
			quantity: aggregate.quantity,
			unit: aggregate.unit,
			importCount,
			lineCount: aggregate.lineCount,
			lastPurchasedAt: aggregate.lastPurchasedAt
		});
	}

	return suggestions
		.sort((a, b) => {
			if (b.importCount !== a.importCount) return b.importCount - a.importCount;
			return b.lastPurchasedAt.getTime() - a.lastPurchasedAt.getTime();
		})
		.slice(0, RECEIPT_PATTERN_MAX_SUGGESTIONS);
}

/** Bought again while still in pantry — suggest marking old stock finished. */
export function detectReceiptFinishSuggestions(
	lines: ReceiptPurchaseLineRecord[],
	inventoryItems: PantryInventoryMatch[],
	dismissedKeys: Set<string>,
	now: Date = new Date()
): ReceiptFinishSuggestion[] {
	const cutoff = new Date(now);
	cutoff.setDate(cutoff.getDate() - RECEIPT_FINISH_LOOKBACK_DAYS);

	const inventoryByKey = new Map<string, PantryInventoryMatch[]>();
	for (const item of inventoryItems) {
		const quantity = Number(item.quantity);
		if (!Number.isNaN(quantity) && quantity <= 0) continue;
		const key = item.normalizedKey;
		if (!key) continue;
		const bucket = inventoryByKey.get(key) ?? [];
		bucket.push(item);
		inventoryByKey.set(key, bucket);
	}

	const bestByItemId = new Map<string, ReceiptFinishSuggestion>();

	for (const line of lines) {
		if (line.createdAt < cutoff) continue;
		const key = line.normalizedKey;
		if (!key) continue;

		const matches = inventoryByKey.get(key);
		if (!matches?.length) continue;

		for (const match of matches) {
			const dismissKey = receiptFinishDismissKey(match.id);
			if (dismissedKeys.has(dismissKey)) continue;

			const existing = bestByItemId.get(match.id);
			if (existing && existing.purchasedAt >= line.createdAt) continue;

			bestByItemId.set(match.id, {
				inventoryItemId: match.id,
				displayName: match.name,
				normalizedKey: key,
				location: match.location,
				quantity: match.quantity,
				unit: match.unit,
				purchasedName: line.productName.trim(),
				purchasedAt: line.createdAt
			});
		}
	}

	return [...bestByItemId.values()]
		.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
		.slice(0, RECEIPT_FINISH_MAX_SUGGESTIONS);
}
