import type { InventoryItem } from './inventory-item';

/** Items without expiry older than this are nudged (not auto-removed). */
export const STALENESS_THRESHOLD_DAYS = 75;

/** Max items shown per batch-review screen. */
export const STALENESS_BATCH_SIZE = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function stalenessCutoffDate(
	days: number = STALENESS_THRESHOLD_DAYS,
	referenceDate = new Date()
): Date {
	return new Date(referenceDate.getTime() - days * MS_PER_DAY);
}

export function daysSinceLastConfirmed(
	lastConfirmedAt: Date,
	referenceDate = new Date()
): number {
	const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
	const then = new Date(
		lastConfirmedAt.getFullYear(),
		lastConfirmedAt.getMonth(),
		lastConfirmedAt.getDate()
	);
	return Math.round((start.getTime() - then.getTime()) / MS_PER_DAY);
}

export function isStaleItem(
	item: Pick<InventoryItem, 'expiresOn' | 'lastConfirmedAt' | 'quantity'>,
	referenceDate = new Date(),
	thresholdDays: number = STALENESS_THRESHOLD_DAYS
): boolean {
	const quantity = Number(item.quantity);
	if (!Number.isNaN(quantity) && quantity <= 0) {
		return false;
	}
	if (item.expiresOn) {
		return false;
	}
	const confirmedAt = item.lastConfirmedAt;
	if (!confirmedAt) {
		return true;
	}
	return confirmedAt.getTime() < stalenessCutoffDate(thresholdDays, referenceDate).getTime();
}
