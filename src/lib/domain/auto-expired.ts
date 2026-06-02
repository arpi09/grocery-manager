import type { InventoryItem } from '$lib/domain/inventory-item';

export const AUTO_EXPIRED_GRACE_DAY_OPTIONS = [3, 7, 14] as const;
export type AutoExpiredGraceDays = (typeof AUTO_EXPIRED_GRACE_DAY_OPTIONS)[number];
export const DEFAULT_AUTO_EXPIRED_GRACE_DAYS: AutoExpiredGraceDays = 7;
export type ExpiresOnSource = 'user_set' | 'ai_inferred';

export function normalizeAutoExpiredGraceDays(value: number): AutoExpiredGraceDays {
	return AUTO_EXPIRED_GRACE_DAY_OPTIONS.includes(value as AutoExpiredGraceDays)
		? (value as AutoExpiredGraceDays)
		: DEFAULT_AUTO_EXPIRED_GRACE_DAYS;
}

export function autoExpiredCutoffDate(graceDays: number, today = new Date()): string {
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	start.setDate(start.getDate() - graceDays);
	return start.toISOString().slice(0, 10);
}

export function subtractDaysIso(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() - days);
	return date.toISOString().slice(0, 10);
}

export function isAutoExpired(
	item: Pick<InventoryItem, 'expiresOn' | 'quantity'>,
	graceDays: number,
	today = new Date()
): boolean {
	const quantity = Number(item.quantity);
	if (Number.isNaN(quantity) || quantity <= 0 || !item.expiresOn) return false;
	return item.expiresOn <= autoExpiredCutoffDate(graceDays, today);
}
