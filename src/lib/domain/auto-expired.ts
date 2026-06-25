import type { InventoryItem } from '$lib/domain/inventory-item';
import type { StorageLocation } from '$lib/domain/location';
import { daysUntilExpiry } from '$lib/domain/expiry';

export const AUTO_EXPIRED_GRACE_DAY_OPTIONS = [3, 7, 14] as const;
export const MOVING_TO_AUTO_EXPIRED_SOON_MIN_DAYS = 2;
export const MOVING_TO_AUTO_EXPIRED_SOON_MAX_DAYS = 3;
export type AutoExpiredGraceDays = (typeof AUTO_EXPIRED_GRACE_DAY_OPTIONS)[number];
export const DEFAULT_AUTO_EXPIRED_GRACE_DAYS: AutoExpiredGraceDays = 7;
export type ExpiresOnSource =
	| 'user_set'
	| 'receipt_printed'
	| 'ai_inferred'
	| 'default_heuristic'
	| 'household_learned'
	| 'heuristic';

const SOURCE_GRACE_FACTOR: Record<ExpiresOnSource, number> = {
	user_set: 1,
	receipt_printed: 1,
	household_learned: 1,
	heuristic: 0.75,
	ai_inferred: 0.65,
	default_heuristic: 0.5
};

const LOCATION_GRACE_FACTOR: Record<StorageLocation, number> = {
	fridge: 1,
	freezer: 1.15,
	cupboard: 1.05
};

export function normalizeAutoExpiredGraceDays(value: number): AutoExpiredGraceDays {
	return AUTO_EXPIRED_GRACE_DAY_OPTIONS.includes(value as AutoExpiredGraceDays)
		? (value as AutoExpiredGraceDays)
		: DEFAULT_AUTO_EXPIRED_GRACE_DAYS;
}

/** Scales household grace by expiry source and storage location — no brand tables. */
export function resolveEffectiveAutoExpiredGraceDays(
	baseGraceDays: AutoExpiredGraceDays,
	item: Pick<InventoryItem, 'expiresOnSource' | 'location'>
): number {
	const source = item.expiresOnSource ?? 'default_heuristic';
	const sourceFactor = SOURCE_GRACE_FACTOR[source] ?? 0.75;
	const locationFactor = LOCATION_GRACE_FACTOR[item.location] ?? 1;
	const scaled = Math.round(baseGraceDays * sourceFactor * locationFactor);
	return Math.max(3, Math.min(baseGraceDays, scaled));
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

type AutoExpiredItem = Pick<
	InventoryItem,
	'expiresOn' | 'quantity' | 'expiresOnSource' | 'location'
>;

function effectiveGraceForItem(item: AutoExpiredItem, graceDays: number): number {
	return resolveEffectiveAutoExpiredGraceDays(normalizeAutoExpiredGraceDays(graceDays), item);
}

/** Days until an active item is moved to the auto-expired section (0 = moves today). */
export function daysUntilAutoExpiredMove(
	expiresOn: string,
	graceDays: number,
	today = new Date(),
	item?: Pick<InventoryItem, 'expiresOnSource' | 'location'>
): number {
	const effectiveGrace = item
		? effectiveGraceForItem({ expiresOn, quantity: '1', ...item }, graceDays)
		: graceDays;
	const moveOn = addDaysIso(expiresOn, effectiveGrace);
	return daysUntilExpiry(moveOn, today);
}

export function isMovingToAutoExpiredSoon(
	item: AutoExpiredItem,
	graceDays: number,
	today = new Date()
): boolean {
	if (!item.expiresOn || isAutoExpired(item, graceDays, today)) return false;
	const quantity = Number(item.quantity);
	if (Number.isNaN(quantity) || quantity <= 0) return false;
	const days = daysUntilAutoExpiredMove(item.expiresOn, graceDays, today, item);
	return (
		days >= MOVING_TO_AUTO_EXPIRED_SOON_MIN_DAYS &&
		days <= MOVING_TO_AUTO_EXPIRED_SOON_MAX_DAYS
	);
}

export function isAutoExpired(
	item: AutoExpiredItem,
	graceDays: number,
	today = new Date()
): boolean {
	const quantity = Number(item.quantity);
	if (Number.isNaN(quantity) || quantity <= 0 || !item.expiresOn) return false;
	const effectiveGrace = effectiveGraceForItem(item, graceDays);
	return item.expiresOn <= autoExpiredCutoffDate(effectiveGrace, today);
}

/** Whether auto-finish cron may zero quantity — stricter for uncertain BBF sources. */
export function canAutoFinishExpiredItem(
	item: AutoExpiredItem,
	householdGraceDays: number,
	extraDays: number,
	today = new Date()
): boolean {
	if (!item.expiresOn) return false;
	if (item.expiresOnSource === 'default_heuristic') return false;

	const effectiveGrace = effectiveGraceForItem(item, householdGraceDays);
	const autoFinishExtra =
		item.expiresOnSource === 'ai_inferred' ? Math.max(extraDays, 7) : extraDays;
	const finishBefore = subtractDaysIso(
		today.toISOString().slice(0, 10),
		effectiveGrace + autoFinishExtra
	);
	return item.expiresOn < finishBefore;
}
