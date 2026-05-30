import {
	DEFAULT_RECIPE_PORTIONS,
	MAX_RECIPE_PORTIONS,
	MIN_RECIPE_PORTIONS
} from '$lib/domain/recipe';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { CreateShoppingListItemInput } from '$lib/domain/shopping-list-item';
import type { RecipeSuggestion } from '$lib/server/recipe-suggestions';

export { DEFAULT_RECIPE_PORTIONS, MAX_RECIPE_PORTIONS, MIN_RECIPE_PORTIONS };

export function clampRecipePortions(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return DEFAULT_RECIPE_PORTIONS;
	}
	return Math.min(MAX_RECIPE_PORTIONS, Math.max(MIN_RECIPE_PORTIONS, Math.round(value)));
}

export function normalizeIngredientName(name: string): string {
	return name.trim().toLowerCase();
}

export function inventoryNameList(items: InventoryItem[]): string[] {
	return items.map((item) => item.name.trim()).filter(Boolean);
}

export function formatRecipeInventoryLines(items: InventoryItem[]): string {
	if (items.length === 0) {
		return '(tomt lager)';
	}

	return items
		.map((item) => {
			const unit = item.unit ? ` ${item.unit}` : '';
			const expires = item.expiresOn ? `, utgår ${item.expiresOn}` : '';
			const notes = item.notes ? ` (anteckning: ${item.notes})` : '';
			return `- ${item.name}: ${item.quantity}${unit} i ${item.location}${expires}${notes}`;
		})
		.join('\n');
}

export function buildRecipeSystemPrompt(portions: number): string {
	return [
		'Du är en praktisk svensk matlagningsassistent för hemmet.',
		`Skapa upp till 4 recept för exakt ${portions} portioner.`,
		'Använd ENDAST varor från lagret nedan — hitta inte på varor som inte listas.',
		'Fältet ingredientsToUse får bara innehålla exakta varunamn från lagerlistan (samma stavning).',
		'missingIngredients är endast för små tillbehör som inte finns i lagret (kryddor, olja, citron osv.) — aldrig huvudingredienser som redan finns i lagret.',
		'Prioritera varor med utgångsdatum och minska matsvinn.',
		'All text ska vara på svenska (sv-SE): title, whyItFits, ingredientsToUse, missingIngredients, steps.',
		'Varje recept ska innehålla:',
		'- title (kort rättnamn)',
		'- whyItFits (en kort mening om varför receptet passar lagret)',
		'- ingredientsToUse (array med exakta lagernamn)',
		'- missingIngredients (array, tom om inget saknas)',
		'- steps (korta steg som strängar, mängder anpassade till portionerna)',
		'Returnera endast giltig JSON i denna form:',
		'{"recipes":[{"title":"","whyItFits":"","ingredientsToUse":[],"missingIngredients":[],"steps":[]}]}',
		'Inga markdown-kodblock eller förklaringar utanför JSON.'
	].join('\n');
}

export function buildRecipeUserPrompt(
	inventoryLines: string,
	portions: number,
	preferences: string
): string {
	const parts = [
		`Antal portioner: ${portions}`,
		'Lager (enda tillåtna källor för ingredientsToUse — kopiera varunamn exakt):',
		inventoryLines
	];
	if (preferences) {
		parts.push(`Användarens önskemål: ${preferences}`);
	}
	return parts.join('\n\n');
}

export function ingredientMatchesInventory(ingredient: string, inventoryNames: string[]): boolean {
	const norm = normalizeIngredientName(ingredient);
	if (!norm) {
		return false;
	}
	return inventoryNames.some((name) => {
		const inv = normalizeIngredientName(name);
		return inv === norm || inv.includes(norm) || norm.includes(inv);
	});
}

export function sanitizeRecipeAgainstInventory(
	recipe: RecipeSuggestion,
	inventoryNames: string[]
): RecipeSuggestion | null {
	const ingredientsToUse: string[] = [];
	const missingSet = new Set<string>();

	for (const ing of recipe.missingIngredients) {
		const trimmed = ing.trim();
		if (trimmed) {
			missingSet.add(trimmed);
		}
	}

	for (const ing of recipe.ingredientsToUse) {
		const trimmed = ing.trim();
		if (!trimmed) {
			continue;
		}
		if (ingredientMatchesInventory(trimmed, inventoryNames)) {
			ingredientsToUse.push(trimmed);
		} else {
			missingSet.add(trimmed);
		}
	}

	const missingIngredients = [...missingSet].filter(
		(ing) => !ingredientMatchesInventory(ing, inventoryNames)
	);

	if (ingredientsToUse.length === 0 || recipe.steps.length === 0) {
		return null;
	}

	return {
		...recipe,
		ingredientsToUse,
		missingIngredients
	};
}

export function sanitizeRecipesAgainstInventory(
	recipes: RecipeSuggestion[],
	inventoryNames: string[]
): RecipeSuggestion[] {
	return recipes
		.map((recipe) => sanitizeRecipeAgainstInventory(recipe, inventoryNames))
		.filter((recipe): recipe is RecipeSuggestion => recipe !== null)
		.slice(0, 4);
}

export function missingIngredientToListItem(name: string): CreateShoppingListItemInput {
	const trimmed = name.trim().slice(0, 200);
	return {
		name: trimmed,
		quantity: '1 st',
		unit: null
	};
}

export function parseMissingIngredientsPayload(input: unknown): string[] {
	if (!input || typeof input !== 'object') {
		return [];
	}
	const ingredients = (input as { ingredients?: unknown }).ingredients;
	if (!Array.isArray(ingredients)) {
		return [];
	}
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of ingredients) {
		if (typeof value !== 'string') {
			continue;
		}
		const trimmed = value.trim().slice(0, 200);
		if (!trimmed) {
			continue;
		}
		const key = normalizeIngredientName(trimmed);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		result.push(trimmed);
		if (result.length >= 24) {
			break;
		}
	}
	return result;
}
