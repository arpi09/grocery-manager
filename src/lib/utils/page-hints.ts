/** First-visit tooltips per app surface — persisted in localStorage per user. */

export type PageHintId = 'hem' | 'inventory' | 'inkop' | 'planer' | 'statistik';

export const PAGE_HINT_IDS = ['hem', 'inventory', 'inkop', 'planer', 'statistik'] as const satisfies readonly PageHintId[];

const STORAGE_PREFIX = 'home-pantry-page-hint-dismissed';

function storageKey(hintId: PageHintId, userId: string): string {
	return `${STORAGE_PREFIX}:${hintId}:${userId}`;
}

export function resolvePageHintId(pathname: string): PageHintId | null {
	if (pathname === '/hem') return 'hem';
	if (pathname === '/inkop') return 'inkop';
	if (pathname === '/planer') return 'planer';
	if (pathname === '/statistik') return 'statistik';
	if (pathname.startsWith('/inventory/')) return 'inventory';
	return null;
}

export function shouldShowPageHint(hintId: PageHintId, userId?: string | null): boolean {
	if (typeof localStorage === 'undefined' || !userId) return false;
	return localStorage.getItem(storageKey(hintId, userId)) !== '1';
}

export function dismissPageHint(hintId: PageHintId, userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) return;
	localStorage.setItem(storageKey(hintId, userId), '1');
}

export function resetPageHints(userId?: string | null): void {
	if (typeof localStorage === 'undefined' || !userId) return;
	for (const hintId of PAGE_HINT_IDS) {
		localStorage.removeItem(storageKey(hintId, userId));
	}
}
