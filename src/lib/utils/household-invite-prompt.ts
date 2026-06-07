const DISMISSED_SUFFIX = 'household-invite-dismissed';
const PEAK_ITEMS_SUFFIX = 'peak-inventory-items';

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
