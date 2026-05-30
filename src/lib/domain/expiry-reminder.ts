import type { InventoryItem } from '$lib/domain/inventory-item';
import { daysUntilExpiry } from '$lib/domain/expiry';

/** Allowed user-configured reminder windows (days before expiry). */
export const EXPIRY_REMINDER_DAY_OPTIONS = [3, 7] as const;
export type ExpiryReminderDays = (typeof EXPIRY_REMINDER_DAY_OPTIONS)[number];

export const DEFAULT_EXPIRY_REMINDER_DAYS: ExpiryReminderDays = 7;

/** Minimum days between weekly digest emails per user. */
export const EXPIRY_REMINDER_INTERVAL_DAYS = 7;

export function normalizeExpiryReminderDays(value: number): ExpiryReminderDays {
	return EXPIRY_REMINDER_DAY_OPTIONS.includes(value as ExpiryReminderDays)
		? (value as ExpiryReminderDays)
		: DEFAULT_EXPIRY_REMINDER_DAYS;
}

export function isWithinExpiryWindow(
	expiresOn: string,
	daysBefore: number,
	today = new Date()
): boolean {
	const daysLeft = daysUntilExpiry(expiresOn, today);
	return daysLeft >= 0 && daysLeft <= daysBefore;
}

/** Active inventory rows with an expiry date within the next `daysBefore` days (inclusive). */
export function filterItemsExpiringWithinDays(
	items: InventoryItem[],
	daysBefore: number,
	today = new Date()
): InventoryItem[] {
	return items
		.filter(
			(item): item is InventoryItem & { expiresOn: string } =>
				typeof item.expiresOn === 'string' &&
				item.expiresOn.length > 0 &&
				isWithinExpiryWindow(item.expiresOn, daysBefore, today)
		)
		.sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
}

export function shouldSendExpiryReminder(
	lastSentAt: Date | null | undefined,
	now = new Date(),
	intervalDays = EXPIRY_REMINDER_INTERVAL_DAYS
): boolean {
	if (!lastSentAt) {
		return true;
	}
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const last = new Date(lastSentAt.getFullYear(), lastSentAt.getMonth(), lastSentAt.getDate());
	const diffMs = start.getTime() - last.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
	return diffDays >= intervalDays;
}

export function expiryWindowEndDateIso(daysBefore: number, today = new Date()): string {
	const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	end.setDate(end.getDate() + daysBefore);
	return end.toISOString().slice(0, 10);
}
