import type { ShoppingListItem } from '$lib/domain/shopping-list-item';

export async function fetchCheckedShoppingItems(): Promise<{
	items: ShoppingListItem[];
	total: number;
}> {
	const response = await fetch('/api/shopping/data?section=checked');
	if (!response.ok) {
		throw new Error(`Shopping data request failed (${response.status})`);
	}

	return (await response.json()) as { items: ShoppingListItem[]; total: number };
}
