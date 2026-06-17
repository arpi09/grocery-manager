import type { StorageLocation } from './location';
import {
	RECEIPT_PATTERN_MIN_LINES,
	RECEIPT_PATTERN_WINDOW_DAYS,
	type ReceiptPurchaseLineRecord
} from './purchase-pattern';
import { REPLENISHMENT_MIN_CADENCE_EVENTS, computeAverageCadenceDays } from './replenishment';

export interface BuyAgainMemoryCandidate {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	lineCount: number;
	purchaseCount: number;
	avgIntervalDays: number | null;
}

function purchaseDate(line: ReceiptPurchaseLineRecord): Date {
	return line.purchasedAt ?? line.createdAt;
}

/** Habitual buy-again products for Memory Explorer (includes dismissed). */
export function detectBuyAgainMemoryCandidates(
	lines: ReceiptPurchaseLineRecord[],
	now: Date = new Date()
): BuyAgainMemoryCandidate[] {
	const cutoff = new Date(now);
	cutoff.setDate(cutoff.getDate() - RECEIPT_PATTERN_WINDOW_DAYS);

	const aggregates = new Map<
		string,
		{
			normalizedKey: string;
			displayName: string;
			location: StorageLocation;
			lineCount: number;
			purchaseDates: Date[];
		}
	>();

	for (const line of lines) {
		if (line.createdAt < cutoff) continue;
		const key = line.normalizedKey;
		if (!key) continue;

		const eventDate = purchaseDate(line);
		let aggregate = aggregates.get(key);
		if (!aggregate) {
			aggregate = {
				normalizedKey: key,
				displayName: line.productName.trim(),
				location: line.location,
				lineCount: 0,
				purchaseDates: []
			};
			aggregates.set(key, aggregate);
		}

		aggregate.lineCount += 1;
		aggregate.purchaseDates.push(eventDate);
		if (eventDate >= (aggregate.purchaseDates[0] ?? eventDate)) {
			aggregate.displayName = line.productName.trim();
			aggregate.location = line.location;
		}
	}

	const results: BuyAgainMemoryCandidate[] = [];
	for (const aggregate of aggregates.values()) {
		const purchaseCount = aggregate.purchaseDates.length;
		const avgIntervalDays = computeAverageCadenceDays(aggregate.purchaseDates);
		const habitual =
			aggregate.lineCount >= RECEIPT_PATTERN_MIN_LINES ||
			purchaseCount >= REPLENISHMENT_MIN_CADENCE_EVENTS;
		if (!habitual) continue;

		results.push({
			normalizedKey: aggregate.normalizedKey,
			displayName: aggregate.displayName,
			location: aggregate.location,
			lineCount: aggregate.lineCount,
			purchaseCount,
			avgIntervalDays
		});
	}

	return results.sort((a, b) => a.displayName.localeCompare(b.displayName, 'sv'));
}
