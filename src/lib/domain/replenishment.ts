import type { StorageLocation } from './location';
import {
	RECEIPT_PATTERN_MAX_SUGGESTIONS,
	RECEIPT_PATTERN_MIN_IMPORTS,
	RECEIPT_PATTERN_MIN_LINES,
	RECEIPT_PATTERN_WINDOW_DAYS,
	type ReceiptPurchaseLineRecord
} from './purchase-pattern';

export type ReplenishmentReasonCode =
	| 'recurring_not_in_pantry'
	| 'cadence_overdue'
	| 'recurring_and_cadence';

export interface ReplenishmentSuggestion {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	importCount: number;
	lineCount: number;
	lastPurchasedAt: Date;
	reasonCode: ReplenishmentReasonCode;
	daysSinceLast: number;
	avgIntervalDays: number | null;
	purchaseCount: number;
}

export const REPLENISHMENT_MIN_CADENCE_EVENTS = 3;

function purchaseDate(line: ReceiptPurchaseLineRecord): Date {
	return line.purchasedAt ?? line.createdAt;
}

interface ProductAggregate {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	quantity: string;
	unit: string | null;
	importBatchIds: Set<string>;
	lineCount: number;
	lastPurchasedAt: Date;
	purchaseDates: Date[];
}

export function computeAverageCadenceDays(dates: Date[]): number | null {
	if (dates.length < REPLENISHMENT_MIN_CADENCE_EVENTS) return null;

	const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
	const gaps: number[] = [];
	for (let i = 1; i < sorted.length; i++) {
		gaps.push((sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / (24 * 60 * 60 * 1000));
	}

	return Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);
}

export function computeDaysSinceLast(dates: Date[], now: Date): number {
	if (dates.length === 0) return 0;
	const latest = dates.reduce((max, date) => (date > max ? date : max), dates[0]!);
	return Math.floor((now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000));
}

function reasonCodeFor(
	recurring: boolean,
	cadenceOverdue: boolean
): ReplenishmentReasonCode | null {
	if (recurring && cadenceOverdue) return 'recurring_and_cadence';
	if (recurring) return 'recurring_not_in_pantry';
	if (cadenceOverdue) return 'cadence_overdue';
	return null;
}

function reasonSortWeight(code: ReplenishmentReasonCode): number {
	switch (code) {
		case 'recurring_and_cadence':
			return 3;
		case 'recurring_not_in_pantry':
			return 2;
		case 'cadence_overdue':
			return 1;
	}
}

/** Evidence-based buy-again suggestions for the shopping list (no AI). */
export function detectReplenishmentSuggestions(
	lines: ReceiptPurchaseLineRecord[],
	inventoryNormalizedKeys: Set<string>,
	listNormalizedNames: Set<string>,
	dismissedKeys: Set<string>,
	now: Date = new Date()
): ReplenishmentSuggestion[] {
	const cutoff = new Date(now);
	cutoff.setDate(cutoff.getDate() - RECEIPT_PATTERN_WINDOW_DAYS);

	const aggregates = new Map<string, ProductAggregate>();

	for (const line of lines) {
		if (line.createdAt < cutoff) continue;
		const key = line.normalizedKey;
		if (!key || dismissedKeys.has(key) || inventoryNormalizedKeys.has(key) || listNormalizedNames.has(key)) {
			continue;
		}

		const eventDate = purchaseDate(line);
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
				lastPurchasedAt: eventDate,
				purchaseDates: []
			};
			aggregates.set(key, aggregate);
		}

		aggregate.importBatchIds.add(line.importBatchId);
		aggregate.lineCount += 1;
		aggregate.purchaseDates.push(eventDate);
		if (eventDate >= aggregate.lastPurchasedAt) {
			aggregate.lastPurchasedAt = eventDate;
			aggregate.displayName = line.productName.trim();
			aggregate.location = line.location;
			aggregate.quantity = line.quantity ?? aggregate.quantity;
			aggregate.unit = line.unit ?? aggregate.unit;
		}
	}

	const suggestions: ReplenishmentSuggestion[] = [];

	for (const aggregate of aggregates.values()) {
		const importCount = aggregate.importBatchIds.size;
		const recurring =
			importCount >= RECEIPT_PATTERN_MIN_IMPORTS || aggregate.lineCount >= RECEIPT_PATTERN_MIN_LINES;

		const avgIntervalDays = computeAverageCadenceDays(aggregate.purchaseDates);
		const daysSinceLast = computeDaysSinceLast(aggregate.purchaseDates, now);
		const cadenceOverdue =
			avgIntervalDays !== null && daysSinceLast >= avgIntervalDays;

		const reasonCode = reasonCodeFor(recurring, cadenceOverdue);
		if (!reasonCode) continue;

		suggestions.push({
			normalizedKey: aggregate.normalizedKey,
			displayName: aggregate.displayName,
			location: aggregate.location,
			quantity: aggregate.quantity,
			unit: aggregate.unit,
			importCount,
			lineCount: aggregate.lineCount,
			lastPurchasedAt: aggregate.lastPurchasedAt,
			reasonCode,
			daysSinceLast,
			avgIntervalDays,
			purchaseCount: aggregate.purchaseDates.length
		});
	}

	return suggestions
		.sort((a, b) => {
			const weightDiff = reasonSortWeight(b.reasonCode) - reasonSortWeight(a.reasonCode);
			if (weightDiff !== 0) return weightDiff;
			if (b.importCount !== a.importCount) return b.importCount - a.importCount;
			return b.daysSinceLast - a.daysSinceLast;
		})
		.slice(0, RECEIPT_PATTERN_MAX_SUGGESTIONS);
}
