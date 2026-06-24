import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { isExcludedFromRecipes } from '$lib/domain/recipe-inventory-filter';

export interface RecipeExpiringContext {
	expiringItems: InventoryItem[];
	recipeExpiringItems: InventoryItem[];
	expiringItemNames: string[];
}

/** Expiring inventory slice for eat-first / weekly-plan recipe generation. */
export function getRecipeExpiringContext(inventory: InventoryItem[]): RecipeExpiringContext {
	const expiringItems = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
	const recipeExpiringItems = expiringItems.filter(
		(item) => !isExcludedFromRecipes(item.name, item.notes)
	);
	const expiringItemNames = recipeExpiringItems
		.map((item) => item.name.trim())
		.filter(Boolean);

	return { expiringItems, recipeExpiringItems, expiringItemNames };
}

export function mapExpiringItemsPayload(
	expiringItems: InventoryItem[]
): Array<{ id: string; name: string; expiresOn: string | null; location: string }> {
	return expiringItems.map((item) => ({
		id: item.id,
		name: item.name,
		expiresOn: item.expiresOn,
		location: item.location
	}));
}
