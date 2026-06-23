import { json } from '@sveltejs/kit';

import { resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import { isExcludedFromRecipes } from '$lib/domain/recipe-inventory-filter';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent } from '$lib/domain/recipe';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import { generateRecipesWithRefinement, selectVelocityHints } from '$lib/server/recipe-generation';
import { upcomingDateRange } from '$lib/server/inventory-context';
import { consumptionRepository } from '$lib/server/di';
import { normalizePromptLocale } from '$lib/server/ai-prompt-shared';
import { translate } from '$lib/i18n/messages';
import { e2eMockRecipeSuggestions, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const locale = locals.locale;
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const body = (await request.json().catch(() => ({}))) as {
		portions?: unknown;
		mealIntent?: unknown;
		scope?: unknown;
	};

	const scope = body.scope === 'week' ? 'week' : 'section';

	const portions = clampRecipePortions(body.portions ?? DEFAULT_RECIPE_PORTIONS);
	const mealIntent = parseMealIntent(body.mealIntent);

	const inventory = await locals.inventoryService.listAll(locals.householdId!);
	if (inventory.length === 0) {
		return json({
			suggestions: [],
			expiringItems: [],
			note: translate(locale, 'recipe.noInventoryNote')
		});
	}

	const expiringItems = filterItemsExpiringWithinDays(inventory, EXPIRING_SOON_DAYS);
	const recipeExpiringItems = expiringItems.filter(
		(item) => !isExcludedFromRecipes(item.name, item.notes)
	);
	const expiringItemNames = recipeExpiringItems
		.map((item) => item.name.trim())
		.filter(Boolean);

	const expiringItemsPayload = expiringItems.map((item) => ({
		id: item.id,
		name: item.name,
		expiresOn: item.expiresOn,
		location: item.location
	}));

	if (isE2eMockAiEnabled()) {
		const recipes = e2eMockRecipeSuggestions();
		const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, recipes);
		return json({
			suggestions: savedIdeas,
			expiringItems: expiringItemsPayload,
			portions
		});
	}

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	const apiKeyOrResponse = requireOpenAiKey(locale, 'eat-first suggestions', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const maxRecipes =
		scope === 'week' ? resolveEatFirstWeekMealCount(expiringItems.length) : 5;

	const { fromDate, toDate } = upcomingDateRange(10);
	const householdId = locals.householdId;
	const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const [plannedMeals, recipeIdeas, householdSnapshot, recentlyFinished, household] =
		await Promise.all([
			locals.mealPlanService.listPlannedMealsByRange(auth.user.id, fromDate, toDate),
			locals.mealPlanService.listRecipeIdeas(auth.user.id, 8),
			householdId
				? locals.householdSuggestionsService.getSnapshot(householdId)
				: Promise.resolve(null),
			householdId
				? consumptionRepository.listRecentConsumedProductNames(householdId, since, 10)
				: Promise.resolve([]),
			locals.householdService.getHouseholdForUser(auth.user.id)
		]);

	const memberCount = household?.members.length ?? 0;
	const householdSize = memberCount >= 1 && memberCount <= 8 ? memberCount : 2;

	const generated = await generateRecipesWithRefinement({
		apiKey,
		inventory,
		portions,
		mode: 'eat_first',
		expiringItemNames,
		expiringItems: recipeExpiringItems,
		maxRecipes,
		mealIntent,
		locale: normalizePromptLocale(locale),
		plannedMeals,
		recipeIdeas,
		velocityHints: householdSnapshot
			? selectVelocityHints(householdSnapshot.shelfLifeRules)
			: [],
		householdSize,
		recentlyFinished
	});

	if (!generated.ok) {
		console.warn(
			`[eat-first] OpenAI generation failed (${generated.result.status}): ${openAiErrorLogDetail(generated.result).slice(0, 500)}`
		);
		return json({ error: translateOpenAiError(locale, generated.result) }, { status: generated.result.status });
	}

	if (generated.recipes.length === 0) {
		return json({
			suggestions: [],
			expiringItems: expiringItemsPayload,
			portions,
			note: translate(locale, generated.noteKey ?? ('recipe.noSuitableInventoryNote' as const))
		});
	}

	const savedIdeas = await locals.mealPlanService.storeGeneratedIdeas(auth.user.id, generated.recipes);

	return json({
		suggestions: savedIdeas,
		expiringItems: expiringItemsPayload,
		portions
	});
};
