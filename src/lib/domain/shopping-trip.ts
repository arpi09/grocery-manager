import type { ShoppingListItem } from './shopping-list-item';

export const MAX_MEMORY_SUGGESTIONS = 3;
export const MAX_PEEK_QUEUE = 3;
export const MAX_SUMMARY_NAME_PILLS = 3;

export type ShoppingTripMode = 'plan' | 'shop';

export interface TripProgress {
	picked: number;
	total: number;
	remaining: number;
	percent: number;
}

export function sortUncheckedItems(items: ShoppingListItem[]): ShoppingListItem[] {
	return items
		.filter((item) => !item.checked)
		.sort(
			(a, b) =>
				a.sortOrder - b.sortOrder ||
				a.createdAt.getTime() - b.createdAt.getTime() ||
				a.name.localeCompare(b.name, 'sv')
		);
}

export function getTripProgress(picked: number, total: number): TripProgress {
	const safeTotal = Math.max(total, 0);
	const safePicked = Math.min(Math.max(picked, 0), safeTotal);
	const remaining = Math.max(safeTotal - safePicked, 0);

	return {
		picked: safePicked,
		total: safeTotal,
		remaining,
		percent: safeTotal === 0 ? 0 : Math.round((safePicked / safeTotal) * 100)
	};
}

export function getFocusItem(
	items: ShoppingListItem[],
	focusIndex: number
): ShoppingListItem | null {
	const unchecked = sortUncheckedItems(items);
	return unchecked[focusIndex] ?? null;
}

export function getPeekQueue(
	items: ShoppingListItem[],
	focusIndex: number,
	max = MAX_PEEK_QUEUE
): ShoppingListItem[] {
	const unchecked = sortUncheckedItems(items);
	return unchecked.slice(focusIndex + 1, focusIndex + 1 + max);
}

export function getPeekOverflowCount(
	items: ShoppingListItem[],
	focusIndex: number,
	max = MAX_PEEK_QUEUE
): number {
	const unchecked = sortUncheckedItems(items);
	const afterPeek = unchecked.length - (focusIndex + 1 + max);
	return Math.max(afterPeek, 0);
}

export function clampFocusIndex(focusIndex: number, uncheckedCount: number): number {
	if (uncheckedCount <= 0) {
		return 0;
	}
	return Math.min(Math.max(focusIndex, 0), uncheckedCount - 1);
}

export function limitMemorySuggestions<T>(suggestions: T[], max = MAX_MEMORY_SUGGESTIONS): T[] {
	return suggestions.slice(0, max);
}

export function getSummaryNamePills(
	items: ShoppingListItem[],
	max = MAX_SUMMARY_NAME_PILLS
): { names: string[]; overflow: number } {
	const unchecked = sortUncheckedItems(items);
	return {
		names: unchecked.slice(0, max).map((item) => item.name),
		overflow: Math.max(unchecked.length - max, 0)
	};
}

export function isTripComplete(picked: number, total: number): boolean {
	return total > 0 && picked >= total;
}
