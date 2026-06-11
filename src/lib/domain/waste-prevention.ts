import { isItemFinished, type InventoryItem } from '$lib/domain/inventory-item';
import { daysUntilExpiry, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';

export interface WasteAlert {
	expiringCount: number;
	slowMoverCount: number;
	href: string;
}

export const SLOW_MOVER_CONFIRMED_DAYS = 14;

export function detectWasteAlert(
	items: InventoryItem[],
	referenceDate = new Date()
): WasteAlert | null {
	const active = items.filter((item) => !isItemFinished(item));
	let expiringCount = 0;
	let slowMoverCount = 0;

	for (const item of active) {
		if (!item.expiresOn) {
			continue;
		}

		const daysLeft = daysUntilExpiry(item.expiresOn, referenceDate);
		if (daysLeft > EXPIRING_SOON_DAYS) {
			continue;
		}

		expiringCount += 1;

		const confirmedDaysAgo = daysSince(item.lastConfirmedAt, referenceDate);
		if (confirmedDaysAgo >= SLOW_MOVER_CONFIRMED_DAYS) {
			slowMoverCount += 1;
		}
	}

	if (expiringCount === 0) {
		return null;
	}

	return {
		expiringCount,
		slowMoverCount,
		href: '#eat-first'
	};
}

function daysSince(date: Date, referenceDate: Date): number {
	const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
	const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	return Math.round((start.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}
