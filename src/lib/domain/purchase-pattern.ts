import type { StorageLocation } from './location';

/** Minimum distinct receipt imports containing the product. */
export const RECEIPT_PATTERN_MIN_IMPORTS = 2;

/** Minimum total line occurrences within the lookback window. */
export const RECEIPT_PATTERN_MIN_LINES = 3;

/** Days of receipt history to analyze. */
export const RECEIPT_PATTERN_WINDOW_DAYS = 90;

/** Max suggestions shown at once. */
export const RECEIPT_PATTERN_MAX_SUGGESTIONS = 5;

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

export interface RecordReceiptPurchaseLineInput {
	householdId: string;
	userId: string;
	importBatchId: string;
	productName: string;
	barcode?: string | null;
	location: StorageLocation;
	quantity?: string | null;
	unit?: string | null;
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
		if (line.createdAt < cutoff) continue;
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
				lastPurchasedAt: line.createdAt
			};
			aggregates.set(key, aggregate);
		}

		aggregate.importBatchIds.add(line.importBatchId);
		aggregate.lineCount += 1;
		if (line.createdAt >= aggregate.lastPurchasedAt) {
			aggregate.lastPurchasedAt = line.createdAt;
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
