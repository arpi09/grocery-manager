import type { HouseholdRole } from '$lib/domain/household';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import {
	detectDedupeWarningsForKeys,
	type DedupeWarning
} from '$lib/domain/dedupe-autopilot';
import { normalizeInventoryItemName } from '$lib/domain/inventory-merge';
import { isItemFinished } from '$lib/domain/inventory-item';
import type { InventoryService } from '$lib/application/inventory.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import { missingIngredientToListItem } from '$lib/server/recipe-prompt';

export interface RecipeToShoppingDedupeEntry {
	name: string;
	normalizedKey: string;
	warnings: DedupeWarning[];
	skipped: boolean;
}

export interface AddRecipeMissingToShoppingResult {
	added: number;
	skipped: number;
	dedupe: RecipeToShoppingDedupeEntry[];
}

export interface AddRecipeMissingToShoppingInput {
	householdId: string;
	role: HouseholdRole;
	ingredients: string[];
	inventoryService: InventoryService;
	shoppingListService: ShoppingListService;
	purchasePatternService: PurchasePatternService;
	/** When true, skip items with any dedupe warning (autopilot). Default true. */
	autopilotSkip?: boolean;
}

function shouldAutopilotSkip(warnings: DedupeWarning[]): boolean {
	return warnings.some(
		(warning) =>
			warning.kind === 'on_list' ||
			warning.kind === 'overstock' ||
			warning.kind === 'recent_purchase'
	);
}

export async function addRecipeMissingToShoppingWithDedupe(
	input: AddRecipeMissingToShoppingInput
): Promise<AddRecipeMissingToShoppingResult> {
	const autopilotSkip = input.autopilotSkip !== false;
	const [inventory, dedupeContext] = await Promise.all([
		input.inventoryService.listAll(input.householdId),
		input.purchasePatternService.getDedupeContext(input.householdId)
	]);

	const activeItems = inventory.filter((item) => !isItemFinished(item));
	const normalizedKeys = input.ingredients.map((name) => normalizeInventoryItemName(name));
	const warningsByKey = detectDedupeWarningsForKeys(normalizedKeys, {
		activeItems,
		recentLines: dedupeContext.recentLines,
		listNormalizedNames: dedupeContext.listNormalizedNames
	});

	const dedupe: RecipeToShoppingDedupeEntry[] = [];
	const toAdd: CreateShoppingListItemInput[] = [];

	for (const name of input.ingredients) {
		const normalizedKey = normalizeInventoryItemName(name);
		const warnings = warningsByKey[normalizedKey] ?? [];
		const skipped = autopilotSkip && shouldAutopilotSkip(warnings);
		dedupe.push({ name, normalizedKey, warnings, skipped });
		if (!skipped) {
			toAdd.push(missingIngredientToListItem(name));
		}
	}

	const listResult = await input.shoppingListService.addSuggestedItems(
		input.householdId,
		input.role,
		toAdd
	);

	return {
		added: listResult.added,
		skipped: listResult.skipped + dedupe.filter((entry) => entry.skipped).length,
		dedupe
	};
}
