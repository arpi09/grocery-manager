/**
 * First-visit auto-peek for the inventory row swipe-to-consume gesture.
 * Shown at most twice per user; once the user swipes themselves it never shows again.
 */

export const INVENTORY_SWIPE_HINT_STORAGE_PREFIX = 'home-pantry-inventory-swipe-hint-count';

export const INVENTORY_SWIPE_HINT_MAX_VIEWS = 2;

function storageKey(userId: string): string {
	return `${INVENTORY_SWIPE_HINT_STORAGE_PREFIX}:${userId}`;
}

function readCount(userId: string): number {
	const raw = localStorage.getItem(storageKey(userId));
	if (!raw) return 0;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function shouldShowInventorySwipeHint(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) return false;
	return readCount(userId) < INVENTORY_SWIPE_HINT_MAX_VIEWS;
}

export function recordInventorySwipeHintShown(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) return;
	localStorage.setItem(storageKey(userId), String(readCount(userId) + 1));
}

/** The user performed the gesture — no more peeks needed. */
export function markInventorySwipeDiscovered(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) return;
	localStorage.setItem(storageKey(userId), String(INVENTORY_SWIPE_HINT_MAX_VIEWS));
}
