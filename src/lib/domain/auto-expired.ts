import type { InventoryItem } from '$lib/domain/inventory-item';
import { daysUntilExpiry } from '$lib/domain/expiry';

export const AUTO_EXPIRED_GRACE_DAY_OPTIONS = [3, 7, 14] as const;
export const MOVING_TO_AUTO_EXPIRED_SOON_MIN_DAYS = 2;
export const MOVING_TO_AUTO_EXPIRED_SOON_MAX_DAYS = 3;
export type AutoExpiredGraceDays = (typeof AUTO_EXPIRED_GRACE_DAY_OPTIONS)[number];
export const DEFAULT_AUTO_EXPIRED_GRACE_DAYS: AutoExpiredGraceDays = 7;
export type ExpiresOnSource =
	| 'user_set'
	| 'ai_inferred'
	| 'default_heuristic'
	| 'household_learned'
	| 'heuristic';

export function normalizeAutoExpiredGraceDays(value: number): AutoExpiredGraceDays {
	return AUTO_EXPIRED_GRACE_DAY_OPTIONS.includes(value as AutoExpiredGraceDays)
		? (value as AutoExpiredGraceDays)
		: DEFAULT_AUTO_EXPIRED_GRACE_DAYS;
}

function formatIsoDateLocal(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function autoExpiredCutoffDate(graceDays: number, today = new Date()): string {
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	start.setDate(start.getDate() - graceDays);
	return formatIsoDateLocal(start);
}

export function subtractDaysIso(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() - days);
	return formatIsoDateLocal(date);
}

export function addDaysIso(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() + days);
	return formatIsoDateLocal(date);
}

/** Days until an active item is moved to the auto-expired section (0 = moves today). */
export function daysUntilAutoExpiredMove(
	expiresOn: string,
	graceDays: number,
	today = new Date()
): number {
	const moveOn = addDaysIso(expiresOn, graceDays);
	return daysUntilExpiry(moveOn, today);
}

export function isMovingToAutoExpiredSoon(
	item: Pick<InventoryItem, 'expiresOn' | 'quantity'>,
	graceDays: number,
	today = new Date()
): boolean {
	if (!item.expiresOn || isAutoExpired(item, graceDays, today)) return false;
	const quantity = Number(item.quantity);
	if (Number.isNaN(quantity) || quantity <= 0) return false;
	const days = daysUntilAutoExpiredMove(item.expiresOn, graceDays, today);
	return (
		days >= MOVING_TO_AUTO_EXPIRED_SOON_MIN_DAYS &&
		days <= MOVING_TO_AUTO_EXPIRED_SOON_MAX_DAYS
	);
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
