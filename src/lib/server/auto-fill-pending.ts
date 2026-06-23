import type { ShoppingSuggestion } from '$lib/server/shopping-suggestions';

export const AUTO_FILL_PENDING_TTL_MS = 60 * 60 * 1000;

interface AutoFillPendingEntry {
	householdId: string;
	userId: string;
	items: ShoppingSuggestion[];
	note: string | null;
	createdAt: number;
}

const pendingByKey = new Map<string, AutoFillPendingEntry>();

function keyFor(householdId: string, userId: string): string {
	return `${householdId}:${userId}`;
}

function purgeExpired(now = Date.now()): void {
	for (const [key, entry] of pendingByKey) {
		if (now - entry.createdAt > AUTO_FILL_PENDING_TTL_MS) {
			pendingByKey.delete(key);
		}
	}
}

export function storeAutoFillPending(params: {
	householdId: string;
	userId: string;
	items: ShoppingSuggestion[];
	note: string | null;
}): void {
	purgeExpired();
	pendingByKey.set(keyFor(params.householdId, params.userId), {
		...params,
		createdAt: Date.now()
	});
}

export function takeAutoFillPending(
	householdId: string,
	userId: string
): { items: ShoppingSuggestion[]; note: string | null } | null {
	purgeExpired();
	const key = keyFor(householdId, userId);
	const entry = pendingByKey.get(key);
	if (!entry) return null;
	pendingByKey.delete(key);
	return { items: entry.items, note: entry.note };
}

export function peekAutoFillPending(
	householdId: string,
	userId: string
): { count: number; preview: string[]; note: string | null } | null {
	purgeExpired();
	const entry = pendingByKey.get(keyFor(householdId, userId));
	if (!entry) return null;
	return {
		count: entry.items.length,
		preview: entry.items.slice(0, 3).map((item) => item.name),
		note: entry.note
	};
}

/** Test-only */
export function clearAutoFillPendingStoreForTests(): void {
	pendingByKey.clear();
}
