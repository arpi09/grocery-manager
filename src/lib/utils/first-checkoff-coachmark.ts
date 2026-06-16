import { browser } from '$app/environment';

const STORAGE_PREFIX = 'home-pantry-first-checkoff-coachmark:';

function storageKey(userId: string): string {
	return `${STORAGE_PREFIX}${userId}`;
}

/** Whether to show the one-shot pantry-bridge coachmark for this user. */
export function shouldShowFirstCheckoffCoachmark(userId: string | null): boolean {
	if (!browser || !userId) return false;
	return localStorage.getItem(storageKey(userId)) !== '1';
}

export function dismissFirstCheckoffCoachmark(userId: string | null): void {
	if (!browser || !userId) return;
	localStorage.setItem(storageKey(userId), '1');
}
