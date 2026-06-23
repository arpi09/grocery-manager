import type { HouseholdRole } from '$lib/domain/household';
import { resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isExcludedFromRecipes } from '$lib/domain/recipe-inventory-filter';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent, type MealIntent } from '$lib/domain/recipe';
import type { RecipeIdea } from '$lib/domain/meal-plan';
import { distributeMealDates } from '$lib/domain/weekly-ritual';
import type { InventoryService } from '$lib/application/inventory.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { PROMPT_VERSION_WEEKLY_PLAN } from '$lib/server/ai-prompt-shared';
import { logBrainMetrics } from '$lib/server/brain-metrics';
import { upcomingDateRange } from '$lib/server/inventory-context';
import { generateRecipesWithRefinement, selectVelocityHints } from '$lib/server/recipe-generation';
import {
	generateShoppingSuggestions,
	suggestionToListItem,
	type ShoppingSuggestion
} from '$lib/server/shopping-suggestions';
import { consumptionRepository } from '$lib/server/di';
import type { HouseholdSuggestionsService } from '$lib/application/household-suggestions.service';
import type { HouseholdService } from '$lib/application/household.service';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import type { StructuredJsonResult } from '$lib/server/openai';

export interface WeeklyPlanMealSlot {
	ideaId: string;
	title: string;
	plannedDate: string;
}

export interface WeeklyPlanResult {
	promptVersion: string;
	recipes: RecipeIdea[];
	mealSlots: WeeklyPlanMealSlot[];
	shoppingItems: ShoppingSuggestion[];
	shoppingNote: string | null;
	expiringItems: Array<{
		id: string;
		name: string;
		expiresOn: string | null;
		location: string;
	}>;
	portions: number;
	recipeNote?: string;
}

export interface RunWeeklyPlanInput {
	apiKey: string;
	householdId: string;
	userId: string;
	locale: string;
	portions?: number;
	mealIntent?: MealIntent;
	preferences?: string;
	householdSize?: number;
	inventoryService: InventoryService;
	mealPlanService: MealPlanService;
	shoppingListService: ShoppingListService;
	householdSuggestionsService: HouseholdSuggestionsService;
	householdService: HouseholdService;
	learningFeedbackRepository?: ILearningFeedbackRepository;
}

export type RunWeeklyPlanOutcome =
	| { ok: true; plan: WeeklyPlanResult }
	| { ok: false; stage: 'recipes' | 'shopping'; result: Extract<StructuredJsonResult, { ok: false }> }
	| { ok: false; stage: 'empty'; messageKey: 'recipe.noInventoryNote' | 'recipe.noSuitableInventoryNote' };

export async function runWeeklyPlanOrchestrator(
	input: RunWeeklyPlanInput
): Promise<RunWeeklyPlanOutcome> {
	const portions = clampRecipePortions(input.portions ?? DEFAULT_RECIPE_PORTIONS);
	const mealIntent = input.mealIntent ?? parseMealIntent(undefined);
	const locale = input.locale === 'en' ? 'en' : 'sv';

	const inventory = await input.inventoryService.listAll(input.householdId);
	if (inventory.length === 0) {
		return { ok: false, stage: 'empty', messageKey: 'recipe.noInventoryNote' };
	}

	const expiringItems = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
	const recipeExpiringItems = expiringItems.filter(
		(item) => !isExcludedFromRecipes(item.name, item.notes)
	);
	const expiringItemNames = recipeExpiringItems
		.map((item) => item.name.trim())
		.filter(Boolean);

	const maxRecipes = resolveEatFirstWeekMealCount(expiringItems.length);
	const { fromDate, toDate } = upcomingDateRange(10);
	const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const [plannedMeals, recipeIdeas, householdSnapshot, recentlyFinished, household] =
		await Promise.all([
			input.mealPlanService.listPlannedMealsByRange(input.userId, fromDate, toDate),
			input.mealPlanService.listRecipeIdeas(input.userId, 8),
			input.householdSuggestionsService.getSnapshot(input.householdId),
			consumptionRepository.listRecentConsumedProductNames(input.householdId, since, 10),
			input.householdService.getHouseholdForUser(input.userId)
		]);

	const memberCount = household?.members.length ?? 0;
	const householdSize =
		typeof input.householdSize === 'number' && input.householdSize >= 1 && input.householdSize <= 8
			? Math.round(input.householdSize)
			: memberCount >= 1 && memberCount <= 8
				? memberCount
				: 2;

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
		plannedMeals,
		recipeIdeas,
		velocityHints: householdSnapshot
			? selectVelocityHints(householdSnapshot.shelfLifeRules)
			: [],
		householdSize,
		recentlyFinished
	});

	if (!generated.ok) {
		return { ok: false, stage: 'recipes', result: generated.result };
	}

	if (generated.recipes.length === 0) {
		return { ok: false, stage: 'empty', messageKey: generated.noteKey ?? 'recipe.noSuitableInventoryNote' };
	}

	const savedIdeas = await input.mealPlanService.storeGeneratedIdeas(input.userId, generated.recipes);
	const mealDates = distributeMealDates(savedIdeas.length);
	const mealSlots: WeeklyPlanMealSlot[] = savedIdeas.slice(0, mealDates.length).map((idea, index) => ({
		ideaId: idea.id,
		title: idea.title,
		plannedDate: mealDates[index]!
	}));

	const shopping = await generateShoppingSuggestions(
		{
			apiKey: input.apiKey,
			householdId: input.householdId,
			userId: input.userId,
			inventoryService: input.inventoryService,
			mealPlanService: input.mealPlanService,
			shoppingListService: input.shoppingListService,
			learningFeedbackRepository: input.learningFeedbackRepository
		},
		{
			preferences: input.preferences,
			householdSize,
			locale
		}
	);

	if (!shopping.ok) {
		return { ok: false, stage: 'shopping', result: { ok: false, status: shopping.status, messageKey: shopping.messageKey } };
	}

	logBrainMetrics('weekly_plan', {
		source: 'weekly_plan',
		promptVersion: PROMPT_VERSION_WEEKLY_PLAN,
		inputTokenEstimate: savedIdeas.length
	});

	return {
		ok: true,
		plan: {
			promptVersion: PROMPT_VERSION_WEEKLY_PLAN,
			recipes: savedIdeas,
			mealSlots,
			shoppingItems: shopping.items,
			shoppingNote: shopping.note,
			expiringItems: expiringItems.map((item) => ({
				id: item.id,
				name: item.name,
				expiresOn: item.expiresOn,
				location: item.location
			})),
			portions
		}
	};
}

export interface ApplyWeeklyPlanInput {
	userId: string;
	householdId: string;
	role: HouseholdRole;
	plan: Pick<WeeklyPlanResult, 'mealSlots' | 'shoppingItems'>;
	mealPlanService: MealPlanService;
	shoppingListService: ShoppingListService;
	addShoppingToList?: boolean;
	scheduleMeals?: boolean;
}

export async function applyWeeklyPlan(
	input: ApplyWeeklyPlanInput
): Promise<{ mealsScheduled: number; listAdded: number; listSkipped: number }> {
	let mealsScheduled = 0;
	let listAdded = 0;
	let listSkipped = 0;

	if (input.scheduleMeals !== false) {
		for (const slot of input.plan.mealSlots) {
			await input.mealPlanService.createPlannedMealFromIdea(
				input.userId,
				slot.ideaId,
				slot.plannedDate
			);
			mealsScheduled += 1;
		}
	}

	if (input.addShoppingToList !== false && input.plan.shoppingItems.length > 0) {
		const result = await input.shoppingListService.addSuggestedItems(
			input.householdId,
			input.role,
			input.plan.shoppingItems.map(suggestionToListItem)
		);
		listAdded = result.added;
		listSkipped = result.skipped;
	}

	return { mealsScheduled, listAdded, listSkipped };
}
