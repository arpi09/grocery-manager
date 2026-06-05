/** First-visit tooltips per app surface — persisted in localStorage per user. */

export type PageHintId = 'hem' | 'inventory' | 'inkop' | 'planer' | 'statistik';

export const PAGE_HINT_IDS = ['hem', 'inventory', 'inkop', 'planer', 'statistik'] as const satisfies readonly PageHintId[];

const STORAGE_PREFIX = 'home-pantry-page-hint-dismissed';
const SESSION_PREFIX = 'home-pantry-page-hint-session';

function storageKey(hintId: PageHintId, userId: string): string {
	return `${STORAGE_PREFIX}:${hintId}:${userId}`;
}

function sessionKey(hintId: PageHintId, userId: string): string {
	return `${SESSION_PREFIX}:${hintId}:${userId}`;
}

export function resolvePageHintId(pathname: string): PageHintId | null {
	if (pathname === '/hem') return 'hem';
	if (pathname === '/inkop') return 'inkop';
	if (pathname === '/planer') return 'planer';
	if (pathname === '/statistik') return 'statistik';
	if (pathname.startsWith('/inventory/')) return 'inventory';
	return null;
}

export function wasPageHintShownInSession(hintId: PageHintId, userId?: string | null): boolean {
	if (typeof sessionStorage === 'undefined' || !userId) return false;
	return sessionStorage.getItem(sessionKey(hintId, userId)) === '1';
}

export function markPageHintShownInSession(hintId: PageHintId, userId?: string | null): void {
	if (typeof sessionStorage === 'undefined' || !userId) return;
	sessionStorage.setItem(sessionKey(hintId, userId), '1');
}

export function shouldShowPageHint(hintId: PageHintId, userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) return false;
	if (localStorage.getItem(storageKey(hintId, userId)) === '1') return false;
	if (wasPageHintShownInSession(hintId, userId)) return false;
	return true;
}

export function dismissPageHint(hintId: PageHintId, userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) return;
	localStorage.setItem(storageKey(hintId, userId), '1');
	markPageHintShownInSession(hintId, userId);
}

export function resetPageHints(userId?: string | null): void {
	if (!userId) return;
	if (typeof localStorage !== 'undefined') {
		for (const hintId of PAGE_HINT_IDS) {
			localStorage.removeItem(storageKey(hintId, userId));
		}
	}
	if (typeof sessionStorage !== 'undefined') {
		for (const hintId of PAGE_HINT_IDS) {
			sessionStorage.removeItem(sessionKey(hintId, userId));
		}
	}
}
