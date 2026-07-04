import type { InventoryItem } from './inventory-item';

/** Items the user says they have at home but that aren't in the app's pantry ("60 % data"). */
export const MAX_RECIPE_EXTRA_ITEMS = 12;
export const MAX_RECIPE_EXTRA_ITEM_LENGTH = 40;

export function parseRecipeExtraItems(raw: unknown): string[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	const seen = new Set<string>();
	const items: string[] = [];
	for (const entry of raw) {
		if (typeof entry !== 'string') {
			continue;
		}
		const name = entry.trim().slice(0, MAX_RECIPE_EXTRA_ITEM_LENGTH);
		const key = name.toLowerCase();
		if (!name || seen.has(key)) {
			continue;
		}
		seen.add(key);
		items.push(name);
		if (items.length >= MAX_RECIPE_EXTRA_ITEMS) {
			break;
		}
	}
	return items;
}

/**
 * In-memory pseudo pantry rows so the recipe pipeline (prompt + sanitize) treats
 * user-typed extras exactly like known inventory. Never persisted.
 */
export function buildPseudoInventoryForExtras(
	names: string[],
	householdId: string,
	userId: string
): InventoryItem[] {
	const now = new Date();
	return names.map((name, index) => ({
		id: `recipe-extra-${index}`,
		householdId,
		userId,
		name,
		location: 'cupboard' as const,
		quantity: '1',
		unit: null,
		expiresOn: null,
		expiresOnSource: null,
		notes: null,
		barcode: null,
		lastConfirmedAt: now,
		createdAt: now,
		updatedAt: now
	}));
}
