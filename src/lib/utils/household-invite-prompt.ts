const DISMISSED_SUFFIX = 'household-invite-dismissed';
const INKOP_DISMISSED_SUFFIX = 'household-invite-dismissed-inkop';
const INKOP_LAST_SHOWN_SUFFIX = 'household-invite-last-shown-inkop';
const PEAK_ITEMS_SUFFIX = 'peak-inventory-items';
const SHOPPING_EXPORT_SUFFIX = 'shopping-list-exported';
const INKOP_RATE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey(suffix: string, userId: string): string {
	return `home-pantry-${suffix}:${userId}`;
}

export function recordPeakInventoryCount(count: number, userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId || count <= 0) {
		return;
	}

	const key = storageKey(PEAK_ITEMS_SUFFIX, userId);
	const prev = Number(localStorage.getItem(key) ?? '0');
	if (count > prev) {
		localStorage.setItem(key, String(count));
	}
}

export function getPeakInventoryCount(userId?: string | null): number {
	if (typeof localStorage === 'undefined' || !userId) {
		return 0;
	}

	return Number(localStorage.getItem(storageKey(PEAK_ITEMS_SUFFIX, userId)) ?? '0');
}

export function dismissHouseholdInvitePrompt(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(DISMISSED_SUFFIX, userId), '1');
}

export function shouldShowHouseholdInvitePrompt(options: {
	userId?: string | null;
	memberCount: number;
	signupAt: number | null;
	now?: number;
}): boolean {
	const { userId, memberCount, signupAt, now = Date.now() } = options;

	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (localStorage.getItem(storageKey(DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	if (memberCount !== 1) {
		return false;
	}

	const peakItems = getPeakInventoryCount(userId);
	const dayMs = 24 * 60 * 60 * 1000;
	const daysSinceSignup =
		signupAt !== null ? Math.floor((now - signupAt) / dayMs) : 0;

	return peakItems >= 5 || daysSinceSignup >= 3;
}

export function recordShoppingListExport(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(SHOPPING_EXPORT_SUFFIX, userId), '1');
}

export function hasShoppingListExported(userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	return localStorage.getItem(storageKey(SHOPPING_EXPORT_SUFFIX, userId)) === '1';
}

export function hasShoppingListEngagement(
	userId: string | null | undefined,
	options: { uncheckedCount: number; checkedCount: number }
): boolean {
	if (!userId) {
		return false;
	}

	const totalItems = options.uncheckedCount + options.checkedCount;
	return hasShoppingListExported(userId) || totalItems >= 2 || options.checkedCount > 0;
}

export function dismissInkopHouseholdInvitePrompt(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(INKOP_DISMISSED_SUFFIX, userId), '1');
}

export function recordInkopHouseholdInviteShown(userId?: string | null, now = Date.now()): void {
	if (typeof localStorage === 'undefined' || !userId) {
		return;
	}

	localStorage.setItem(storageKey(INKOP_LAST_SHOWN_SUFFIX, userId), String(now));
}

function getInkopHouseholdInviteLastShown(userId: string): number | null {
	const raw = localStorage.getItem(storageKey(INKOP_LAST_SHOWN_SUFFIX, userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

export function shouldShowInkopHouseholdInvitePrompt(options: {
	userId?: string | null;
	memberCount: number;
	listHasItems: boolean;
	uncheckedCount: number;
	checkedCount: number;
	now?: number;
}): boolean {
	const { userId, memberCount, listHasItems, uncheckedCount, checkedCount, now = Date.now() } =
		options;

	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (localStorage.getItem(storageKey(INKOP_DISMISSED_SUFFIX, userId)) === '1') {
		return false;
	}

	if (memberCount !== 1) {
		return false;
	}

	if (!listHasItems) {
		return false;
	}

	if (!hasShoppingListEngagement(userId, { uncheckedCount, checkedCount })) {
		return false;
	}

	const lastShown = getInkopHouseholdInviteLastShown(userId);
	if (lastShown !== null && now - lastShown < INKOP_RATE_LIMIT_MS) {
		return false;
	}

	return true;
}
