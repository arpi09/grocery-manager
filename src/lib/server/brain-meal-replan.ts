import { resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import { getRecipeExpiringContext } from '$lib/domain/recipe-expiring-context';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent, type MealIntent } from '$lib/domain/recipe';
import type { RecipeIdea } from '$lib/domain/meal-plan';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import { sortInventoryByUrgency } from '$lib/server/inventory-context';
import {
	generateRecipesWithRefinement,
	loadRecipeGenerationContext
} from '$lib/server/recipe-generation';
import type { HouseholdSuggestionsService } from '$lib/application/household-suggestions.service';
import type { HouseholdService } from '$lib/application/household.service';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import type { StructuredJsonResult } from '$lib/server/openai';

export interface MealSkipReplanResult {
	expiringItems: Array<{
		id: string;
		name: string;
		expiresOn: string | null;
		location: string;
		urgencyRank: number;
	}>;
	suggestions: RecipeIdea[];
	portions: number;
}

export interface RunMealSkipReplanInput {
	apiKey: string;
	householdId: string;
	userId: string;
	mealId: string;
	locale: string;
	portions?: number;
	mealIntent?: MealIntent;
	replan?: boolean;
	inventoryService: InventoryService;
	mealPlanService: MealPlanService;
	householdSuggestionsService: HouseholdSuggestionsService;
	householdService: HouseholdService;
}

export type RunMealSkipReplanOutcome =
	| { ok: true; result: MealSkipReplanResult }
	| { ok: false; stage: 'not_found' }
	| { ok: false; stage: 'recipes'; result: Extract<StructuredJsonResult, { ok: false }> };

export async function runMealSkipReplan(
	input: RunMealSkipReplanInput
): Promise<RunMealSkipReplanOutcome> {
	const portions = clampRecipePortions(input.portions ?? DEFAULT_RECIPE_PORTIONS);
	const mealIntent = input.mealIntent ?? parseMealIntent(undefined);
	const locale = input.locale === 'en' ? 'en' : 'sv';
	const replan = input.replan !== false;

	try {
		await input.mealPlanService.deletePlannedMeal(input.userId, input.mealId);
	} catch {
		return { ok: false, stage: 'not_found' };
	}

	const inventory = await input.inventoryService.listAll(input.householdId);
	const sorted = sortInventoryByUrgency(inventory.filter((item) => item.quantity !== '0'));
	const { expiringItems, recipeExpiringItems, expiringItemNames } =
		getRecipeExpiringContext(inventory);

	const expiringPayload = sorted
		.filter((item) => expiringItems.some((entry) => entry.id === item.id))
		.map((item, index) => ({
			id: item.id,
			name: item.name,
			expiresOn: item.expiresOn,
			location: item.location,
			urgencyRank: index + 1
		}));

	let suggestions: RecipeIdea[] = [];

	if (replan && recipeExpiringItems.length > 0) {
		const maxRecipes = Math.min(3, resolveEatFirstWeekMealCount(expiringItems.length));

		const recipeContext = await loadRecipeGenerationContext({
			userId: input.userId,
			householdId: input.householdId,
			mealPlanService: input.mealPlanService,
			householdSuggestionsService: input.householdSuggestionsService,
			householdService: input.householdService
		});

		const generated = await generateRecipesWithRefinement({
			apiKey: input.apiKey,
			inventory,
			portions,
			mode: 'eat_first',
			expiringItemNames,
			expiringItems: recipeExpiringItems,
			maxRecipes,
			mealIntent,
			locale,
			...recipeContext
		});

		if (!generated.ok) {
			return { ok: false, stage: 'recipes', result: generated.result };
		}

		if (generated.recipes.length > 0) {
			suggestions = await input.mealPlanService.storeGeneratedIdeas(
				input.userId,
				generated.recipes
			);
		}
	}

	return {
		ok: true,
		result: {
			expiringItems: expiringPayload,
			suggestions,
			portions
		}
	};
}
