import { json } from '@sveltejs/kit';

import { resolveEatFirstWeekMealCount } from '$lib/domain/eat-first-week';
import {
	getRecipeExpiringContext,
	mapExpiringItemsPayload
} from '$lib/domain/recipe-expiring-context';
import { DEFAULT_RECIPE_PORTIONS, parseMealIntent } from '$lib/domain/recipe';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { clampRecipePortions } from '$lib/server/recipe-prompt';
import {
	generateRecipesWithRefinement,
	loadRecipeGenerationContext
} from '$lib/server/recipe-generation';
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

	const { expiringItems, recipeExpiringItems, expiringItemNames } =
		getRecipeExpiringContext(inventory);
	const expiringItemsPayload = mapExpiringItemsPayload(expiringItems);

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

	const recipeContext = await loadRecipeGenerationContext({
		userId: auth.user.id,
		householdId: locals.householdId,
		mealPlanService: locals.mealPlanService,
		householdSuggestionsService: locals.householdSuggestionsService,
		householdService: locals.householdService
	});

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
		...recipeContext
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
