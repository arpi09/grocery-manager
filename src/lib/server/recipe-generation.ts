import { filterInventoryForRecipes } from '$lib/domain/recipe-inventory-filter';
import { daysUntilExpiry } from '$lib/domain/expiry';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { DEFAULT_MEAL_INTENT, type MealIntent } from '$lib/domain/recipe';
import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';
import { isRecipeRefinementEnabled } from '$lib/server/feature-flags';
import { OPENAI_MODEL_NANO, requestStructuredJson, type StructuredJsonResult } from '$lib/server/openai';
import {
	formatStructuredInventoryPayload,
	upcomingDateRange,
	type VelocityHintRow
} from '$lib/server/inventory-context';
import { normalizePromptLocale } from '$lib/server/ai-prompt-shared';
import {
	buildRecipeRefinementSystemPrompt,
	buildRecipeRefinementUserPrompt,
	buildRecipeSystemPrompt,
	buildRecipeUserPrompt,
	inventoryNameList,
	sanitizeRecipesAgainstInventory,
	type ExpiringFocusRow,
	type RecipeUserPromptContext
} from '$lib/server/recipe-prompt';
import {
	parseRecipeSuggestions,
	RECIPE_SUGGESTIONS_SCHEMA,
	type RecipeSuggestion
} from '$lib/server/recipe-suggestions';
import { consumptionRepository } from '$lib/server/di';

export type RecipeGenerationMode = 'standard' | 'eat_first';

const QUICK_REFINEMENT_SKIP_INVENTORY_MAX = 12;
const VELOCITY_HINT_MIN_SAMPLES = 3;
const VELOCITY_HINT_MAX = 8;

export interface GenerateRecipesInput {
	apiKey: string;
	inventory: InventoryItem[];
	portions: number;
	preferences?: string;
	mode?: RecipeGenerationMode;
	expiringItemNames?: string[];
	expiringItems?: InventoryItem[];
	maxRecipes?: number;
	mealIntent?: MealIntent;
	locale?: string;
	householdSize?: number;
	recentlyFinished?: string[];
	plannedMeals?: PlannedMeal[];
	recipeIdeas?: RecipeIdea[];
	velocityHints?: VelocityHintRow[];
}

export type GenerateRecipesResult =
	| { ok: true; recipes: RecipeSuggestion[]; noteKey?: 'recipe.noSuitableInventoryNote' }
	| { ok: false; result: Extract<StructuredJsonResult, { ok: false }> };

export type RequestStructuredJsonFn = typeof requestStructuredJson;

export interface RecipeGenerationContext {
	plannedMeals: PlannedMeal[];
	recipeIdeas: RecipeIdea[];
	velocityHints: VelocityHintRow[];
	householdSize: number;
	recentlyFinished: string[];
}

export interface LoadRecipeGenerationContextInput {
	userId: string;
	householdId: string | null;
	householdSizeOverride?: number;
	mealPlanService: {
		listPlannedMealsByRange(
			userId: string,
			fromDate: string,
			toDate: string
		): Promise<PlannedMeal[]>;
		listRecipeIdeas(userId: string, limit: number): Promise<RecipeIdea[]>;
	};
	householdSuggestionsService: {
		getSnapshot(householdId: string): Promise<{
			shelfLifeRules: Array<{
				displayName: string;
				location: InventoryItem['location'];
				typicalDays: number;
				sampleCount: number;
			}>;
		} | null>;
	};
	householdService: {
		getHouseholdForUser(userId: string): Promise<{ members: { length: number } } | null>;
	};
}

/** Shared enrichment for recipe generation (planned meals, velocity hints, household size). */
export async function loadRecipeGenerationContext(
	input: LoadRecipeGenerationContextInput
): Promise<RecipeGenerationContext> {
	const { fromDate, toDate } = upcomingDateRange(10);
	const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const householdId = input.householdId;

	const [plannedMeals, recipeIdeas, householdSnapshot, recentlyFinished, household] =
		await Promise.all([
			input.mealPlanService.listPlannedMealsByRange(input.userId, fromDate, toDate),
			input.mealPlanService.listRecipeIdeas(input.userId, 8),
			householdId
				? input.householdSuggestionsService.getSnapshot(householdId)
				: Promise.resolve(null),
			householdId
				? consumptionRepository.listRecentConsumedProductNames(householdId, since, 10)
				: Promise.resolve([]),
			input.householdService.getHouseholdForUser(input.userId)
		]);

	const memberCount = household?.members.length ?? 0;
	const householdSize =
		typeof input.householdSizeOverride === 'number' &&
		input.householdSizeOverride >= 1 &&
		input.householdSizeOverride <= 8
			? Math.round(input.householdSizeOverride)
			: memberCount >= 1 && memberCount <= 8
				? memberCount
				: 2;

	return {
		plannedMeals,
		recipeIdeas,
		velocityHints: householdSnapshot
			? selectVelocityHints(householdSnapshot.shelfLifeRules)
			: [],
		householdSize,
		recentlyFinished
	};
}

async function runRecipePass(
	requestJson: RequestStructuredJsonFn,
	apiKey: string,
	systemPrompt: string,
	userPrompt: string,
	model?: string
): Promise<StructuredJsonResult> {
	return requestJson(apiKey, {
		systemPrompt,
		userPrompt,
		schemaName: 'recipe_suggestions',
		schema: RECIPE_SUGGESTIONS_SCHEMA,
		model
	});
}

function buildExpiringFocus(
	expiringItems: InventoryItem[],
	expiringItemNames: string[],
	inventory: InventoryItem[]
): ExpiringFocusRow[] {
	const byName = new Map(inventory.map((item) => [item.name.trim().toLowerCase(), item]));

	if (expiringItems.length > 0) {
		return expiringItems.map((item) => ({
			id: item.id,
			name: item.name,
			daysUntilExpiry: item.expiresOn ? daysUntilExpiry(item.expiresOn) : null
		}));
	}

	return expiringItemNames
		.map((name) => {
			const item = byName.get(name.trim().toLowerCase());
			if (!item) {
				return { id: '', name, daysUntilExpiry: null };
			}
			return {
				id: item.id,
				name: item.name,
				daysUntilExpiry: item.expiresOn ? daysUntilExpiry(item.expiresOn) : null
			};
		})
		.filter((row) => row.name.trim());
}

function eatFirstRefinementContext(
	expiringFocus: ExpiringFocusRow[],
	locale: string
): string {
	if (expiringFocus.length === 0) {
		return '';
	}
	const lang = normalizePromptLocale(locale);
	const lines = expiringFocus.map((row) => {
		const days =
			row.daysUntilExpiry === null
				? ''
				: lang === 'en'
					? ` (${row.daysUntilExpiry}d)`
					: ` (${row.daysUntilExpiry} d)`;
		return `- [${row.id || '?'}] ${row.name}${days}`;
	});
	if (lang === 'en') {
		return [
			'Prioritize using these expiring items (at least one per recipe when possible):',
			...lines,
			'Each expiring item should fit naturally in a credible dish — do not combine randomly just because both expire soon.'
		].join('\n');
	}
	return [
		'Prioritera att använda dessa varor som går ut snart (minst en per recept om möjligt):',
		...lines,
		'Varje utgående vara ska ingå naturligt i en trovärdig rätt — kombinera inte utgående varor slumpmässigt bara för att båda går ut snart.'
	].join('\n');
}

function eatFirstPreferences(
	preferences: string,
	expiringFocus: ExpiringFocusRow[],
	locale: string
): string {
	const lang = normalizePromptLocale(locale);
	const parts: string[] = [];
	if (expiringFocus.length > 0) {
		const names = expiringFocus
			.slice(0, 8)
			.map((row) => row.name)
			.join(', ');
		parts.push(
			lang === 'en'
				? `Eat-first focus: prioritize expiring items (${names}) in realistic everyday dishes`
				: `Fokus "Ät det först": prioritera varor som går ut snart (${names}) i realistiska vardagsrätter`
		);
	}
	if (preferences.trim()) {
		parts.push(preferences.trim());
	}
	return parts.join('. ');
}

function shouldSkipRefinement(mealIntent: MealIntent, inventoryCount: number): boolean {
	return mealIntent === 'quick' && inventoryCount <= QUICK_REFINEMENT_SKIP_INVENTORY_MAX;
}

function buildPromptContext(input: {
	locale: string;
	portions: number;
	mealIntent: MealIntent;
	recipeInventory: InventoryItem[];
	preferences: string;
	mode: RecipeGenerationMode;
	expiringItems: InventoryItem[];
	expiringItemNames: string[];
	plannedMeals?: PlannedMeal[];
	recipeIdeas?: RecipeIdea[];
	velocityHints?: VelocityHintRow[];
	householdSize?: number;
	recentlyFinished?: string[];
}): RecipeUserPromptContext {
	const locale = normalizePromptLocale(input.locale);
	const expiringFocus =
		input.mode === 'eat_first'
			? buildExpiringFocus(input.expiringItems, input.expiringItemNames, input.recipeInventory)
			: undefined;

	return {
		locale,
		portions: input.portions,
		mealIntent: input.mealIntent,
		inventoryPayload: formatStructuredInventoryPayload(input.recipeInventory, locale, {
			portions: input.portions
		}),
		preferences:
			input.mode === 'eat_first'
				? eatFirstPreferences(input.preferences, expiringFocus ?? [], locale)
				: input.preferences,
		plannedMeals: input.plannedMeals?.map((meal) => ({
			date: meal.plannedDate,
			title: meal.title
		})),
		avoidTitles: input.recipeIdeas?.map((idea) => idea.title).filter(Boolean),
		expiringFocus,
		velocityHints: input.velocityHints,
		householdSize: input.householdSize,
		recentlyFinished: input.recentlyFinished
	};
}

/** Pick shelf-life rules with enough samples for velocity hints. */
export function selectVelocityHints(
	rules: Array<{ displayName: string; location: InventoryItem['location']; typicalDays: number; sampleCount: number }>
): VelocityHintRow[] {
	return rules
		.filter((rule) => rule.sampleCount >= VELOCITY_HINT_MIN_SAMPLES)
		.sort((a, b) => b.sampleCount - a.sampleCount)
		.slice(0, VELOCITY_HINT_MAX)
		.map((rule) => ({
			displayName: rule.displayName,
			location: rule.location,
			typicalDays: rule.typicalDays,
			sampleCount: rule.sampleCount
		}));
}

/**
 * Two-pass recipe pipeline: draft generation → refinement (mellan-prompt) → inventory sanitize.
 * Both LLM calls share one ai_scan quota at the API layer.
 */
export async function generateRecipesWithRefinement(
	input: GenerateRecipesInput,
	requestJson: RequestStructuredJsonFn = requestStructuredJson
): Promise<GenerateRecipesResult> {
	const {
		apiKey,
		inventory,
		portions,
		preferences = '',
		mode = 'standard',
		expiringItemNames = [],
		expiringItems = [],
		maxRecipes = mode === 'eat_first' ? 5 : 4,
		mealIntent = DEFAULT_MEAL_INTENT,
		locale = 'sv',
		plannedMeals,
		recipeIdeas,
		velocityHints,
		householdSize = 2,
		recentlyFinished = []
	} = input;

	const recipeInventory = filterInventoryForRecipes(inventory);
	if (recipeInventory.length === 0) {
		return { ok: true, recipes: [], noteKey: 'recipe.noSuitableInventoryNote' };
	}

	const promptLocale = normalizePromptLocale(locale);
	const promptContext = buildPromptContext({
		locale: promptLocale,
		portions,
		mealIntent,
		recipeInventory,
		preferences,
		mode,
		expiringItems,
		expiringItemNames,
		plannedMeals,
		recipeIdeas,
		velocityHints,
		householdSize,
		recentlyFinished
	});
	const inventoryNames = inventoryNameList(recipeInventory);
	const skipRefinement =
		!isRecipeRefinementEnabled() || shouldSkipRefinement(mealIntent, recipeInventory.length);
	const systemPromptOptions = {
		requireExpiringFocus:
			mode === 'eat_first' && (promptContext.expiringFocus?.length ?? 0) > 0,
		draftOnly: skipRefinement
	};

	const draftResult = await runRecipePass(
		requestJson,
		apiKey,
		buildRecipeSystemPrompt(portions, promptLocale, systemPromptOptions),
		buildRecipeUserPrompt(promptContext)
	);

	if (!draftResult.ok) {
		return { ok: false, result: draftResult };
	}

	const draftRecipes = parseRecipeSuggestions(draftResult.data);
	if (draftRecipes.length === 0) {
		return { ok: false, result: { ok: false, status: 422, messageKey: 'errors.api.openAiInvalidJson' } };
	}

	if (skipRefinement) {
		const recipes = sanitizeRecipesAgainstInventory(
			draftRecipes,
			inventoryNames,
			recipeInventory
		).slice(0, maxRecipes);
		if (recipes.length === 0) {
			return { ok: true, recipes: [], noteKey: 'recipe.noSuitableInventoryNote' };
		}
		return { ok: true, recipes };
	}

	const refinementContext =
		mode === 'eat_first' ? eatFirstRefinementContext(promptContext.expiringFocus ?? [], promptLocale) : undefined;

	const refineResult = await runRecipePass(
		requestJson,
		apiKey,
		buildRecipeRefinementSystemPrompt(portions, promptLocale),
		buildRecipeRefinementUserPrompt(
			JSON.stringify({ recipes: draftRecipes }),
			promptContext,
			refinementContext
		),
		OPENAI_MODEL_NANO
	);

	if (!refineResult.ok) {
		const sanitizedDraft = sanitizeRecipesAgainstInventory(
			draftRecipes,
			inventoryNames,
			recipeInventory
		).slice(0, maxRecipes);
		if (sanitizedDraft.length > 0) {
			return { ok: true, recipes: sanitizedDraft };
		}
		return { ok: false, result: refineResult };
	}

	const refined = parseRecipeSuggestions(refineResult.data);
	const recipes = sanitizeRecipesAgainstInventory(
		refined.length > 0 ? refined : draftRecipes,
		inventoryNames,
		recipeInventory
	).slice(0, maxRecipes);

	if (recipes.length === 0) {
		return { ok: true, recipes: [], noteKey: 'recipe.noSuitableInventoryNote' };
	}

	return { ok: true, recipes };
}
